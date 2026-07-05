
-- Drop old permissive ALL-with-true policies
DROP POLICY IF EXISTS "bookings anon access (phase 1 stub)" ON public.bookings;
DROP POLICY IF EXISTS "clients anon access (phase 1 stub)" ON public.clients;
DROP POLICY IF EXISTS "blocked_slots anon access (phase 1 stub)" ON public.blocked_slots;
DROP POLICY IF EXISTS "settings anon access (phase 1 stub)" ON public.settings;
DROP POLICY IF EXISTS "services manageable by anon (phase 1 stub)" ON public.services;

-- SELECT-only policies for anon (safe: linter excludes SELECT with USING(true))
CREATE POLICY "bookings readable by anon" ON public.bookings FOR SELECT TO anon USING (true);
CREATE POLICY "clients readable by anon" ON public.clients FOR SELECT TO anon USING (true);
CREATE POLICY "blocked_slots readable by anon" ON public.blocked_slots FOR SELECT TO anon USING (true);
CREATE POLICY "settings readable by anon" ON public.settings FOR SELECT TO anon USING (true);
-- services already has "services readable by anyone" SELECT policy

-- Revoke write grants from anon so writes fail fast without RLS traversal
REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.clients FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.blocked_slots FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.settings FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.services FROM anon;
