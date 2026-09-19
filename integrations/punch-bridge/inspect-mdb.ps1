<#
    Lists the tables inside eTimeTrackLite's own Access database, and shows a
    few rows of whichever one holds the punches.

    eTimeTrackLite is a 32-bit application storing its data in
    eTimeTrackLite1.mdb, and the Access ODBC driver on this machine is
    registered 32-bit only. So this MUST run under 32-bit PowerShell:

        C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File inspect-mdb.ps1

    Run from normal 64-bit PowerShell it fails with "Data source name not
    found" -- the same IM002 that cost us an afternoon on the MySQL route,
    for the same reason.

    Read-only throughout. The database is open in eTimeTrackLite while this
    runs (that is what the .ldb lock file is), which Access allows; nothing
    here writes, locks or moves anything.
#>

$ErrorActionPreference = 'Stop'

$Mdb = $env:ETTL_MDB
if (-not $Mdb) { $Mdb = 'C:\Program Files (x86)\essl\eTimeTrackLite\eTimeTrackLite1.mdb' }

if (-not (Test-Path $Mdb)) { throw "Not found: $Mdb" }

Write-Host "Reading $Mdb"
Write-Host ("Running as {0}-bit PowerShell" -f $(if ([Environment]::Is64BitProcess) { 64 } else { 32 }))
if ([Environment]::Is64BitProcess) {
    Write-Warning "This is the 64-bit host. The Access driver is registered 32-bit; re-run with C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe"
}
Write-Host ""

Add-Type -AssemblyName System.Data

$conn = New-Object System.Data.Odbc.OdbcConnection
# A database password, if eSSL set one, goes on the end as  Pwd=...;
$conn.ConnectionString = "Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=$Mdb;ReadOnly=1;"
$conn.Open()

try {
    $tables = $conn.GetSchema('Tables') |
        Where-Object { $_.TABLE_TYPE -eq 'TABLE' } |
        Select-Object -ExpandProperty TABLE_NAME |
        Sort-Object

    Write-Host "=== Tables ($($tables.Count)) ==="
    $tables | ForEach-Object { Write-Host "  $_" }
    Write-Host ""

    # The punch log is the one worth finding. eSSL names it DeviceLogs on most
    # builds, but the guess is checked against what is actually there rather
    # than assumed -- guessing names is exactly what went wrong upstream.
    $candidates = $tables | Where-Object { $_ -match 'log|punch|attend' }

    foreach ($t in $candidates) {
        Write-Host "=== $t ==="
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "select top 3 * from [$t]"
        $r = $cmd.ExecuteReader()

        $cols = @()
        for ($i = 0; $i -lt $r.FieldCount; $i++) {
            $cols += "$($r.GetName($i)) [$($r.GetFieldType($i).Name)]"
        }
        Write-Host ("  columns: " + ($cols -join ', '))

        $n = 0
        while ($r.Read()) {
            $vals = @()
            for ($i = 0; $i -lt $r.FieldCount; $i++) { $vals += "$($r.GetValue($i))" }
            Write-Host ("  row: " + ($vals -join ' | '))
            $n++
        }
        if ($n -eq 0) { Write-Host "  (empty)" }
        $r.Close()
        Write-Host ""
    }
}
finally {
    $conn.Close()
}
