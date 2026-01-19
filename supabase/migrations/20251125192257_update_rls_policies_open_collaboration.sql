/*
  # Update RLS Policies for Open Collaboration

  1. Changes
    - Update all RLS policies to allow any authenticated user to read, create, update, and delete all records
    - Applies to: events, event_speakers, event_sponsors, agenda_items tables
    
  2. Security
    - All tables remain protected with RLS enabled
    - Only authenticated users can access data
    - No anonymous access allowed
*/

-- Drop existing policies for events
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can create own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

-- Create new open policies for events
CREATE POLICY "Authenticated users can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all events"
  ON events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all events"
  ON events FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing policies for event_speakers
DROP POLICY IF EXISTS "Users can view speakers for accessible events" ON event_speakers;
DROP POLICY IF EXISTS "Users can create speakers for own events" ON event_speakers;
DROP POLICY IF EXISTS "Users can update speakers for own events" ON event_speakers;
DROP POLICY IF EXISTS "Users can delete speakers for own events" ON event_speakers;

-- Create new open policies for event_speakers
CREATE POLICY "Authenticated users can view all speakers"
  ON event_speakers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create speakers"
  ON event_speakers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all speakers"
  ON event_speakers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all speakers"
  ON event_speakers FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing policies for event_sponsors
DROP POLICY IF EXISTS "Users can view sponsors for accessible events" ON event_sponsors;
DROP POLICY IF EXISTS "Users can create sponsors for own events" ON event_sponsors;
DROP POLICY IF EXISTS "Users can update sponsors for own events" ON event_sponsors;
DROP POLICY IF EXISTS "Users can delete sponsors for own events" ON event_sponsors;

-- Create new open policies for event_sponsors
CREATE POLICY "Authenticated users can view all sponsors"
  ON event_sponsors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sponsors"
  ON event_sponsors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all sponsors"
  ON event_sponsors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all sponsors"
  ON event_sponsors FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing policies for agenda_items
DROP POLICY IF EXISTS "Users can view agenda items for accessible events" ON agenda_items;
DROP POLICY IF EXISTS "Users can create agenda items for own events" ON agenda_items;
DROP POLICY IF EXISTS "Users can update agenda items for own events" ON agenda_items;
DROP POLICY IF EXISTS "Users can delete agenda items for own events" ON agenda_items;

-- Create new open policies for agenda_items
CREATE POLICY "Authenticated users can view all agenda items"
  ON agenda_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create agenda items"
  ON agenda_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all agenda items"
  ON agenda_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all agenda items"
  ON agenda_items FOR DELETE
  TO authenticated
  USING (true);