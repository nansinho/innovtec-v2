-- Add gender column to profiles for gendered card colors in trombinoscope
ALTER TABLE profiles ADD COLUMN gender TEXT DEFAULT '' CHECK (gender IN ('', 'M', 'F'));
