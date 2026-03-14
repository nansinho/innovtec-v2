-- ============================================================
-- Migration: Trombinoscope + Création des collaborateurs
-- ============================================================

-- 1. Nouveaux champs sur profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agency TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- 2. Fonction helper pour créer un collaborateur (auth.users + profiles)
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
  -- Check if user already exists
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
  END IF;

  -- Create/update profile
  INSERT INTO profiles (
    id, email, first_name, last_name, job_title, phone,
    department, team, agency, must_change_password,
    date_of_birth, role, is_active
  ) VALUES (
    new_id, p_email, p_first_name, p_last_name, p_job_title, p_phone,
    p_department, p_team, p_agency, true,
    p_date_of_birth, 'technicien', true
  ) ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    job_title = EXCLUDED.job_title,
    phone = EXCLUDED.phone,
    department = EXCLUDED.department,
    team = EXCLUDED.team,
    agency = EXCLUDED.agency,
    must_change_password = EXCLUDED.must_change_password,
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, profiles.date_of_birth);

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Création de tous les collaborateurs
-- Données extraites du trombinoscope existant
-- Format: email, prénom, nom, poste, téléphone, département, équipe, agence

SELECT create_innovtec_user('adeline.filippi@innovtec-reseaux.fr', 'Adeline', 'Filippi', 'Conductrice de travaux', '', 'Ingénierie', '', 'Siège');
SELECT create_innovtec_user('amine.maarouf@innovtec-reseaux.fr', 'Amine', 'Maarouf', 'Employé administratif', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('anthony.louette@innovtec-reseaux.fr', 'Anthony', 'Louette', 'Conducteur de travaux', '', 'Ingénierie', '', 'Siège');
SELECT create_innovtec_user('belinda.belhadj@innovtec-reseaux.fr', 'Belinda', 'Belhadj', 'Assistante administrative', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('bernard.nocel@innovtec-reseaux.fr', 'Bernard', 'Nocel', 'Responsable administratif', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('carlos.torres@innovtec-reseaux.fr', 'Carlos', 'Torres', 'Chef d''équipe', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('clementine.dasantos@innovtec-reseaux.fr', 'Clémentine', 'Da Santos Barreiros', 'Assistante administrative', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('christophe.capot@innovtec-reseaux.fr', 'Christophe', 'Capot', 'Chef d''équipe', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('christophe.fisseau@innovtec-reseaux.fr', 'Christophe', 'Fisseau', 'Chef d''équipe', '', 'Travaux', 'Cablerys', 'Siège');
SELECT create_innovtec_user('cristina.gaspar@innovtec-reseaux.fr', 'Cristina', 'Gaspar', 'Assistante RH', '', 'Ressources Humaines', '', 'Siège');
SELECT create_innovtec_user('darcy.nkimbu@innovtec-reseaux.fr', 'Darcy', 'Nkimbu', 'Chef de travaux', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('david.oliveira@innovtec-reseaux.fr', 'David', 'Oliveira', 'Chef d''équipe', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('francois.scandolera@innovtec-reseaux.fr', 'François', 'Scandolera', 'Employé administratif', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('gaelle.hilterscheid@innovtec-reseaux.fr', 'Gaëlle-Maud', 'Hilterscheid', 'Assistante administrative', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('gilbert.gimenez@innovtec-reseaux.fr', 'Gilbert', 'Gimenez', 'Aide collaborateur de réseau', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('gregory.filion@innovtec-reseaux.fr', 'Grégory', 'Filion', 'Assistant administratif', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('hanane.gonzalez@innovtec-reseaux.fr', 'Hanane', 'Gonzalez', 'Assistante administrative', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('jeremy.guiboche@innovtec-reseaux.fr', 'Jérémy', 'Guiboche', 'Chef d''équipe', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('jean-francois.inouto@innovtec-reseaux.fr', 'Jean-François', 'Inouto', 'Technicien', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('jose.goncalves@innovtec-reseaux.fr', 'José Miguel', 'Gonçalves', 'Chef d''équipe', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('julie.escudie@innovtec-reseaux.fr', 'Julie', 'Escudié', 'Responsable administrative', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('laurent.verdier@innovtec-reseaux.fr', 'Laurent', 'Verdier', 'Chef d''équipe', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('loan.marchetti@innovtec-reseaux.fr', 'Loan', 'Marchetti', 'Stagiaire', '', 'Ingénierie', '', 'Siège');
SELECT create_innovtec_user('lucie.josephine@innovtec-reseaux.fr', 'Lucie', 'Joséphine', 'Chef d''équipe', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('mathieu.brethenoux@innovtec-reseaux.fr', 'Mathieu', 'Brethénoux', 'Chef de chantier', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('manuel.cruzcabecas@innovtec-reseaux.fr', 'Manuel', 'De Cruz Cabecas', 'Chef d''équipe', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('manuel.ferreirahugo@innovtec-reseaux.fr', 'Manuel', 'De Ferreira Hugo', 'Chef de travaux', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('massil.ait@innovtec-reseaux.fr', 'Massil', 'Aït', 'Technicien', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('mickael.miranda@innovtec-reseaux.fr', 'Mickaël', 'Miranda', 'Chef de travaux', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('maxime.administration@innovtec-reseaux.fr', 'Maxime', 'Villemonteix', 'Employé administratif', '', 'Administration', 'AT', 'Siège');
SELECT create_innovtec_user('nadir.autocad@innovtec-reseaux.fr', 'Nadir', 'Bensalem', 'Dessinateur AutoCAD', '', 'Ingénierie', 'Antenne', 'Siège');
SELECT create_innovtec_user('naira.andrade@innovtec-reseaux.fr', 'Naira', 'Andrade', 'Stagiaire', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('nara.nabeur@innovtec-reseaux.fr', 'Nara', 'Nabeur', 'Assistante administrative', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('nicolas.conducteur@innovtec-reseaux.fr', 'Nicolas', 'Gasdoué', 'Conducteur de travaux', '', 'Ingénierie', '', 'Siège');
SELECT create_innovtec_user('myrto.agoarif@innovtec-reseaux.fr', 'Myrto', 'Agoarif', 'Assistante administrative', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('nurie.salahdin@innovtec-reseaux.fr', 'Nurie', 'Salahdin', 'Assistante administrative', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('nured.musoev@innovtec-reseaux.fr', 'Nured', 'Musoev', 'Chef d''équipe', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('odile.coordinatrice@innovtec-reseaux.fr', 'Odile', 'Lefebvre', 'Coordinatrice de réseau', '', 'Ingénierie', '', 'Siège');
SELECT create_innovtec_user('ousmane.diallo@innovtec-reseaux.fr', 'Ousmane', 'Diallo', 'Technicien', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('paul.salagon@innovtec-reseaux.fr', 'Paul', 'Salagon', 'Chef de chantier', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('pedro.coutinho@innovtec-reseaux.fr', 'Pedro', 'Coutinho', 'Chef d''équipe', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('philippe.hanteau@innovtec-reseaux.fr', 'Philippe', 'Hanteau', 'Conducteur de travaux', '', 'Ingénierie', '', 'Siège');
SELECT create_innovtec_user('priscille.christian@innovtec-reseaux.fr', 'Priscille', 'Christian', 'Assistante administrative', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('rachid.boumeridjan@innovtec-reseaux.fr', 'Rachid', 'Boumeridjan', 'Responsable administratif', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('ricardo.barbarodossi@innovtec-reseaux.fr', 'Ricardo', 'Barbarodossi', 'Chef de travaux', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('rui.feriques@innovtec-reseaux.fr', 'Rui', 'Feriques', 'Aide conducteur de travaux', '', 'Ingénierie', '', 'Siège');
SELECT create_innovtec_user('rui.guedes@innovtec-reseaux.fr', 'Rui', 'Guedes', 'Technicien', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('stephane.bourdet@innovtec-reseaux.fr', 'Stéphane', 'Bourdet', 'Chef de chantier', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('thomas.fabrizio@innovtec-reseaux.fr', 'Thomas', 'Fabrizio', 'Technicien', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('andre.desouza@innovtec-reseaux.fr', 'André', 'De Souza', 'Conducteur de travaux', '', 'Ingénierie', '', 'Siège');
SELECT create_innovtec_user('valentin.machina@innovtec-reseaux.fr', 'Valentin', 'Machina', 'Technicien', '', 'Travaux', '', 'Siège');
SELECT create_innovtec_user('yacine.basghir@innovtec-reseaux.fr', 'Yacine', 'Basghir', 'Employé administratif', '', 'Administration', '', 'Siège');
SELECT create_innovtec_user('yoni.sassoudou@innovtec-reseaux.fr', 'Yoni', 'Sassoudou', 'Employé administratif', '', 'Administration', '', 'Siège');

-- 4. Cleanup: drop helper function
DROP FUNCTION IF EXISTS create_innovtec_user;
