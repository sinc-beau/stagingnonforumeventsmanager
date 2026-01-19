-- Quick fix to disable RLS on existing tables
-- Run this on your brand databases if sync is failing due to RLS

ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_sponsors DISABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items DISABLE ROW LEVEL SECURITY;
