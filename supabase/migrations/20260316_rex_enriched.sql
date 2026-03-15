-- Migration: Enrichir la table REX pour correspondre au format Fiche REX INNOVTEC
-- Ajoute les champs nécessaires pour les 4 sections, photos, métadonnées header/footer

ALTER TABLE rex ADD COLUMN IF NOT EXISTS rex_number TEXT DEFAULT '';
ALTER TABLE rex ADD COLUMN IF NOT EXISTS rex_year INTEGER;
ALTER TABLE rex ADD COLUMN IF NOT EXISTS lieu TEXT DEFAULT '';
ALTER TABLE rex ADD COLUMN IF NOT EXISTS date_evenement DATE;
ALTER TABLE rex ADD COLUMN IF NOT EXISTS horaire TEXT DEFAULT '';

-- Section 1 : Les Faits
ALTER TABLE rex ADD COLUMN IF NOT EXISTS faits TEXT DEFAULT '';
ALTER TABLE rex ADD COLUMN IF NOT EXISTS faits_photo_url TEXT DEFAULT '';

-- Section 2 : Les Causes et les Circonstances
ALTER TABLE rex ADD COLUMN IF NOT EXISTS causes TEXT DEFAULT '';
ALTER TABLE rex ADD COLUMN IF NOT EXISTS causes_photo_url TEXT DEFAULT '';

-- Section 3 : La Synthèse des Actions Engagées
ALTER TABLE rex ADD COLUMN IF NOT EXISTS actions_engagees TEXT DEFAULT '';
ALTER TABLE rex ADD COLUMN IF NOT EXISTS actions_photo_url TEXT DEFAULT '';

-- Section 4 : Le Rappel à Vigilance
ALTER TABLE rex ADD COLUMN IF NOT EXISTS vigilance TEXT DEFAULT '';
ALTER TABLE rex ADD COLUMN IF NOT EXISTS vigilance_photo_url TEXT DEFAULT '';

-- Footer
ALTER TABLE rex ADD COLUMN IF NOT EXISTS deja_arrive TEXT[] DEFAULT '{}';
ALTER TABLE rex ADD COLUMN IF NOT EXISTS type_evenement TEXT DEFAULT '';

-- Fichier source importé
ALTER TABLE rex ADD COLUMN IF NOT EXISTS source_file_url TEXT DEFAULT '';
