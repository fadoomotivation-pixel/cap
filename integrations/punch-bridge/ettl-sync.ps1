<#
=============================================================================
  Punch sync — eTimeTrackLite's own Access database → Supabase
=============================================================================

  eTimeTrackLite keeps everything in eTimeTrackLite1.mdb. This reads the
  punches straight out of it. Parallel Database Export is not used and does
  not need to work: no MySQL, no SQL Server, no ODBC connector to install, no
  DSN. The Access driver this needs is already on the machine — it is what
  eTimeTrackLite itself uses.

  ---------------------------------------------------------------------------
  MUST run under 32-bit PowerShell
  ---------------------------------------------------------------------------
  eTimeTrackLite is 32-bit and the Access ODBC driver is registered 32-bit
  only, so the 64-bit host fails with IM002 "Data source name not found":

      C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe `
        -ExecutionPolicy Bypass -File ettl-sync.ps1

  ---------------------------------------------------------------------------
  Things that are the way they are for a reason
  ---------------------------------------------------------------------------
  · Punches live in MONTHLY tables. DeviceLogs itself is empty (verified: 0
    rows, while DeviceLogs_9_2026 held 1034). eSSL rolls each month into
    DeviceLogs_<month>_<year>, so this reads the current month, the previous
    month, and plain DeviceLogs — otherwise every 1st of the month would
    quietly stop syncing until somebody noticed the register was empty.

  · It re-reads a 36-hour window every run instead of keeping a watermark. A
    watermark is one lost file away from losing punches, silently. Re-sending
    is free: cb_ingest_punches is idempotent on (device_code, punch_at).

  · It holds the ingest secret, not the service-role key. This is a desktop
    people use; the worst a copied secret can do is submit punches.

  · LogDate is local IST with no zone attached, so +05:30 is stamped on
    explicitly. A bare timestamp is read as UTC by Postgres and would file
    every arrival five and a half hours early. India has no daylight saving,
    so the fixed offset is right all year.

  · Read-only, and safe to run while eTimeTrackLite has the database open —
    that open handle is what the .ldb file beside it is.
=============================================================================
#>

param(
    # Hours to re-read each run. 36 covers an overnight outage and still
    # catches yesterday evening's punches.
    [int]    $LookbackHours = 36,

    # Import everything in the database instead of the recent window. The
    # .mdb holds months of history, so this backfills the register in one go.
    [switch] $All,

    # Read and report, send nothing.
    [switch] $DryRun
)

# ── Settings ────────────────────────────────────────────────────────────────
$Mdb          = 'C:\Program Files (x86)\essl\eTimeTrackLite\eTimeTrackLite1.mdb'
$SupabaseUrl  = 'https://rqgkzamuohdvttnkluzn.supabase.co'
$AnonKey      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZ2t6YW11b2hkdnR0bmtsdXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTcwNDcsImV4cCI6MjA5NjQ5MzA0N30.d2S9YT7AtTHytz5DN067mqA4CMyxIF2KnL5awwaOoBQ'

#   Supabase → SQL Editor →
#   select secret from cb_integration_secrets where name = 'punch_bridge';
$IngestSecret = 'PASTE_THE_INGEST_SECRET_HERE'
# ────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = 'Stop'
function Say($m) { Write-Host ("{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) }

if ([Environment]::Is64BitProcess) {
    Say 'FATAL: running 64-bit. The Access driver is 32-bit only.'
    Say '  Use C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe'
    exit 1
}
if ($IngestSecret -eq 'PASTE_THE_INGEST_SECRET_HERE') {
    Say 'FATAL: $IngestSecret is not set — see the comment above it.'
    exit 1
}
if (-not (Test-Path $Mdb)) { Say "FATAL: not found: $Mdb"; exit 1 }

Add-Type -AssemblyName System.Data

$conn = New-Object System.Data.Odbc.OdbcConnection
$conn.ConnectionString = "Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=$Mdb;ReadOnly=1;"
$conn.Open()

try {
    # Which log tables exist. Asking the database beats assuming a naming
    # scheme — the monthly split is undocumented and only showed up by
    # looking.
    $allTables = $conn.GetSchema('Tables') |
        Where-Object { $_.TABLE_TYPE -eq 'TABLE' } |
        Select-Object -ExpandProperty TABLE_NAME

    if ($All) {
        $tables = $allTables | Where-Object { $_ -match '^DeviceLogs(_\d+_\d+)?$' } | Sort-Object
        $since  = Get-Date '2000-01-01'
    } else {
        $now  = Get-Date
        $prev = $now.AddMonths(-1)
        $want = @(
            'DeviceLogs',
            ('DeviceLogs_{0}_{1}' -f $now.Month,  $now.Year),
            ('DeviceLogs_{0}_{1}' -f $prev.Month, $prev.Year)
        )
        $tables = $want | Where-Object { $allTables -contains $_ }
        $since  = $now.AddHours(-$LookbackHours)
    }

    if (-not $tables) { Say 'no DeviceLogs tables found'; exit 1 }

    $punches = New-Object System.Collections.ArrayList
    foreach ($t in $tables) {
        $cmd = $conn.CreateCommand()
        # Access wants #m/d/yyyy hh:nn:ss# date literals; the ODBC {ts ...}
        # escape is the portable way to say the same thing.
        $cmd.CommandText = "select UserId, LogDate from [$t] where LogDate >= {ts '$($since.ToString('yyyy-MM-dd HH:mm:ss'))'} order by LogDate"
        $r = $cmd.ExecuteReader()
        $n = 0
        while ($r.Read()) {
            $uid = "$($r['UserId'])".Trim()
            if (-not $uid) { continue }
            $d = [datetime]$r['LogDate']
            [void]$punches.Add(@{
                device_code = $uid
                punch_at    = $d.ToString('yyyy-MM-ddTHH:mm:ss') + '+05:30'
                direction   = $null
                device_name = $null
            })
            $n++
        }
        $r.Close()
        Say "$t : $n"
    }
}
finally { $conn.Close() }

if ($punches.Count -eq 0) { Say 'no punches in window'; exit 0 }
if ($DryRun) {
    Say "dry run — $($punches.Count) punches, newest $($punches[$punches.Count-1].punch_at)"
    exit 0
}

# Chunked, so one run after a long outage does not send a single enormous body
# that the API rejects, which would lose the whole catch-up.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$stored  = 0
$unknown = @{}

for ($i = 0; $i -lt $punches.Count; $i += 500) {
    $batch = $punches[$i..([Math]::Min($i + 499, $punches.Count - 1))]
    $body  = @{ p_secret = $IngestSecret; p_punches = $batch } | ConvertTo-Json -Depth 5 -Compress

    try {
        $res = Invoke-RestMethod -Method Post `
            -Uri "$SupabaseUrl/rest/v1/rpc/cb_ingest_punches" `
            -Headers @{ apikey = $AnonKey; Authorization = "Bearer $AnonKey" } `
            -ContentType 'application/json' -Body $body -TimeoutSec 60
    } catch {
        Say "ERROR $($_.Exception.Message)"
        exit 1
    }

    $stored += [int]$res.stored
    foreach ($c in $res.unknown_device_codes) { $unknown[$c] = $true }
}

Say "sent $($punches.Count), new $stored"

if ($unknown.Count) {
    # Not a failure. These punches are stored and will attach to the right
    # person the moment the device code is filled in.
    Say "WARNING device codes with no employee on the roster: $($unknown.Keys -join ', ')"
    Say '  Fix: set cb_employees.device_code — see ettl-employee-map.ps1,'
    Say '  which writes the UPDATE statements for you.'
}
