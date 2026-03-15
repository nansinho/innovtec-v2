-- Migration: Add documents obligatoires and engagement de la direction fields to qse_content
-- Date: 2026-03-15

ALTER TABLE qse_content ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE qse_content ADD COLUMN IF NOT EXISTS engagement_text TEXT DEFAULT '';
ALTER TABLE qse_content ADD COLUMN IF NOT EXISTS engagement_lieu TEXT DEFAULT '';
ALTER TABLE qse_content ADD COLUMN IF NOT EXISTS signataires JSONB DEFAULT '[]'::jsonb;
