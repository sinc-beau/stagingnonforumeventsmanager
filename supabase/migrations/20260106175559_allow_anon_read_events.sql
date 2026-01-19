/*
  # Allow Anonymous Read Access to Events

  1. Changes
    - Add SELECT policies for anonymous (unauthenticated) users to read all events and related data
    - Applies to: events, event_speakers, event_sponsors, agenda_items tables
    
  2. Security
    - Anonymous users can ONLY read (SELECT) data
    - Anonymous users CANNOT create, update, or delete data
    - This allows the WordPress plugin using the anon key to display events publicly
    - All existing authenticated user policies remain unchanged

  3. Tables Affected
    - events: Allow anonymous read access
    - event_speakers: Allow anonymous read access
    - event_sponsors: Allow anonymous read access  
    - agenda_items: Allow anonymous read access
*/

-- Add anonymous read policy for events
CREATE POLICY "Anonymous users can view all events"
  ON events FOR SELECT
  TO anon
  USING (true);

-- Add anonymous read policy for event_speakers
CREATE POLICY "Anonymous users can view all speakers"
  ON event_speakers FOR SELECT
  TO anon
  USING (true);

-- Add anonymous read policy for event_sponsors
CREATE POLICY "Anonymous users can view all sponsors"
  ON event_sponsors FOR SELECT
  TO anon
  USING (true);

-- Add anonymous read policy for agenda_items
CREATE POLICY "Anonymous users can view all agenda items"
  ON agenda_items FOR SELECT
  TO anon
  USING (true);