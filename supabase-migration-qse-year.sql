-- Add year column to qse_content table
ALTER TABLE qse_content ADD COLUMN IF NOT EXISTS year INTEGER;

-- Backfill existing rows with year from updated_at
UPDATE qse_content SET year = EXTRACT(YEAR FROM updated_at)::INTEGER WHERE year IS NULL;
