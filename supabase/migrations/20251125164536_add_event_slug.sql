/*
  # Add Slug Field to Events

  1. Table Updates
    - `events` table modifications:
      - Add `slug` (text) - URL-friendly slug for the event

  2. Important Notes
    - Slug field is optional and defaults to empty string
    - Used for creating SEO-friendly URLs when displaying events
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'slug'
  ) THEN
    ALTER TABLE events ADD COLUMN slug text DEFAULT '';
  END IF;
END $$;