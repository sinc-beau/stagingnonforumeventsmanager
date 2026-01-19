/*
  # Add sponsor_short_description to event_sponsors table

  1. Changes
    - Add `sponsor_short_description` column to `event_sponsors` table
      - Type: text
      - Default: empty string
      - Nullable: yes
    
  2. Notes
    - This field allows for a brief description of each sponsor
    - Existing sponsor records will have an empty string as default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_sponsors' AND column_name = 'sponsor_short_description'
  ) THEN
    ALTER TABLE event_sponsors ADD COLUMN sponsor_short_description text DEFAULT '' NULL;
  END IF;
END $$;