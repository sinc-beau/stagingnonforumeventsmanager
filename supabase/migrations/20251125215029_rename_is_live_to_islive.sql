/*
  # Rename is_live to islive in events table

  1. Changes
    - Rename is_live column to islive (remove underscore)
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'is_live'
  ) THEN
    ALTER TABLE events RENAME COLUMN is_live TO islive;
  END IF;
END $$;
