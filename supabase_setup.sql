-- Supabase Dashboard orqali ishga tushirish uchun SQL buyruqlari
-- Bu faylni Supabase Dashboard > SQL Editor da ishga tushiring

-- 1. Profiles jadvalini yaratish
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS (Row Level Security) yoqish
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies yaratish
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Yangi foydalanuvchi uchun trigger funksiyasi
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger yaratish
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Admin foydalanuvchini yaratish (bu qismni Authentication > Users orqali qo'lda qiling)
-- Email: admin@togogroup.com
-- Password: togo0800
-- Keyin quyidagi buyruqni ishga tushiring:

-- Admin profile yaratish (admin foydalanuvchi yaratilgandan keyin)
-- INSERT INTO public.profiles (id, username, full_name, role)
-- SELECT id, 'TogoGroupPRO', 'Admin', 'admin'
-- FROM auth.users 
-- WHERE email = 'admin@togogroup.com';
