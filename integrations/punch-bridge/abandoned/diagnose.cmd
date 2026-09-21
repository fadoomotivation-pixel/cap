@echo off
REM ===============================================================
REM  Finds out what SQL Server this PC actually has, and what
REM  eTimeTrackLite itself connects to.
REM
REM  Guessing instance names costs an afternoon. eTimeTrackLite is
REM  ALREADY connected to a database -- every employee and punch is
REM  in it -- so its own connection string is the answer, and this
REM  prints it.
REM
REM  Right-click this file -> Run as administrator.
REM  Then send the whole output.
REM ===============================================================
setlocal enabledelayedexpansion
echo.
echo =============== 1. SQL Server instances on this PC ===============
echo (Nothing listed here means SQL Server is NOT installed, which is
echo  itself the answer -- see section 3.)
reg query "HKLM\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL" 2>nul
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\Microsoft SQL Server\Instance Names\SQL" 2>nul

echo.
echo =============== 2. SQL services and whether they run ==============
sc query type= service state= all | findstr /i "SQL"

echo.
echo =============== 3. What eTimeTrackLite connects to ================
echo (The Data Source line below is the exact server name to type into
echo  Parallel Database Export. A .mdb path instead means it uses MS
echo  Access, not SQL Server at all.)
for %%D in ("C:\Program Files (x86)" "C:\Program Files" "D:\Program Files (x86)" "D:\Program Files") do (
  if exist %%~D (
    for /f "delims=" %%F in ('dir /s /b "%%~D\*eTimeTrack*.config" 2^>nul') do (
      echo --- %%F
      findstr /i "connectionString Data.Source Provider" "%%F"
    )
    for /f "delims=" %%F in ('dir /s /b "%%~D\*eTimeTrack*.ini" 2^>nul') do (
      echo --- %%F
      type "%%F"
    )
  )
)

echo.
echo =============== 4. Can we actually connect? =======================
where sqlcmd >nul 2>nul
if errorlevel 1 (
  echo sqlcmd is not installed -- skip, sections 1-3 are enough.
) else (
  for %%I in ("localhost" "localhost\SQLEXPRESS" ".\SQLEXPRESS") do (
    echo --- trying %%~I
    sqlcmd -S %%~I -E -l 5 -Q "select @@servername as reachable" 2>&1
  )
)

echo.
echo =============== 5. SQL Browser ====================================
sc query SQLBrowser 2>nul | findstr /i "STATE"

echo.
echo ================== done -- send everything above ==================
pause
