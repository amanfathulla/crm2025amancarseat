CREATE TABLE public.review_materials (
  review_id text PRIMARY KEY,
  material text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.review_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_materials TO authenticated;
GRANT ALL ON public.review_materials TO service_role;

ALTER TABLE public.review_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read review materials"
  ON public.review_materials FOR SELECT USING (true);

CREATE POLICY "Anyone can tag a new review material"
  ON public.review_materials FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update review materials"
  ON public.review_materials FOR UPDATE USING (public.is_valid_admin_session()) WITH CHECK (public.is_valid_admin_session());

CREATE POLICY "Admins can delete review materials"
  ON public.review_materials FOR DELETE USING (public.is_valid_admin_session());

CREATE TRIGGER update_review_materials_updated_at
  BEFORE UPDATE ON public.review_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();