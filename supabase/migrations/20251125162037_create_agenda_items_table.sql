/*
  # Create Agenda Items Table

  1. New Tables
    - `agenda_items`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `time_slot` (text) - Time slot for the agenda item (e.g., "9:00 AM - 10:00 AM")
      - `description` (text) - Description of what happens during this time slot
      - `order_index` (integer) - Display order of agenda items
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on agenda_items table
    - Add policies for authenticated users to manage agenda items for their events
    - Cascade delete agenda items when event is deleted

  3. Important Notes
    - Each agenda item represents a time slot with its description
    - Items are ordered by order_index for proper display
    - All fields are optional except event_id and order_index
*/

CREATE TABLE IF NOT EXISTS agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  time_slot text DEFAULT '',
  description text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agenda_items
CREATE POLICY "Anyone can view agenda items"
  ON agenda_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create agenda items for their events"
  ON agenda_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = agenda_items.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agenda items for their events"
  ON agenda_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = agenda_items.event_id
      AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = agenda_items.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete agenda items for their events"
  ON agenda_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = agenda_items.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Create index
CREATE INDEX IF NOT EXISTS agenda_items_event_id_idx ON agenda_items(event_id);