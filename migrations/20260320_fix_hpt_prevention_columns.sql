-- Migration: Add missing prevention columns to HPT table
-- Description: Adds 'prevencionemail' and 'prevencionname' to the 'hpt' table.

-- Add columns to 'hpt' table
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS prevencionemail TEXT;
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS prevencionname TEXT;

-- Verify other columns from fix_schema are there (just in case)
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS signature_token TEXT;
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMPTZ;
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS prevencion_signature_url TEXT;
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS prevencion_signature_date TIMESTAMPTZ;

-- Re-grant permissions
GRANT ALL PRIVILEGES ON TABLE public.hpt TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.hpt TO anon, authenticated;
