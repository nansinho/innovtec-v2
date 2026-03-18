-- Add conclusion fields to rex table
-- conclusion_title: dynamic title like "Règles vitales associées", "Bonnes pratiques", etc.
-- conclusion_content: the full text content of the conclusion section
ALTER TABLE rex ADD COLUMN IF NOT EXISTS conclusion_title TEXT DEFAULT '';
ALTER TABLE rex ADD COLUMN IF NOT EXISTS conclusion_content TEXT DEFAULT '';
