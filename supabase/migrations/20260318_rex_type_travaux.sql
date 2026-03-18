-- Add type_travaux column to rex table
ALTER TABLE rex ADD COLUMN IF NOT EXISTS type_travaux TEXT DEFAULT '';
