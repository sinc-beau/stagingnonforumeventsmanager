/*
  # Add Venue Address and Link Fields

  1. Table Updates
    - `events` table modifications:
      - Add `venue_address` (text) - Physical address of the venue
      - Add `venue_link` (text) - URL link to venue website or map

  2. Important Notes
    - All fields are optional and default to empty string
    - These fields complement the existing venue field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'venue_address'
  ) THEN
    ALTER TABLE events ADD COLUMN venue_address text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'venue_link'
  ) THEN
    ALTER TABLE events ADD COLUMN venue_link text DEFAULT '';
  END IF;
END $$;