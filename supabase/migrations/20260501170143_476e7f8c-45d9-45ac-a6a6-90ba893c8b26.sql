
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.vehicle_type AS ENUM ('bajaj_re', 'minivan', 'pickup_truck');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'in_progress', 'ready_for_pickup', 'completed', 'cancelled');
CREATE TYPE public.downpayment_status AS ENUM ('none', 'pending_verification', 'verified', 'needs_followup');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES (separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- RIM PRODUCTS
CREATE TABLE public.rim_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type vehicle_type NOT NULL,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  finish TEXT NOT NULL,
  color TEXT NOT NULL,
  color_hex TEXT NOT NULL DEFAULT '#1a1a1a',
  design_pattern TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT true,
  before_photo_url TEXT,
  after_photo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rim_products ENABLE ROW LEVEL SECURITY;

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE DEFAULT ('RW-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.rim_products(id) ON DELETE SET NULL,
  vehicle_type vehicle_type NOT NULL,
  config_size TEXT NOT NULL,
  config_finish TEXT NOT NULL,
  config_color TEXT NOT NULL,
  config_design TEXT NOT NULL,
  product_name TEXT NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  downpayment_amount NUMERIC(10,2),
  downpayment_status downpayment_status NOT NULL DEFAULT 'none',
  proof_of_payment_url TEXT,
  customer_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER rim_products_updated_at BEFORE UPDATE ON public.rim_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES
-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- rim_products
CREATE POLICY "Anyone views available products" ON public.rim_products FOR SELECT USING (is_available = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products" ON public.rim_products FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- orders
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('rim-photos', 'rim-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);

-- rim-photos policies (public read, admin write)
CREATE POLICY "Public read rim photos" ON storage.objects FOR SELECT USING (bucket_id = 'rim-photos');
CREATE POLICY "Admins upload rim photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'rim-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update rim photos" ON storage.objects FOR UPDATE USING (bucket_id = 'rim-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete rim photos" ON storage.objects FOR DELETE USING (bucket_id = 'rim-photos' AND public.has_role(auth.uid(), 'admin'));

-- payment-proofs policies (private)
CREATE POLICY "Users upload own proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
