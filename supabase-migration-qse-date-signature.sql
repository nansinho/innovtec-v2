-- Add date_signature column to qse_content table
-- This stores the document's official signature/publication date (e.g., "Fait à ... le JJ/MM/AAAA")
ALTER TABLE qse_content ADD COLUMN IF NOT EXISTS date_signature DATE;
