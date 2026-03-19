
-- Script de Inicialización Corregido (Alineado con el Código)
-- Usamos CASCADE para evitar errores de dependencia al limpiar
DROP TABLE IF EXISTS tool_movements CASCADE;
DROP TABLE IF EXISTS herramientas CASCADE;
DROP TABLE IF EXISTS hpt_workers CASCADE;
DROP TABLE IF EXISTS hpt CASCADE;
DROP TABLE IF EXISTS capacitacion_asistentes CASCADE;
DROP TABLE IF EXISTS capacitaciones CASCADE;
DROP TABLE IF EXISTS historial CASCADE;
DROP TABLE IF EXISTS ordenes CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS personnel CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usuarios
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  name TEXT,
  role TEXT,
  rut TEXT,
  signatureurl TEXT
);

-- Clientes
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  nombrecliente TEXT,
  rutcliente TEXT,
  telefonocliente TEXT,
  emailclientes TEXT,
  direccioncliente TEXT,
  comunacliente TEXT,
  razonsocial TEXT,
  estadocliente TEXT,
  createdat TIMESTAMPTZ DEFAULT NOW(),
  updatedby TEXT
);

-- Personal
CREATE TABLE personnel (
  id TEXT PRIMARY KEY,
  nombre_t TEXT,
  rut_t TEXT,
  email TEXT,
  rol_t TEXT,
  telefono_t TEXT,
  cargo_t TEXT,
  vehiculo_t TEXT,
  patente_t TEXT,
  estado_t TEXT,
  createdat TIMESTAMPTZ DEFAULT NOW(),
  updatedby TEXT
);

-- Proyectos
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  projectid TEXT, -- Para compatibilidad si se usa
  clientid TEXT REFERENCES clients(id),
  clientname TEXT,
  status TEXT,
  createdby TEXT,
  creatoremail TEXT,
  startdate TEXT,
  enddate TEXT,
  updatedat TIMESTAMPTZ DEFAULT NOW(),
  teamnames JSONB DEFAULT '[]',
  teamids JSONB DEFAULT '[]',
  summary TEXT,
  hiddenby JSONB DEFAULT '[]'
);

-- Ordenes de Trabajo
CREATE TABLE ordenes (
  id TEXT PRIMARY KEY,
  folio SERIAL,
  clientname TEXT,
  clientid TEXT REFERENCES clients(id),
  clientphone TEXT,
  clientemail TEXT,
  projectid TEXT REFERENCES projects(id),
  branch TEXT,
  address TEXT,
  interventionaddress TEXT,
  building TEXT,
  floor TEXT,
  signaltype TEXT,
  signalcount INTEGER,
  iscert BOOLEAN DEFAULT FALSE,
  certdetails TEXT,
  islabeled BOOLEAN DEFAULT FALSE,
  labeldetails TEXT,
  description TEXT,
  techname TEXT,
  techrut TEXT,
  techsignatureurl TEXT,
  clientreceivername TEXT,
  clientreceiverrut TEXT,
  clientreceiveremail TEXT,
  clientsignatureurl TEXT,
  sketchimageurl TEXT,
  status TEXT,
  team JSONB DEFAULT '[]',
  teamids JSONB DEFAULT '[]',
  createdby TEXT,
  startdate TEXT,
  updatedat TIMESTAMPTZ DEFAULT NOW(),
  isprojectsummary BOOLEAN DEFAULT FALSE,
  signaturetoken TEXT,
  tokenexpiry TEXT,
  signaturedate TEXT,
  tipotrabajo TEXT,
  tipotrabajootro TEXT,
  detalletecnico JSONB DEFAULT '[]',
  puntosred JSONB DEFAULT '[]',
  observacionesgenerales TEXT,
  estadotrabajo TEXT,
  clientrut TEXT,
  condicionescobro JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  hiddenby JSONB DEFAULT '[]'
);

