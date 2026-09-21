/* ---------------------------------------------------------------
   Run this ONCE in Hostinger hPanel → Databases → phpMyAdmin,
   inside the database you created for attendance.

   Column names match the Table Fields Mapping on eTimeTrackLite's
   Parallel Database Export screen exactly, so nothing there needs
   changing.
   --------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS AttendanceLogs (
    Id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    EmployeeCode VARCHAR(50)  NOT NULL,   -- Emp Code on the machine
    LogDateTime  DATETIME     NOT NULL,   -- local IST, no zone attached
    LogDate      VARCHAR(50)  NULL,
    LogTime      VARCHAR(50)  NULL,
    Direction    VARCHAR(20)  NULL,       -- in / out, often blank
    WorkCode     VARCHAR(50)  NULL,

    /* The sync reads a rolling window by time, so this is what keeps
       that query cheap once the table holds a year of punches. */
    INDEX IX_LogDateTime (LogDateTime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* No unique constraint on purpose. eSSL can re-download the same
   punch and insert it twice; that is harmless, because
   cb_ingest_punches on the Supabase side is idempotent on
   (device_code, punch_at) and collapses duplicates. A unique key
   here would make eSSL's insert fail, and eSSL stops exporting on a
   failed insert rather than skipping the row. */
