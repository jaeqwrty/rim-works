
-- Fix search_path on trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Revoke execute from public/anon/auth on internal functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Restrict public rim-photos listing: drop broad SELECT, allow only direct file access via signed urls or specific reads
DROP POLICY "Public read rim photos" ON storage.objects;
CREATE POLICY "Public read rim photos" ON storage.objects FOR SELECT USING (bucket_id = 'rim-photos' AND (storage.foldername(name))[1] = 'public');
