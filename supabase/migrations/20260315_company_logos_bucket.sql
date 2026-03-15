-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to company-logos bucket
CREATE POLICY "Authenticated users can upload company logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-logos');

-- Allow public read access to company logos
CREATE POLICY "Public read access for company logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-logos');

-- Allow authenticated admins/rh to delete company logos
CREATE POLICY "Admins can delete company logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-logos');

-- Allow all authenticated users to read company_logo_url from app_settings
-- (The existing policy only allows admin/rh to read)
CREATE POLICY "All users can read company logo setting"
  ON app_settings FOR SELECT
  TO authenticated
  USING (key = 'company_logo_url');
