-- Enable REPLICA IDENTITY FULL on notifications for DELETE event payloads
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Enable Realtime on documents table for sync
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE documents;
EXCEPTION WHEN duplicate_object THEN
  -- already added
  NULL;
END $$;

ALTER TABLE documents REPLICA IDENTITY FULL;
