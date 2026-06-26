-- =====================================================================
-- FamFi (Family Finance) PostgreSQL Schema
-- Tanggal: 2026-06-26
-- Target Platform: Supabase (PostgreSQL 15+)
-- Description: Inisialisasi Tabel, Relasi, Fungsi Helper, Trigger,
--              dan Row Level Security (RLS) untuk FamFi.
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. TABEL UTAMA & RELASI
-- =====================================================================

-- Tabel families (Grup Keluarga)
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    cash_pool_balance NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel profiles (Profil Anggota Keluarga terhubung ke auth.users Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member' NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel envelopes (Amplop Anggaran)
CREATE TABLE IF NOT EXISTS public.envelopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    balance NUMERIC DEFAULT 0 NOT NULL,
    limit_amount NUMERIC NOT NULL,
    category TEXT CHECK (category IN ('NEEDS', 'WANTS', 'SAVINGS')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel transactions (Transaksi Pemasukan, Pengeluaran, & Transfer)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    envelope_id UUID REFERENCES public.envelopes(id) ON DELETE CASCADE, -- NULL jika transaksi Kas Utama (Pemasukan)
    source_envelope_id UUID REFERENCES public.envelopes(id) ON DELETE CASCADE, -- Digunakan hanya untuk tipe TRANSFER
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')) NOT NULL,
    description TEXT NOT NULL,
    source TEXT DEFAULT 'APP' NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel audit_logs (Riwayat Perubahan Keamanan & Administrasi)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- 2. FUNGSI HELPER (SECURITY DEFINER) UNTUK MENGHINDARI REKURSI RLS
-- =====================================================================

-- Mendapatkan family_id dari pengguna yang sedang aktif (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT family_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Memeriksa apakah pengguna aktif berstatus Admin (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 3. AUTOMATIC TRIGGERS (SINKRONISASI & AUDITING)
-- =====================================================================

-- Trigger A: Sinkronisasi otomatis auth.users -> public.profiles saat registrasi
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger jika sudah ada sebelumnya
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Trigger B: Logger Audit Otomatis untuk Tabel Envelopes dan Families
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id UUID;
  v_profile_id UUID;
  v_action TEXT;
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
BEGIN
  -- Tentukan tipe aksi
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_new_data := to_jsonb(NEW);
    IF (TG_TABLE_NAME = 'envelopes') THEN
      v_family_id := NEW.family_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'UPDATE';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    IF (TG_TABLE_NAME = 'envelopes') THEN
      v_family_id := NEW.family_id;
    ELSIF (TG_TABLE_NAME = 'families') THEN
      v_family_id := NEW.id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'DELETE';
    v_old_data := to_jsonb(OLD);
    IF (TG_TABLE_NAME = 'envelopes') THEN
      v_family_id := OLD.family_id;
    END IF;
  END IF;

  -- Dapatkan profile ID dari JWT Claims yang aktif (jika diakses via API client Supabase)
  BEGIN
    v_profile_id := NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_profile_id := NULL;
  END;

  -- Masukkan log jika family_id terdefinisi
  IF v_family_id IS NOT NULL THEN
    INSERT INTO public.audit_logs (family_id, profile_id, action, target_table, old_values, new_values)
    VALUES (v_family_id, v_profile_id, v_action || '_' || upper(TG_TABLE_NAME), TG_TABLE_NAME, v_old_data, v_new_data);
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger ke tabel envelopes
DROP TRIGGER IF EXISTS audit_envelopes_trigger ON public.envelopes;
CREATE TRIGGER audit_envelopes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.envelopes
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Bind trigger ke tabel families
DROP TRIGGER IF EXISTS audit_families_trigger ON public.families;
CREATE TRIGGER audit_families_trigger
  AFTER UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- =====================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- E. Kebijakan Keamanan untuk Tabel `audit_logs` (Hanya Admin)
-- Drop existing policies if they exist to prevent 'already exists' errors on re-run
DROP POLICY IF EXISTS select_same_family_profiles ON public.profiles;
DROP POLICY IF EXISTS update_own_profile ON public.profiles;
DROP POLICY IF EXISTS admin_update_profiles ON public.profiles;
DROP POLICY IF EXISTS select_own_family ON public.families;
DROP POLICY IF EXISTS insert_new_family ON public.families;
DROP POLICY IF EXISTS admin_update_family ON public.families;
DROP POLICY IF EXISTS select_family_envelopes ON public.envelopes;
DROP POLICY IF EXISTS admin_manage_envelopes ON public.envelopes;
DROP POLICY IF EXISTS select_family_transactions ON public.transactions;
DROP POLICY IF EXISTS insert_family_transactions ON public.transactions;
DROP POLICY IF EXISTS select_family_audit_logs ON public.audit_logs;

-- A. Kebijakan Keamanan untuk Tabel `profiles`
CREATE POLICY select_same_family_profiles ON public.profiles 
    FOR SELECT USING (family_id = public.get_user_family_id() OR id = auth.uid());

CREATE POLICY update_own_profile ON public.profiles 
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY admin_update_profiles ON public.profiles 
    FOR UPDATE USING (public.is_user_admin() AND family_id = public.get_user_family_id());

-- B. Kebijakan Keamanan untuk Tabel `families`
CREATE POLICY select_own_family ON public.families 
    FOR SELECT USING (id = public.get_user_family_id());

CREATE POLICY insert_new_family ON public.families 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY admin_update_family ON public.families 
    FOR UPDATE USING (id = public.get_user_family_id() AND public.is_user_admin());

-- C. Kebijakan Keamanan untuk Tabel `envelopes`
CREATE POLICY select_family_envelopes ON public.envelopes 
    FOR SELECT USING (family_id = public.get_user_family_id());

CREATE POLICY admin_manage_envelopes ON public.envelopes 
    FOR ALL USING (family_id = public.get_user_family_id() AND public.is_user_admin());

-- D. Kebijakan Keamanan untuk Tabel `transactions`
CREATE POLICY select_family_transactions ON public.transactions 
    FOR SELECT USING (family_id = public.get_user_family_id());

CREATE POLICY insert_family_transactions ON public.transactions 
    FOR INSERT WITH CHECK (family_id = public.get_user_family_id() AND profile_id = auth.uid());

-- E. Kebijakan Keamanan untuk Tabel `audit_logs` (Hanya Admin)
CREATE POLICY select_family_audit_logs ON public.audit_logs 
    FOR SELECT USING (family_id = public.get_user_family_id() AND public.is_user_admin());

-- =====================================================================
-- 5. RPC FUNCTIONS (SECURITY DEFINER) FOR ONBOARDING
-- =====================================================================

-- Fungsi untuk membuat keluarga baru dan menjadikan pembuatnya sebagai Admin
CREATE OR REPLACE FUNCTION public.create_family_and_set_admin(family_name TEXT, invite_code TEXT)
RETURNS public.families AS $$
DECLARE
  new_family public.families;
BEGIN
  -- 1. Buat grup keluarga baru
  INSERT INTO public.families (name, invite_code, cash_pool_balance)
  VALUES (family_name, invite_code, 0)
  RETURNING * INTO new_family;

  -- 2. Update profil pembuat menjadi Admin keluarga tersebut
  UPDATE public.profiles
  SET family_id = new_family.id, role = 'admin'
  WHERE id = auth.uid();

  RETURN new_family;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk bergabung ke grup keluarga yang sudah ada dengan kode undangan
CREATE OR REPLACE FUNCTION public.join_family_by_code(p_invite_code TEXT)
RETURNS public.families AS $$
DECLARE
  target_family public.families;
BEGIN
  -- 1. Cari keluarga berdasarkan kode
  SELECT * INTO target_family
  FROM public.families
  WHERE invite_code = p_invite_code;

  IF target_family.id IS NULL THEN
    RAISE EXCEPTION 'Kode undangan tidak valid atau keluarga tidak ditemukan.';
  END IF;

  -- 2. Update profil pengguna menjadi Member dari keluarga tersebut
  UPDATE public.profiles
  SET family_id = target_family.id, role = 'member'
  WHERE id = auth.uid();

  RETURN target_family;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

