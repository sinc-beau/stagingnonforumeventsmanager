/*
  # Add is_live column to events table

  1. Changes
    - Add `is_live` column to events table (boolean, default false)
    - This field indicates whether an event is currently live/active
  
  2. Notes
    - Default value is false (not live)
    - Column is nullable to maintain compatibility with existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'is_live'
  ) THEN
    ALTER TABLE events ADD COLUMN is_live boolean DEFAULT false;
  END IF;
END $$;
