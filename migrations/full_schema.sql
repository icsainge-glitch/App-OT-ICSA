
-- BASES DE DATOS COMPLETA - ESTUDIO ICSA
-- Versión Final Optimizada (2026-03-20)
-- 100% Compatible con el código frontend y Server Actions
-- --------------------------------------------------

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- USERS (Sincronización con Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'Técnico',
    rut TEXT,
    signatureurl TEXT,
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombrecliente TEXT NOT NULL,
    rutcliente TEXT,
    telefonocliente TEXT,
    emailclientes TEXT,
    direccioncliente TEXT,
    comunacliente TEXT,
    razonsocial TEXT,
    estadocliente TEXT DEFAULT 'Activo',
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedby UUID REFERENCES public.users(id)
);

-- PERSONNEL
CREATE TABLE IF NOT EXISTS public.personnel (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    nombre_t TEXT NOT NULL,
    rut_t TEXT,
    email TEXT,
    rol_t TEXT DEFAULT 'Técnico',
    telefono_t TEXT,
    cel_t TEXT, -- Alias para compatibilidad con UI
    cargo_t TEXT,
    vehiculo_t TEXT,
    patente_t TEXT,
    estado_t TEXT DEFAULT 'Activo',
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedby UUID REFERENCES public.users(id)
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    clientid UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    clientname TEXT,
    startdate TIMESTAMPTZ,
    enddate TIMESTAMPTZ,
    teamids JSONB DEFAULT '[]'::JSONB,
    teamnames JSONB DEFAULT '[]'::JSONB,
    summary TEXT,
    hiddenby JSONB DEFAULT '[]'::JSONB,
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- ORDENES (Órdenes Activas)
CREATE TABLE IF NOT EXISTS public.ordenes (
    id TEXT PRIMARY KEY,
    folio INTEGER,
    projectid UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    clientid UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    clientname TEXT,
    clientrut TEXT,
    clientphone TEXT,
    clientemail TEXT,
    clientreceiveremail TEXT,
    clientreceivername TEXT,
    clientreceiverrut TEXT,
    branch TEXT,
    address TEXT,
    interventionaddress TEXT,
    building TEXT,
    floor TEXT,
    createdby UUID REFERENCES public.users(id),
    technicianid UUID REFERENCES public.users(id),
    status TEXT DEFAULT 'Pending',
    description TEXT,
    tipotrabajo TEXT,
    tipotrabajootro TEXT,
    startdate TIMESTAMPTZ,
    updatedat TIMESTAMPTZ DEFAULT NOW(),
    updatedby TEXT,
    team JSONB DEFAULT '[]'::JSONB,
    teamids JSONB DEFAULT '[]'::JSONB,
    detalletecnico JSONB DEFAULT '[]'::JSONB,
    puntosred JSONB DEFAULT '[]'::JSONB,
    observacionesgenerales TEXT,
    estadotrabajo TEXT,
    condicionescobro JSONB DEFAULT '[]'::JSONB,
    signaltype TEXT,
    signalcount INTEGER DEFAULT 0,
    iscert BOOLEAN DEFAULT FALSE,
    islabeled BOOLEAN DEFAULT FALSE,
    isprojectsummary BOOLEAN DEFAULT FALSE,
    techname TEXT,
    techrut TEXT,
    techsignatureurl TEXT,
    clientsignatureurl TEXT,
    signaturedate TIMESTAMPTZ,
    sketchimageurl TEXT,
    photos JSONB DEFAULT '[]'::JSONB,
    hiddenby JSONB DEFAULT '[]'::JSONB,
    signaturetoken TEXT,
    tokenexpiry TIMESTAMPTZ
);

-- HISTORIAL (Órdenes Finalizadas)
CREATE TABLE IF NOT EXISTS public.historial (
    LIKE public.ordenes INCLUDING ALL
);

-- HERRAMIENTAS
CREATE TABLE IF NOT EXISTS public.herramientas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    serie TEXT,
    codigointerno TEXT,
    categoria TEXT,
    estado TEXT DEFAULT 'Disponible',
    asignadoa TEXT,
    notas TEXT,
    lastreturndate TIMESTAMPTZ,
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- TOOL MOVEMENTS
CREATE TABLE IF NOT EXISTS public.tool_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    toolid UUID REFERENCES public.herramientas(id) ON DELETE CASCADE,
    toolname TEXT,
    action TEXT,
    responsible TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    comment TEXT,
    status TEXT DEFAULT 'Verificado',
    assignmentdate TIMESTAMPTZ,
    batchid UUID,
    signatureurl TEXT
);

-- HPT (Hoja de Planificación del Trabajo)
CREATE TABLE IF NOT EXISTS public.hpt (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio INTEGER,
    projectid UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    supervisorname TEXT,
    supervisorrut TEXT,
    trabajorealizar TEXT,
    firmasupervisor TEXT,
    status TEXT DEFAULT 'Borrador',
    recursos JSONB DEFAULT '{}'::JSONB,
    riesgos JSONB DEFAULT '{}'::JSONB,
    medidas JSONB DEFAULT '{}'::JSONB,
    epp JSONB DEFAULT '{}'::JSONB,
    createdby UUID REFERENCES public.users(id),
    signature_token TEXT,
    token_expiry TIMESTAMPTZ,
    prevencion_signature_url TEXT,
    prevencion_signature_date TIMESTAMPTZ,
    hiddenby JSONB DEFAULT '[]'::JSONB,
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- HPT WORKERS
CREATE TABLE IF NOT EXISTS public.hpt_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hpt_id UUID REFERENCES public.hpt(id) ON DELETE CASCADE,
    nombre TEXT,
    rut TEXT,
    cargo TEXT,
    firma TEXT -- URL de la firma
);

-- CAPACITACIONES
CREATE TABLE IF NOT EXISTS public.capacitaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio INTEGER,
    temario TEXT,
    horainicio TIMESTAMPTZ,
    horatermino TIMESTAMPTZ,
    firmasupervisor TEXT,
    supervisorname TEXT,
    prevencionname TEXT,
    prevencionemail TEXT,
    signature_token TEXT,
    token_expiry TIMESTAMPTZ,
    prevencion_signature_url TEXT,
    prevencion_signature_date TIMESTAMPTZ,
    hiddenby JSONB DEFAULT '[]'::JSONB,
    createdby UUID REFERENCES public.users(id),
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- CAPACITACION ASISTENTES
CREATE TABLE IF NOT EXISTS public.capacitacion_asistentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capacitacion_id UUID REFERENCES public.capacitaciones(id) ON DELETE CASCADE,
    nombre TEXT,
    rut TEXT,
    cargo TEXT,
    firma TEXT
);

-- 3. SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hpt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hpt_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacitacion_asistentes ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. VIEW (Optional for easy access if needed)
-- VIEW active_personnel_with_auth...
