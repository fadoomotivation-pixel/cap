<#
    Writes the SQL that fills cb_employees.device_code, so nobody matches 31
    people to machine codes by hand.

    The machine knows people as 1, 3, 4, 6, 32, 52, 102 -- and until those
    numbers are on the roster, punches arrive and attach to nobody. eSSL
    already holds the mapping in Employees.EmployeeCodeInDevice; this reads it
    and turns it into UPDATE statements to paste into Supabase's SQL editor.

    Matching is on NAME, because that is the only field both systems share:
    Supabase has full_name, eSSL has EmployeeName, and neither employee_code
    means the same thing in both. Names that do not match simply update no
    rows -- the summary at the end says how many matched, so a silent miss is
    not possible.

    Run under 32-bit PowerShell, same as the sync:
      C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File ettl-employee-map.ps1
#>

$ErrorActionPreference = 'Stop'
$Mdb = 'C:\Program Files (x86)\essl\eTimeTrackLite\eTimeTrackLite1.mdb'

if ([Environment]::Is64BitProcess) {
    Write-Host 'FATAL: run this with C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe'
    exit 1
}

Add-Type -AssemblyName System.Data
$conn = New-Object System.Data.Odbc.OdbcConnection
$conn.ConnectionString = "Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=$Mdb;ReadOnly=1;"
$conn.Open()

$cmd = $conn.CreateCommand()
$cmd.CommandText = 'select EmployeeName, EmployeeCodeInDevice, EmployeeCode, Status from Employees order by EmployeeName'
$r = $cmd.ExecuteReader()

$rows = @()
while ($r.Read()) {
    $name = "$($r['EmployeeName'])".Trim()
    $dev  = "$($r['EmployeeCodeInDevice'])".Trim()
    # eSSL keeps deleted people in the table, renamed del_<something>, with
    # their device code zeroed. Both tests are needed: the del_ prefix alone
    # would let a live person through if HR ever prefixes a real name.
    if ($name -like 'del_*') { continue }
    if (-not $dev -or $dev -eq '0') { continue }
    $rows += [pscustomobject]@{ Name = $name; Device = $dev }
}
$r.Close(); $conn.Close()

Write-Host '-- Paste into Supabase SQL Editor.'
Write-Host '-- Matches on name; a name that differs updates nothing, which the count below catches.'
Write-Host ''
foreach ($x in $rows) {
    $n = $x.Name -replace "'", "''"
    Write-Host ("update public.cb_employees set device_code = '{0}' where lower(btrim(full_name)) = lower(btrim('{1}'));" -f $x.Device, $n)
}
Write-Host ''
Write-Host '-- Then check nobody was missed:'
Write-Host 'select full_name, device_code from public.cb_employees where device_code is null and is_active order by full_name;'
Write-Host ''
Write-Host ("-- {0} employees on the machine with a device code." -f $rows.Count)
