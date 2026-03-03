-- Migrate applications.location (varchar) to locations (text[])

-- Add the new array column
ALTER TABLE applications ADD COLUMN locations TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing single-location strings into the first array element
UPDATE applications
SET locations = ARRAY[location]
WHERE location IS NOT NULL AND location != '';

-- Drop the old column
ALTER TABLE applications DROP COLUMN location;
