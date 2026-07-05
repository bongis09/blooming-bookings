
-- Services catalogue
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('nails','toes','pedi')),
  duration_minutes int NOT NULL,
  price_cents int NOT NULL,
  tier text CHECK (tier IN ('try','regular','bloom','vip')),
  active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services readable by anyone" ON public.services FOR SELECT USING (true);
CREATE POLICY "services manageable by anon (phase 1 stub)" ON public.services FOR ALL TO anon USING (true) WITH CHECK (true);

-- Clients
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  marketing_opt_in boolean NOT NULL DEFAULT true,
  notes text,
  vip boolean NOT NULL DEFAULT false,
  total_visits int NOT NULL DEFAULT 0,
  total_spend_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.clients TO anon;
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients anon access (phase 1 stub)" ON public.clients FOR ALL TO anon USING (true) WITH CHECK (true);

-- Bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','completed','no_show','cancelled','rescheduled')),
  deposit_cents int NOT NULL DEFAULT 0,
  deposit_paid boolean NOT NULL DEFAULT false,
  deposit_refunded boolean NOT NULL DEFAULT false,
  balance_due_cents int NOT NULL DEFAULT 0,
  balance_paid_cents int NOT NULL DEFAULT 0,
  notes text,
  source text NOT NULL DEFAULT 'app',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bookings_start_at_idx ON public.bookings(start_at);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO anon;
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings anon access (phase 1 stub)" ON public.bookings FOR ALL TO anon USING (true) WITH CHECK (true);

-- Prevent overlapping confirmed bookings
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('confirmed','pending'));

-- Blocked slots
CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.blocked_slots TO anon;
GRANT ALL ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked_slots anon access (phase 1 stub)" ON public.blocked_slots FOR ALL TO anon USING (true) WITH CHECK (true);

-- Settings (singleton)
CREATE TABLE public.settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  working_hours jsonb NOT NULL DEFAULT '{"mon":null,"tue":{"start":"08:30","end":"16:30"},"wed":{"start":"08:30","end":"16:30"},"thu":{"start":"08:30","end":"16:30"},"fri":{"start":"08:30","end":"16:30"},"sat":{"start":"08:30","end":"16:30"},"sun":null}'::jsonb,
  buffer_minutes int NOT NULL DEFAULT 15,
  deposit_cents int NOT NULL DEFAULT 5000,
  cancellation_hours int NOT NULL DEFAULT 24,
  whatsapp_business_number text NOT NULL DEFAULT '27692281472',
  instagram_handle text NOT NULL DEFAULT 'leratolanga866',
  salon_name text NOT NULL DEFAULT 'Blooming GLITZ',
  salon_tagline text NOT NULL DEFAULT 'Let me doll you up 💗',
  admin_pin text NOT NULL DEFAULT '1234'
);
GRANT SELECT, UPDATE ON public.settings TO anon;
GRANT ALL ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings anon access (phase 1 stub)" ON public.settings FOR ALL TO anon USING (true) WITH CHECK (true);

INSERT INTO public.settings (id) VALUES (1);

-- Seed services
INSERT INTO public.services (name, description, category, duration_minutes, price_cents, tier, display_order) VALUES
  ('Try Me ✨', 'soak-off + fresh gel overlay — perfect for first-timers', 'nails', 75, 25000, 'try', 1),
  ('Gel Overlay 💖', 'gel polish on your natural nails, no tips', 'nails', 90, 30000, 'regular', 2),
  ('Polygel Overlay 💖', 'polygel strength on your natural nails', 'nails', 105, 35000, 'regular', 3),
  ('Acrylic Tips 💅', 'full set acrylic on tips — classic length', 'nails', 120, 40000, 'regular', 4),
  ('Polygel Tips 💅', 'polygel tips, lighter and stronger', 'nails', 120, 45000, 'regular', 5),
  ('Toe Gel 🦶', 'gel polish on toes', 'toes', 45, 18000, 'regular', 6),
  ('Full Bloom 🌸', 'hands + toes, the whole package babe', 'pedi', 180, 60000, 'bloom', 7),
  ('Spa Pedi 🌸', 'soak, scrub, polish — full pedi love', 'pedi', 90, 32000, 'regular', 8);
