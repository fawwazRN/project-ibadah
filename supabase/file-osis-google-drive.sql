-- File OSIS: support Google Drive links while keeping Supabase Storage records compatible.
-- This project currently uses public.file_osis_files.storage_path for uploaded objects.
-- Google Drive entries have storage_path = NULL and source_type = 'google_drive'.

ALTER TABLE public.file_osis_files
  ALTER COLUMN storage_path DROP NOT NULL;

ALTER TABLE public.file_osis_files
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'storage'
    CHECK (source_type IN ('storage', 'google_drive')),
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS drive_file_id text;

DROP POLICY IF EXISTS "Read published File OSIS files" ON public.file_osis_files;
DROP POLICY IF EXISTS "Super admin manages File OSIS files" ON public.file_osis_files;

CREATE POLICY "Read published File OSIS files"
ON public.file_osis_files
FOR SELECT
TO authenticated
USING (
  (
    published = true
    AND EXISTS (
      SELECT 1
      FROM public.file_osis_folders f
      WHERE f.id = file_osis_files.folder_id
        AND f.published = true
    )
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = (SELECT auth.uid())
      AND p.role = 'super_admin'
  )
);

CREATE POLICY "Super admin manages File OSIS files"
ON public.file_osis_files
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = (SELECT auth.uid())
      AND p.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = (SELECT auth.uid())
      AND p.role = 'super_admin'
  )
);
