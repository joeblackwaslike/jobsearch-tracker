-- Enable Realtime for tables that the frontend subscribes to via postgres_changes.
-- This adds each table to the supabase_realtime publication so that row-level
-- change events (INSERT / UPDATE / DELETE) are streamed to connected clients.

alter publication supabase_realtime add table applications;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table companies;
alter publication supabase_realtime add table contacts;
