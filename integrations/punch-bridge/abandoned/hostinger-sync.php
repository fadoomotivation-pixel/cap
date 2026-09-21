<?php
/**
 * Punch sync — Hostinger MySQL → Supabase.
 *
 * The office PC has no SQL Server and eTimeTrackLite's Database Type list
 * offers only MS SQL Server, Oracle and My Sql. Capital Brix already pays for
 * MySQL on Hostinger, so the machine exports straight there over the internet
 * and this script — run by Hostinger's cron, next to the Baileys service —
 * forwards new rows to Supabase.
 *
 * What that buys over a bridge on the office PC: no SQL Server to install, no
 * Node on Windows, no Task Scheduler entry, and nothing extra to keep running
 * in the office. eTimeTrackLite has to be open anyway to pull punches off the
 * device; this adds no second thing that can be closed by accident.
 *
 * Design notes that matter if you change this:
 *
 * · It re-sends a LOOKBACK window every run rather than keeping a watermark.
 *   A watermark is one lost row away from losing punches, and losing them is
 *   silent. Re-sending costs nothing because cb_ingest_punches is idempotent
 *   on (device_code, punch_at).
 *
 * · It holds the ingest secret, not the service-role key. The secret can do
 *   exactly one thing — submit punches.
 *
 * · Punch times arrive as bare local IST. They are stamped +05:30 explicitly,
 *   because a bare timestamp is read as UTC by Postgres and would file every
 *   arrival five and a half hours early.
 *
 * Cron (hPanel → Advanced → Cron Jobs), every 2 minutes:
 *   /usr/bin/php /home/USER/domains/…/punch-sync/hostinger-sync.php >> sync.log 2>&1
 */

date_default_timezone_set('Asia/Kolkata');

$CFG = [
    // ── Hostinger MySQL (what eTimeTrackLite exports into) ──
    // Localhost here: the cron runs on the same host as the database, so this
    // connection never leaves the server. Only eTimeTrackLite connects to it
    // from outside, which is what Remote MySQL is for.
    'db_host' => 'localhost',
    'db_name' => '',   // e.g. u123456789_attendance
    'db_user' => '',
    'db_pass' => '',
    'db_table' => 'AttendanceLogs',

    // ── Supabase ──
    'supabase_url' => 'https://rqgkzamuohdvttnkluzn.supabase.co',
    'anon_key'     => '',   // Project Settings → API → anon public
    // select secret from cb_integration_secrets where name = 'punch_bridge';
    'ingest_secret' => '',

    // 36 hours covers an overnight outage and still catches yesterday's
    // evening punches.
    'lookback_hours' => 36,
];

function say(string $m): void {
    echo date('c') . ' ' . $m . PHP_EOL;
}

foreach (['db_name', 'db_user', 'anon_key', 'ingest_secret'] as $k) {
    if ($CFG[$k] === '') {
        say("ERROR: \$CFG['$k'] is empty — fill it in before running.");
        exit(1);
    }
}

try {
    $pdo = new PDO(
        "mysql:host={$CFG['db_host']};dbname={$CFG['db_name']};charset=utf8mb4",
        $CFG['db_user'],
        $CFG['db_pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Throwable $e) {
    say('ERROR connecting to MySQL: ' . $e->getMessage());
    exit(1);
}

$since = date('Y-m-d H:i:s', time() - $CFG['lookback_hours'] * 3600);

$stmt = $pdo->prepare(
    "select EmployeeCode, LogDateTime, Direction
       from `{$CFG['db_table']}`
      where LogDateTime >= :since
      order by LogDateTime asc"
);
$stmt->execute([':since' => $since]);

$punches = [];
foreach ($stmt as $row) {
    if ($row['EmployeeCode'] === null || $row['LogDateTime'] === null) continue;
    $punches[] = [
        'device_code' => trim((string) $row['EmployeeCode']),
        // India has no daylight saving, so a fixed offset is right all year.
        'punch_at'    => str_replace(' ', 'T', $row['LogDateTime']) . '+05:30',
        'direction'   => $row['Direction'] !== null && trim($row['Direction']) !== ''
            ? strtolower(trim($row['Direction'])) : null,
        'device_name' => null,
    ];
}

if (!$punches) {
    say('no punches in window');
    exit(0);
}

/** One batch to cb_ingest_punches. */
function send(array $CFG, array $batch): array {
    $ch = curl_init($CFG['supabase_url'] . '/rest/v1/rpc/cb_ingest_punches');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'apikey: ' . $CFG['anon_key'],
            'Authorization: Bearer ' . $CFG['anon_key'],
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'p_secret'  => $CFG['ingest_secret'],
            'p_punches' => $batch,
        ]),
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($body === false) throw new RuntimeException("curl: $err");
    if ($code !== 200) throw new RuntimeException("ingest $code: " . substr((string) $body, 0, 300));

    return json_decode((string) $body, true) ?: [];
}

$stored = 0;
$unknown = [];

// Chunked, so one run after a long outage does not send a single enormous
// body that the API rejects — which would lose the whole catch-up.
try {
    foreach (array_chunk($punches, 500) as $batch) {
        $out = send($CFG, $batch);
        $stored += (int) ($out['stored'] ?? 0);
        foreach (($out['unknown_device_codes'] ?? []) as $c) $unknown[$c] = true;
    }
} catch (Throwable $e) {
    // Exit non-zero so a failure shows in the cron mail, but do not try to
    // recover: the next run re-sends the same window anyway.
    say('ERROR ' . $e->getMessage());
    exit(1);
}

say('sent ' . count($punches) . ', new ' . $stored);

if ($unknown) {
    // Not a failure — these punches are stored and will attach to the right
    // person the moment HR fills in the device code.
    say('WARNING device codes with no employee on the roster: ' . implode(', ', array_keys($unknown)));
    say('  Fix: set cb_employees.device_code to the Emp Code shown in the');
    say('  eSSL Employee Punch Monitor.');
}
