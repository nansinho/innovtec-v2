-- Table de messagerie interne
CREATE TABLE IF NOT EXISTS internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour lister les messages d'un utilisateur
CREATE INDEX idx_internal_messages_to ON internal_messages(to_user_id, is_read, created_at DESC);
CREATE INDEX idx_internal_messages_from ON internal_messages(from_user_id, created_at DESC);
CREATE INDEX idx_internal_messages_conversation ON internal_messages(
  LEAST(from_user_id, to_user_id),
  GREATEST(from_user_id, to_user_id),
  created_at DESC
);

-- RLS
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut voir ses propres messages (envoyés ou reçus)
CREATE POLICY "Users can view own messages"
  ON internal_messages FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Un utilisateur peut envoyer des messages
CREATE POLICY "Users can send messages"
  ON internal_messages FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Un utilisateur peut marquer comme lu les messages qu'il a reçus
CREATE POLICY "Users can update received messages"
  ON internal_messages FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Un utilisateur peut supprimer ses propres messages
CREATE POLICY "Users can delete own messages"
  ON internal_messages FOR DELETE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Realtime
ALTER TABLE internal_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