-- Historial
CREATE TABLE historial (
  id TEXT PRIMARY KEY,
  folio INTEGER,
  clientname TEXT,
  clientid TEXT,
  clientphone TEXT,
  clientemail TEXT,
  projectid TEXT,
  branch TEXT,
  address TEXT,
  interventionaddress TEXT,
  building TEXT,
  floor TEXT,
  signaltype TEXT,
  signalcount INTEGER,
  iscert BOOLEAN,
  certdetails TEXT,
  islabeled BOOLEAN,
  labeldetails TEXT,
  description TEXT,
  techname TEXT,
  techrut TEXT,
  techsignatureurl TEXT,
  clientreceivername TEXT,
  clientreceiverrut TEXT,
  clientreceiveremail TEXT,
  clientsignatureurl TEXT,
  sketchimageurl TEXT,
  status TEXT,
  team JSONB,
  teamids JSONB,
  createdby TEXT,
  startdate TEXT,
  updatedat TEXT,
  isprojectsummary BOOLEAN,
  signaturetoken TEXT,
  tokenexpiry TEXT,
  signaturedate TEXT,
  tipotrabajo TEXT,
  tipotrabajootro TEXT,
  detalletecnico JSONB,
  puntosred JSONB,
  observacionesgenerales TEXT,
  estadotrabajo TEXT,
  clientrut TEXT,
  condicionescobro JSONB,
  photos JSONB,
  hiddenby JSONB DEFAULT '[]'
);

-- Herramientas
CREATE TABLE herramientas (
  id TEXT PRIMARY KEY,
  nombre TEXT,
  marca TEXT,
  modelo TEXT,
  serie TEXT,
  categoria TEXT,
  estado TEXT,
  asignadoa TEXT,
  notas TEXT,
  createdat TIMESTAMPTZ DEFAULT NOW(),
  updatedat TIMESTAMPTZ DEFAULT NOW(),
  imageurl TEXT,
  codigointerno TEXT,
  descripcion TEXT,
  lastreturndate TEXT
);

-- Movimientos de Herramientas
CREATE TABLE tool_movements (
  id TEXT PRIMARY KEY,
  toolid TEXT REFERENCES herramientas(id),
  toolname TEXT,
  action TEXT,
  responsible TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  comment TEXT,
  status TEXT DEFAULT 'Pendiente',
  assignmentdate TEXT,
  batchid TEXT,
  signatureurl TEXT
);

-- HPT Table
CREATE TABLE hpt (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    folio SERIAL,
    projectid TEXT REFERENCES projects(id),
    supervisorname TEXT,
    supervisorrut TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    trabajorealizar TEXT,
    recursos JSONB,
    riesgos JSONB,
    medidas JSONB, -- Se cambió de medidasSeguridad a medidas para coincidir con el código
    epp JSONB,
    firmasupervisor TEXT,
    status TEXT DEFAULT 'Borrador',
    createdby TEXT REFERENCES users(id),
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- HPT Workers Table
CREATE TABLE hpt_workers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    hpt_id TEXT REFERENCES hpt(id) ON DELETE CASCADE,
    nombre TEXT,
    rut TEXT,
    cargo TEXT,
    firma TEXT
);

-- Capacitaciones Table
CREATE TABLE capacitaciones (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    folio SERIAL,
    supervisorname TEXT,
    cargo TEXT,
    lugar TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    horainicio TEXT,
    horatermino TEXT,
    temario TEXT,
    firmasupervisor TEXT,
    status TEXT DEFAULT 'Completado',
    createdby TEXT REFERENCES users(id),
    createdat TIMESTAMPTZ DEFAULT NOW(),
    updatedat TIMESTAMPTZ DEFAULT NOW(),
    -- Columnas nuevas para firma remota
    prevencionemail TEXT,
    prevencionname TEXT,
    prevencion_signature_url TEXT,
    prevencion_signature_date TIMESTAMPTZ
);

-- Capacitacion Asistentes Table
CREATE TABLE capacitacion_asistentes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    capacitacion_id TEXT REFERENCES capacitaciones(id) ON DELETE CASCADE,
    nombre TEXT,
    rut TEXT,
    cargo TEXT,
    firma TEXT
);

-- Habilitar RLS en todas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE hpt ENABLE ROW LEVEL SECURITY;
ALTER TABLE hpt_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacitacion_asistentes ENABLE ROW LEVEL SECURITY;

-- Insertar Usuario Admin inicial
INSERT INTO users (id, email, password, name, role, rut)
VALUES ('admin-001', 'admin@icsa.cl', 'admin123', 'Administrador ICSA', 'admin', '12.345.678-9')
ON CONFLICT (id) DO NOTHING;

INSERT INTO personnel (id, nombre_t, rut_t, email, rol_t, estado_t, cargo_t)
VALUES ('admin-001', 'Administrador ICSA', '12.345.678-9', 'admin@icsa.cl', 'admin', 'Activo', 'Gerente')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
