/*
  # Update Events Schema with Complete Event Management

  1. Table Updates
    - `events` table modifications:
      - Add `timezone` (text) - Event timezone
      - Add `city` (text) - Event city location
      - Add `brand` (text) - Brand type (ITx, Sentinel, CDAIO, Marketverse)
      - Add `venue` (text) - Venue name
      - Add `type` (text) - Event type (forum, dinner, virtual roundtable, learn and go, VEB)
      - Add `blurb` (text) - Short event description
      - Add `agenda` (text) - Event agenda/schedule
      - Add `hubspot_form_id` (text) - HubSpot form integration ID
      - Remove old `description` and `location` fields

  2. New Tables
    - `event_sponsors`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `name` (text) - Sponsor name
      - `about` (text) - Sponsor description
      - `logo_url` (text) - Sponsor logo URL
      - `order_index` (integer) - Display order
      - `created_at` (timestamptz)

    - `event_speakers`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `name` (text) - Speaker name
      - `about` (text) - Speaker bio
      - `headshot_url` (text) - Speaker photo URL
      - `order_index` (integer) - Display order
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their event-related data
    - Cascade delete speakers and sponsors when event is deleted

  4. Important Notes
    - Brand options: ITx, Sentinel, CDAIO, Marketverse
    - Type options: forum, dinner, virtual roundtable, learn and go, VEB
    - Sponsors and speakers can be added in any order via order_index
*/

-- Update events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE events ADD COLUMN timezone text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'city'
  ) THEN
    ALTER TABLE events ADD COLUMN city text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'brand'
  ) THEN
    ALTER TABLE events ADD COLUMN brand text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'venue'
  ) THEN
    ALTER TABLE events ADD COLUMN venue text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'type'
  ) THEN
    ALTER TABLE events ADD COLUMN type text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'blurb'
  ) THEN
    ALTER TABLE events ADD COLUMN blurb text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'agenda'
  ) THEN
    ALTER TABLE events ADD COLUMN agenda text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'hubspot_form_id'
  ) THEN
    ALTER TABLE events ADD COLUMN hubspot_form_id text DEFAULT '';
  END IF;
END $$;

-- Create event_sponsors table
CREATE TABLE IF NOT EXISTS event_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  about text DEFAULT '',
  logo_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create event_speakers table
CREATE TABLE IF NOT EXISTS event_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  about text DEFAULT '',
  headshot_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE event_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_sponsors
CREATE POLICY "Anyone can view sponsors"
  ON event_sponsors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create sponsors for their events"
  ON event_sponsors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_sponsors.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sponsors for their events"
  ON event_sponsors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_sponsors.event_id
      AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_sponsors.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sponsors for their events"
  ON event_sponsors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_sponsors.event_id
      AND events.user_id = auth.uid()
    )
  );

-- RLS Policies for event_speakers
CREATE POLICY "Anyone can view speakers"
  ON event_speakers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create speakers for their events"
  ON event_speakers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_speakers.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update speakers for their events"
  ON event_speakers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_speakers.event_id
      AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_speakers.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete speakers for their events"
  ON event_speakers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_speakers.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS event_sponsors_event_id_idx ON event_sponsors(event_id);
CREATE INDEX IF NOT EXISTS event_speakers_event_id_idx ON event_speakers(event_id);