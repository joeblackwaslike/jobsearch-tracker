-- Set applied_at default to current UTC timestamp
ALTER TABLE applications
  ALTER COLUMN applied_at SET DEFAULT (now() AT TIME ZONE 'utc');
