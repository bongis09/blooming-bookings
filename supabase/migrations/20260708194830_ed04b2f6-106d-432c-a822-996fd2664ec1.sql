
CREATE TABLE public.gallery_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gallery_sets TO anon;
GRANT SELECT ON public.gallery_sets TO authenticated;
GRANT ALL ON public.gallery_sets TO service_role;

ALTER TABLE public.gallery_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active gallery sets"
  ON public.gallery_sets FOR SELECT
  USING (active = true);

CREATE POLICY "Anon can view all gallery sets for admin"
  ON public.gallery_sets FOR SELECT
  TO anon
  USING (true);

CREATE OR REPLACE FUNCTION public.gallery_sets_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER gallery_sets_updated_at
  BEFORE UPDATE ON public.gallery_sets
  FOR EACH ROW EXECUTE FUNCTION public.gallery_sets_touch_updated_at();
