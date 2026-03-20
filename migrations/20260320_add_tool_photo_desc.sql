-- Add support for tool photos and descriptions
ALTER TABLE public.herramientas ADD COLUMN IF NOT EXISTS imageurl TEXT;
ALTER TABLE public.herramientas ADD COLUMN IF NOT EXISTS descripcion TEXT;
