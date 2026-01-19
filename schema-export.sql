-- Events Management System - Complete Schema Export
-- This SQL file creates all necessary tables for the events management system
-- Target Database: Supabase (PostgreSQL)
--
-- Tables included:
-- 1. events - Main events table
-- 2. event_speakers - Speakers for each event
-- 3. event_sponsors - Sponsors for each event
-- 4. agenda_items - Agenda items for each event
--
-- Import Instructions:
-- For Supabase databases:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Paste the contents of this file
-- 5. Run the query
--
-- IMPORTANT: RLS is disabled on all tables to allow sync operations
-- using the service role key. These tables receive data from a trusted
-- sync service and don't need user-level access controls.

-- ============================================
-- EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamptz NOT NULL,
  timezone text DEFAULT '',
  city text DEFAULT '',
  brand text DEFAULT '',
  venue text DEFAULT '',
  venue_address text DEFAULT '',
  venue_link text DEFAULT '',
  type text DEFAULT '',
  blurb text DEFAULT '',
  hubspot_form_id text DEFAULT '',
  slug text NOT NULL,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS events_date_idx ON events(date);
CREATE INDEX IF NOT EXISTS events_brand_idx ON events(brand);
CREATE INDEX IF NOT EXISTS events_city_idx ON events(city);

-- Disable RLS for sync operations (service role will handle inserts)
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- ============================================
-- EVENT SPEAKERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS event_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  about text DEFAULT '',
  headshot_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS event_speakers_event_id_idx ON event_speakers(event_id);

-- Disable RLS for sync operations
ALTER TABLE event_speakers DISABLE ROW LEVEL SECURITY;

-- ============================================
-- EVENT SPONSORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS event_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  about text DEFAULT '',
  logo_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS event_sponsors_event_id_idx ON event_sponsors(event_id);

-- Disable RLS for sync operations
ALTER TABLE event_sponsors DISABLE ROW LEVEL SECURITY;

-- ============================================
-- AGENDA ITEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  time_slot text DEFAULT '',
  title text DEFAULT '',
  description text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS agenda_items_event_id_idx ON agenda_items(event_id);

-- Disable RLS for sync operations
ALTER TABLE agenda_items DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTES
-- ============================================
--
-- Brand Values: ITx, Sentinel, CDAIO, Marketverse
-- Type Values: forum, dinner, virtual roundtable, learn and go, VEB
--
-- All foreign key constraints use CASCADE DELETE, so deleting an event
-- will automatically delete all associated speakers, sponsors, and agenda items.
