-- Add notes column to events table
ALTER TABLE events
  ADD COLUMN notes text NOT NULL DEFAULT '';
