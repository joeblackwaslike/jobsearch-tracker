-- Migrate companies.location (singular varchar) to locations (text array).
ALTER TABLE companies ADD COLUMN locations TEXT[] DEFAULT '{}';

-- Populate from existing location data (skip empty/null)
UPDATE companies
  SET locations = ARRAY[location]
  WHERE location IS NOT NULL AND location <> '';

ALTER TABLE companies DROP COLUMN location;
