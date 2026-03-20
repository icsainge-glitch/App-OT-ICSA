
-- Add missing columns to capacitaciones table
ALTER TABLE public.capacitaciones ADD COLUMN IF NOT EXISTS prevencionemail TEXT;
ALTER TABLE public.capacitaciones ADD COLUMN IF NOT EXISTS prevencionname TEXT;
ALTER TABLE public.capacitaciones ADD COLUMN IF NOT EXISTS signature_token TEXT;
ALTER TABLE public.capacitaciones ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMPTZ;
ALTER TABLE public.capacitaciones ADD COLUMN IF NOT EXISTS prevencion_signature_url TEXT;
ALTER TABLE public.capacitaciones ADD COLUMN IF NOT EXISTS prevencion_signature_date TIMESTAMPTZ;

-- Ensure columns exist in hpt table (already created in previous migration but double checking casing)
-- Note: In Postgres, unquoted names are lowercase. 
-- The previous migration used: projectId, supervisorName, etc.
-- If they were created as lowercase, they'll be projectid, supervisorname.
-- My diagnostic script confirmed they are lowercase 'projectid', 'supervisorname'.

-- The code in db-actions.ts lowercases all payload keys.
-- So we should ensure the DB has these columns in lowercase (which it does by default if not quoted).

-- Adding any missing columns to hpt if needed (comparing with CapacitacionForm pattern)
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS signature_token TEXT;
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMPTZ;
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS prevencion_signature_url TEXT;
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS prevencion_signature_date TIMESTAMPTZ;

-- Permissions
GRANT ALL PRIVILEGES ON TABLE public.capacitaciones TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.hpt TO service_role;
