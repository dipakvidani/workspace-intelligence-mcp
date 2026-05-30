export const ALLOWED_SQL_KEYWORDS = new Set([
  'SELECT', 'EXPLAIN', 'PRAGMA', 'DESCRIBE', 'SHOW', 'WITH',
]);

export const BLOCKED_SQL_KEYWORDS = new Set([
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE',
  'CREATE', 'EXEC', 'EXECUTE', 'MERGE', 'GRANT', 'REVOKE',
  'RENAME', 'REPLACE', 'CALL', 'LOCK', 'UNLOCK',
]);

export const BLOCKED_SQL_PATTERNS: RegExp[] = [
  /;/i,                // Block all semicolons (multi-statement detection)
  /--/,                // SQL line comments
  /\/\*/,              // SQL block comments
  /xp_/i,              // SQL Server extended stored procedures
  /INTO\s+OUTFILE/i,   // File write attempts
  /INTO\s+DUMPFILE/i,
  /LOAD_FILE/i,
  /pg_sleep\s*\(/i,    // Postgres sleep DoS
  /sleep\s*\(/i,       // MySQL sleep DoS
  /benchmark\s*\(/i,   // MySQL benchmark DoS
  /copy\s+/i,          // Postgres COPY
];
