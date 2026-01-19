/*
  # Add asset_link column to event_sponsors

  1. Changes
    - Add asset_link column to event_sponsors table
    - This allows storing a link to sponsor assets
*/

ALTER TABLE event_sponsors 
ADD COLUMN IF NOT EXISTS asset_link text DEFAULT ''::text;
