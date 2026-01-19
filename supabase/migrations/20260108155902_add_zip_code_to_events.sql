/*
  # Add Zip Code Field to Events Table

  1. Table Updates
    - `events` table modifications:
      - Add `zip_code` (text) - Postal/zip code with flexible format
      - Field accepts any format up to 10 characters including spaces

  2. Important Notes
    - Field is optional and defaults to empty string
    - Supports international postal code formats
    - Maximum length enforced at application level
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE events ADD COLUMN zip_code text DEFAULT '';
  END IF;
END $$;