-- Fonction RPC pour vérifier un mot de passe contre le hash crypt() stocké
-- Utilisée comme fallback quand signInWithPassword échoue
CREATE OR REPLACE FUNCTION verify_user_password(p_email TEXT, p_password TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = p_email
    AND encrypted_password = crypt(p_password, encrypted_password);

  RETURN user_id;
END;
$$;
