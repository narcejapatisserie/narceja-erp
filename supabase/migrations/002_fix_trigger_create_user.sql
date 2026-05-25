-- ============================================================
-- PASSO 1: Corrigir o trigger handle_new_user
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_full_name TEXT;
BEGIN
  -- Determinar role com fallback seguro
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'employee'::user_role
    );
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'employee'::user_role;
  END;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, v_full_name, v_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PASSO 2: Criar o usuário admin via SQL
-- (Execute DEPOIS de corrigir o trigger)
-- ============================================================

-- Inserir na auth.users diretamente com senha criptografada
-- Nota: use a interface do Dashboard em Authentication > Users
-- OU execute este bloco completo:

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Inserir o usuário no auth
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'narcejapatisserie@gmail.com',
    crypt('Branco@1998668', gen_salt('bf')),
    now(),
    '{"full_name": "Narceja Pâtisserie", "role": "admin"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;

  -- Se o usuário foi criado, inserir/atualizar o perfil como admin
  IF v_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, full_name, role, is_active)
    VALUES (v_user_id, 'Narceja Pâtisserie', 'admin', true)
    ON CONFLICT (id) DO UPDATE
      SET role = 'admin', full_name = 'Narceja Pâtisserie';

    RAISE NOTICE 'Usuário criado com ID: %', v_user_id;
  ELSE
    -- Usuário já existe, buscar o ID e atualizar role
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'narcejapatisserie@gmail.com';

    UPDATE profiles SET role = 'admin', full_name = 'Narceja Pâtisserie'
    WHERE id = v_user_id;

    RAISE NOTICE 'Usuário já existia. Perfil atualizado para admin. ID: %', v_user_id;
  END IF;
END;
$$;

-- ============================================================
-- PASSO 3: Criar os buckets de storage
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products', 'products', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('labels', 'labels', true, 10485760, ARRAY['application/pdf','image/png']),
  ('attachments', 'attachments', false, 10485760, NULL)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para o bucket products
CREATE POLICY "products_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "products_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "products_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "products_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- Políticas de storage para o bucket labels
CREATE POLICY "labels_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'labels');

CREATE POLICY "labels_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'labels' AND auth.role() = 'authenticated');

-- Verificar resultado
SELECT
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.is_active
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'narcejapatisserie@gmail.com';
