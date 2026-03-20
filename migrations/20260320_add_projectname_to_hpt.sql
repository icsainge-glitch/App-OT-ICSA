-- Add projectName to HPT for easy display and PDFs
ALTER TABLE public.hpt ADD COLUMN IF NOT EXISTS projectname TEXT;

-- Verify permissions
GRANT ALL PRIVILEGES ON TABLE public.hpt TO service_role;
