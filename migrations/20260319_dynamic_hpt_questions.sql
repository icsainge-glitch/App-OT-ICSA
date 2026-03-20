-- Create the HPT Questions table
CREATE TABLE IF NOT EXISTS hpt_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'recursos', 'riesgos', 'medidas', 'epp'
    item_key TEXT NOT NULL,
    label TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(category, item_key)
);

-- Enable RLS
ALTER TABLE hpt_questions ENABLE ROW LEVEL SECURITY;

-- Allow read access for all authenticated users
CREATE POLICY "Allow read for authenticated" ON hpt_questions FOR SELECT TO authenticated USING (true);

-- Allow all for admins and prevencionistas
CREATE POLICY "Allow all for authenticated" ON hpt_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed existing items
INSERT INTO hpt_questions (category, item_key, label, order_index) VALUES
('recursos', 'personal', '¿Se cuenta con el personal necesario y entrenado según el procedimiento de trabajo ICSA?', 1),
('recursos', 'equipos', '¿Se cuenta con los Equipos, Herramientas necesarias, y estos se encuentran en buen estado de uso?', 2),
('recursos', 'materiales', '¿Se dispone de los materiales, repuestos e insumos necesarios?', 3),
('recursos', 'coordinacionC', '¿Se realizó coordinaciones necesarias con cliente para acceder a las zonas de trabajo?', 4),
('recursos', 'bloqueo', '¿Se coordinó bloqueo de seguridad y/o líneas (Eléctricas, Hidráulicas, etc.)?', 5),
('recursos', 'permisoC', '¿Se solicitó el permiso de ingreso al personal de prevención de riesgos cliente?', 6),

('riesgos', 'aprisionamiento', 'Aprisionamiento. Tableros, máquinas o equipos en movimiento...', 1),
('riesgos', 'atrapamiento', 'Atrapamiento de o parte de todo el cuerpo por objetos...', 2),
('riesgos', 'caidaMismo', 'Caída al mismo nivel. Ej: caminar en áreas con agua, hielo...', 3),
('riesgos', 'caidaDistinto', 'Caída a distinto nivel. Ej: caídas desde Caballetes, andamios...', 4),
('riesgos', 'energiaE', 'Contacto con energía eléctrica. Ej: comando, tableros generales...', 5),
('riesgos', 'fluidosP', 'Contacto con fluidos a presión. Ej: agua, aire, gases, vapor, etc', 6),
('riesgos', 'sustanciasT', 'Contacto con sust. Tóxicas. Ej: Cloro, Flúor, Ácido Sulfúrico...', 7),
('riesgos', 'temperaturas', 'Contacto con Temperaturas Extremas. Ej: calor o frío...', 8),
('riesgos', 'estadoP', 'Estado Personal, Estoy en buenas condic. Físicas y Psicológicas...', 9),
('riesgos', 'radiacion', 'Exposición a. Ej: Radiación Ultravioleta, ruidos, gases...', 10),
('riesgos', 'golpeadoC', 'Golpeado con o Contra Herramientas. Objeto, estructuras...', 11),
('riesgos', 'golpeadoO', 'Golpeado por objetos en mov. Ej: camión grúa, caída de materiales...', 12),
('riesgos', 'atropellado', 'Atropellado Por Vehículo, Maquinaria u Equipo en Movimiento.', 13),
('riesgos', 'inmersion', 'Por Inmersión (asfixia). Ej: Ingreso al agua, recintos cerrados...', 14),
('riesgos', 'sobreesfuerzo', 'Sobreesfuerzo. Ej: levantar carga sin ayuda o equipos de levante.', 15),
('riesgos', 'cargasS', 'Cargas Suspendidas. Ej: exposición bajo cargas.', 16),
('riesgos', 'incendioE', 'Incendios, Explosión, Derrames, Choques, Volcamientos, etc.', 17),
('riesgos', 'otros', 'Otros: Supervisor debe llenar este item solo si aplica', 18),

('medidas', 'limpiesa', 'El área de trabajo está limpia, ordenada y con accesos expeditos.', 1),
('medidas', 'iluminacion', 'El área dispone de la iluminación requerida para la tarea a realizar.', 2),
('medidas', 'ventilacion', 'El área de trabajo dispone de la ventilación requerida para la tarea.', 3),
('medidas', 'electricas', 'Las instalaciones eléctricas portátiles se encuentran en buen estado.', 4),
('medidas', 'superficies', 'Las superficies de trabajo se encuentran en buenas condiciones.', 5),
('medidas', 'delimitada', 'Está delimitada la zona la zona de bloqueo y movimientos de equipos.', 6),
('medidas', 'controlL', 'Se verifica el control local de los bloqueos del o los equipos...', 7),
('medidas', 'enclavamiento', 'Se verifica el enclavamiento mecánico de andamios, andamio escala...', 8),
('medidas', 'eppAdecuado', 'Se verifica la utilización de los EPP adecuados y en buen estado.', 9),
('medidas', 'arnes', 'Se utilizan arnés de seguridad sobre 1,5 mt.', 10),
('medidas', 'fueraCarga', 'Los trabajadores se ubican fuera del área de carga suspendida...', 11),
('medidas', 'izajes', 'Se utilizan equipos de izajes y de traslado de materiales en buen estado.', 12),
('medidas', 'evitarIncendio', 'Se implementan medidas para evitar un incendio en el área.', 13),
('medidas', 'zonaSeguridad', 'El área cuenta con zona de seguridad en caso de emergencias.', 14),

('epp', 'casco', 'Casco de Seguridad', 1),
('epp', 'lentes', 'Lentes de Seguridad', 2),
('epp', 'calzado', 'Calzado de Seguridad', 3),
('epp', 'respiratorio', 'Protector Respiratorio', 4),
('epp', 'careta', 'Careta Facial', 5),
('epp', 'guantes', 'Guantes de seguridad', 6),
('epp', 'legionario', 'Legionario', 7),
('epp', 'barbiquejo', 'Barbiquejo', 8),
('epp', 'auditivo', 'Protector Auditivo', 9),
('epp', 'soldar', 'Máscara soldar', 10),
('epp', 'solar', 'Protector solar', 11),
('epp', 'arnesY', 'Arnés de Seguridad y Cabo de Vida tipo Y', 12)
ON CONFLICT (category, item_key) DO NOTHING;
