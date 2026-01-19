/*
  # Add Title Field to Agenda Items

  1. Table Updates
    - `agenda_items` table modifications:
      - Add `title` (text) - Title/heading for the agenda item

  2. Important Notes
    - Title field is optional and defaults to empty string
    - Each agenda item now has: time_slot, title, and description
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agenda_items' AND column_name = 'title'
  ) THEN
    ALTER TABLE agenda_items ADD COLUMN title text DEFAULT '';
  END IF;
END $$;