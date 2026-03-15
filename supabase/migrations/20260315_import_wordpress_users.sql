-- ============================================================
-- Migration: Import des 86 comptes WordPress
-- Emails personnels avec prénoms/noms quand disponibles
-- ============================================================

-- 1. Recréer la fonction helper
CREATE OR REPLACE FUNCTION create_innovtec_user(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_job_title TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_department TEXT DEFAULT '',
  p_team TEXT DEFAULT '',
  p_agency TEXT DEFAULT 'Siège',
  p_date_of_birth DATE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Skip if user already exists
  SELECT id INTO new_id FROM auth.users WHERE email = p_email;

  IF new_id IS NULL THEN
    new_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token,
      is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_id, 'authenticated', 'authenticated', p_email,
      crypt('Innovtec2025!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name),
      now(), now(),
      '', '',
      false
    );

    INSERT INTO profiles (
      id, email, first_name, last_name, job_title, phone,
      department, team, agency, must_change_password,
      date_of_birth, role, is_active
    ) VALUES (
      new_id, p_email, p_first_name, p_last_name, p_job_title, p_phone,
      p_department, p_team, p_agency, true,
      p_date_of_birth, 'collaborateur', true
    ) ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      job_title = EXCLUDED.job_title,
      must_change_password = EXCLUDED.must_change_password;
  END IF;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Import des 86 comptes WordPress (emails personnels)
-- Comptes avec noms identifiés
SELECT create_innovtec_user('aguiar.innovtec@gmail.com', 'Nuno', 'Aguiar');
SELECT create_innovtec_user('audib.beni@gmail.com', 'Benjamin', 'Audibert');
SELECT create_innovtec_user('bertrand.rossi@dbmail.com', 'Bertrand', 'Rossi');
SELECT create_innovtec_user('bffy@hotmail.fr', 'Yassine', 'Bouafif');
SELECT create_innovtec_user('c.gaspar.innovtec@gmail.com', 'Cristina', 'Gaspar');
SELECT create_innovtec_user('cajtorres1961@gmail.com', 'Carlos', 'Torres');
SELECT create_innovtec_user('celestinoisabel16@gmail.com', 'Celestino', 'Do Escairo Brandao Linhares');
SELECT create_innovtec_user('cfanara.innovtec@gmail.com', 'Christophe', 'Fanara');
SELECT create_innovtec_user('chretien.innovtec@gmail.com', 'Priscillia', 'Chretien');
SELECT create_innovtec_user('christophe.cayrol@yahoo.fr', 'Christophe', 'Cayrol');
SELECT create_innovtec_user('contact@harua-ds.com', 'Nans', 'Harua');
SELECT create_innovtec_user('daevyrenault@gmail.com', 'Daevy', 'Renault');
SELECT create_innovtec_user('djgregpino@gmail.com', 'Gregory', 'Pino');
SELECT create_innovtec_user('fragosojoaquim71@gmail.com', 'Joaquim', 'Joadas Fragoso');
SELECT create_innovtec_user('gastcrew287@gmail.com', 'Nicolas', 'Gastaud');
SELECT create_innovtec_user('giovan.licata@innovtec-reseaux.fr', 'Giovan', 'Licata');
SELECT create_innovtec_user('goncalves.innovtec@gmail.com', 'Helena', 'Goncalves');
SELECT create_innovtec_user('guedesrui2010@hotmail.com', 'Rui', 'Guedes');
SELECT create_innovtec_user('higon.innovtec@gmail.com', 'Adeline', 'Higon');
SELECT create_innovtec_user('hilairematthieu38@gmail.com', 'Mathieu', 'Hilaire');
SELECT create_innovtec_user('hstepan434@gmail.com', 'Stepan', 'Komyn');
SELECT create_innovtec_user('carrichon.jeremy@gmail.com', 'Jeremy', 'Carrichon');
SELECT create_innovtec_user('jose.m.a.g@live.com.pt', 'José Miguel', 'Graca');
SELECT create_innovtec_user('julie.escudie@innovtec-reseaux.fr', 'Julie', 'Escudie');
SELECT create_innovtec_user('lilianagraca83@gmail.com', 'Rui', 'Serigado');
SELECT create_innovtec_user('lmr94140@gmail.com', 'Liyam', 'Mokhfi Rabhi');
SELECT create_innovtec_user('lopesantonionunes@gmail.com', 'Antonio', 'Lopes');
SELECT create_innovtec_user('luisantunes197352@gmail.com', 'Luis', 'Antunes');
SELECT create_innovtec_user('madileymozer10@gmail.com', 'Madiley', 'Do Nascimento');
SELECT create_innovtec_user('mana.giverso@laposte.net', 'David', 'Giverso');
SELECT create_innovtec_user('marjorie.bayard75@hotmail.com', 'Gaetan', 'Valenti Morando');
SELECT create_innovtec_user('martinsveronica@yahoo.fr', 'Veronica', 'Martins');
SELECT create_innovtec_user('mcruzcaldeira@gmail.com', 'Manuel', 'Da Cruz Caldeira');
SELECT create_innovtec_user('mfonseca.innovtec@gmail.com', 'Manuel', 'Da Fonseca Antunes Marques');
SELECT create_innovtec_user('mick.allemagne@gmail.com', 'Mickael', 'Berhmann');
SELECT create_innovtec_user('mouheb.innovtec@gmail.com', 'Amine', 'Mouheb');
SELECT create_innovtec_user('najime.benzerhouni@orange.fr', 'Najime', 'Benzerhouni');
SELECT create_innovtec_user('nans.harua@canal-de-provence.com', 'Nans', 'Harua');
SELECT create_innovtec_user('nans.harua@gmail.com', 'Nans', 'Harua');
SELECT create_innovtec_user('navarro.michel65@gmail.com', 'Michel', 'Navarro');
SELECT create_innovtec_user('nsalcedas37@gmail.com', 'Nuno', 'Salcedas');
SELECT create_innovtec_user('nuno.victorio.innovtec@gmail.com', 'Nuno', 'Vitorio');
SELECT create_innovtec_user('odindeligny@gmail.com', 'Odin', 'Deligny');
SELECT create_innovtec_user('paul.salvado@sfr.fr', 'Paul', 'Salvado');
SELECT create_innovtec_user('pedrocootrim2009@hotmail.com', 'Pedro', 'Cotrim');
SELECT create_innovtec_user('philippe.martins@innovtec-reseaux.fr', 'Philippe', 'Martins');
SELECT create_innovtec_user('ricardbernardino@gmail.com', 'Ricardo', 'Bernardino');
SELECT create_innovtec_user('salve13013@gmail.com', 'Rachid', 'Bouselham');
SELECT create_innovtec_user('sanoh.innovtec@gmail.com', 'Ousmane', 'Sanoh');
SELECT create_innovtec_user('scaramozzino.innovtec@gmail.com', 'François', 'Scaramozzino');
SELECT create_innovtec_user('terrier.laurent@hotmail.com', 'Laurent', 'Terrier');
SELECT create_innovtec_user('thomasfalzon136@gmail.com', 'Thomas', 'Falzon');
SELECT create_innovtec_user('uesleihenriquesouzasilva2@gmail.com', 'Ueslei', 'De Souza Silva');
SELECT create_innovtec_user('yoan.savastano@gmail.com', 'Yoan', 'Savastano');

-- Comptes sans noms identifiés (marqués "Inconnu" dans WordPress)
SELECT create_innovtec_user('1973joaomaneses@gmail.com', '', '');
SELECT create_innovtec_user('a.mouheb@hotmail.com', '', '');
SELECT create_innovtec_user('adeline.higon@gmail.com', '', '');
SELECT create_innovtec_user('autofarmeiro1999@gmail.com', '', '');
SELECT create_innovtec_user('axel2villachon@gmail.com', '', '');
SELECT create_innovtec_user('bandeirasjorge424@gmail.com', '', '');
SELECT create_innovtec_user('claudiorosasantos5@gmail.com', '', '');
SELECT create_innovtec_user('filipe93_almeida@hotmail.com', '', '');
SELECT create_innovtec_user('florianvillachon1@gmail.com', '', '');
SELECT create_innovtec_user('gustavofibessa@gmail.com', '', '');
SELECT create_innovtec_user('heldersilva980@gmail.com', '', '');
SELECT create_innovtec_user('hondacrxvetc@gmail.com', '', '');
SELECT create_innovtec_user('joaomiguelfrbandeira8@gmail.com', '', '');
SELECT create_innovtec_user('joseaprilia1@hotmail.com', '', '');
SELECT create_innovtec_user('josegabrielrodrigues216@gmail.com', '', '');
SELECT create_innovtec_user('josejmsimoes1978@gmail.com', '', '');
SELECT create_innovtec_user('jsantos.mecanomotor@sapo.pt', '', '');
SELECT create_innovtec_user('luis_fonseca1976@hotmail.com', '', '');
SELECT create_innovtec_user('luis.innovtec@gmail.com', '', '');
SELECT create_innovtec_user('luisfilipe.1976@hotmail.com', '', '');
SELECT create_innovtec_user('marciocostacorse@gmail.com', '', '');
SELECT create_innovtec_user('nuno39520@gmail.com', '', '');
SELECT create_innovtec_user('nunograca718@gmail.com', '', '');
SELECT create_innovtec_user('orlando73costa_@hotmail.com', '', '');
SELECT create_innovtec_user('ouspac@hotmail.com', '', '');
SELECT create_innovtec_user('paulo65slb@hotmail.com', '', '');
SELECT create_innovtec_user('pauloferreiradacosta37@gmail.com', '', '');
SELECT create_innovtec_user('paulosilva.psrs@gmail.com', '', '');
SELECT create_innovtec_user('ruivicente2017@gmail.com', '', '');
SELECT create_innovtec_user('scaramozzino.francois@gmail.com', '', '');
SELECT create_innovtec_user('vaninho313@gmail.com', '', '');

-- 3. Cleanup
DROP FUNCTION IF EXISTS create_innovtec_user;
