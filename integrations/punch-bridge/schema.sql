/* ---------------------------------------------------------------
   Run this ONCE in SQL Server Management Studio on the office PC,
   BEFORE pressing Test Connection in eTimeTrackLite.

   The Parallel Database Export screen ships with TimeTrack /
   AttendanceLogs already typed in as placeholders, but neither
   exists until you create them — which is why Test Connection
   fails on a fresh install. The column names below match the
   Table Fields Mapping on that screen exactly, so nothing on it
   needs changing.
   --------------------------------------------------------------- */

if db_id('TimeTrack') is null
    create database TimeTrack;
go

use TimeTrack;
go

if object_id('dbo.AttendanceLogs', 'U') is null
create table dbo.AttendanceLogs (
    Id            bigint identity(1,1) primary key,
    EmployeeCode  nvarchar(50)  not null,   -- Emp Code on the machine
    LogDateTime   datetime      not null,   -- local IST, no zone
    LogDate       nvarchar(50)  null,
    LogTime       nvarchar(50)  null,
    Direction     nvarchar(20)  null,       -- in / out, often blank
    WorkCode      nvarchar(50)  null
);
go

/* The bridge reads a rolling window by time, so this index is what
   keeps that query cheap once the table has a year of punches. */
if not exists (select 1 from sys.indexes where name = 'IX_AttendanceLogs_LogDateTime')
    create index IX_AttendanceLogs_LogDateTime
        on dbo.AttendanceLogs (LogDateTime);
go

/* eSSL can re-download the same punch, so the same row can arrive
   twice here. That is harmless — cb_ingest_punches on the Supabase
   side is idempotent on (device_code, punch_at) and collapses them.
   Do NOT add a unique constraint here: if eSSL's insert fails, it
   stops exporting rather than skipping the row. */
