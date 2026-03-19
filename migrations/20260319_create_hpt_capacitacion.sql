
-- Clean up any failed attempts
DROP TABLE IF EXISTS public.hpt_workers;
DROP TABLE IF EXISTS public.hpt;
DROP TABLE IF EXISTS public.capacitacion_asistentes;
DROP TABLE IF EXISTS public.capacitaciones;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- HPT Table
CREATE TABLE public.hpt (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    folio SERIAL,
    projectId TEXT,
    supervisorName TEXT,
    supervisorRut TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    trabajoRealizar TEXT,
    recursos JSONB,
    riesgos JSONB,
    medidasSeguridad JSONB,
    epp JSONB,
    firmaSupervisor TEXT,
    status TEXT DEFAULT 'Borrador',
    createdBy TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    -- Foreign keys defined separately for clarity
    CONSTRAINT hpt_projectId_fkey FOREIGN KEY (projectId) REFERENCES public.projects(id),
    CONSTRAINT hpt_createdBy_fkey FOREIGN KEY (createdBy) REFERENCES public.users(id)
);

-- HPT Workers Table
CREATE TABLE public.hpt_workers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    hpt_id TEXT REFERENCES public.hpt(id) ON DELETE CASCADE,
    nombre TEXT,
    rut TEXT,
    cargo TEXT,
    firma TEXT
);

-- Capacitaciones Table
CREATE TABLE public.capacitaciones (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    folio SERIAL,
    supervisorName TEXT,
    cargo TEXT,
    lugar TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    horaInicio TEXT,
    horaTermino TEXT,
    temario TEXT,
    firmaSupervisor TEXT,
    status TEXT DEFAULT 'Completado',
    createdBy TEXT REFERENCES public.users(id),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Capacitacion Asistentes Table
CREATE TABLE public.capacitacion_asistentes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    capacitacion_id TEXT REFERENCES public.capacitaciones(id) ON DELETE CASCADE,
    nombre TEXT,
    rut TEXT,
    cargo TEXT,
    firma TEXT
);

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON TABLE public.hpt TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.hpt_workers TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.capacitaciones TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.capacitacion_asistentes TO service_role;
GRANT ALL PRIVILEGES ON SEQUENCE public.hpt_folio_seq TO service_role;
GRANT ALL PRIVILEGES ON SEQUENCE public.capacitaciones_folio_seq TO service_role;
