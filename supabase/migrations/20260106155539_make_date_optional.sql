/*
  # Make Date Optional for Virtual Events

  1. Schema Changes
    - Modify `events` table to make `date` column nullable
    - This allows Virtual Executive Briefing (VEB) and other virtual events to be created without a specific date

  2. Important Notes
    - Existing events with dates remain unchanged
    - Virtual events (VEB, Virtual Roundtable) can now be created without a date/time
    - Date field remains in the table but is no longer required
*/

DO $$
BEGIN
  ALTER TABLE events ALTER COLUMN date DROP NOT NULL;
END $$;