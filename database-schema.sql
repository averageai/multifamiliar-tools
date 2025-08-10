-- Esquema de base de datos para Control de Horas Multi-Sede
-- PostgreSQL

-- Crear tabla de sedes
CREATE TABLE IF NOT EXISTS sedes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    documento VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    sede_id INTEGER REFERENCES sedes(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de registros de horas
CREATE TABLE IF NOT EXISTS registros_horas (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id),
    sede_id INTEGER REFERENCES sedes(id),
    fecha_entrada DATE NOT NULL,
    hora_entrada TIMESTAMP NOT NULL,
    fecha_salida DATE,
    hora_salida TIMESTAMP,
    duracion_horas DECIMAL(5,2),
    estado VARCHAR(20) DEFAULT 'activo', -- activo, finalizado, forzado
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar sedes por defecto
INSERT INTO sedes (nombre, codigo) VALUES 
    ('Manizales', 'MAN'),
    ('Dorada', 'DOR')
ON CONFLICT (codigo) DO NOTHING;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_documento ON empleados(documento);
CREATE INDEX IF NOT EXISTS idx_empleados_sede ON empleados(sede_id);
CREATE INDEX IF NOT EXISTS idx_registros_empleado ON registros_horas(empleado_id);
CREATE INDEX IF NOT EXISTS idx_registros_sede ON registros_horas(sede_id);
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros_horas(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_registros_estado ON registros_horas(estado);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar timestamps
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registros_horas_updated_at BEFORE UPDATE ON registros_horas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vista para registros con información completa
CREATE OR REPLACE VIEW registros_completos AS
SELECT 
    rh.id,
    rh.empleado_id,
    e.documento,
    e.nombre as nombre_empleado,
    s.nombre as nombre_sede,
    s.codigo as codigo_sede,
    rh.fecha_entrada,
    rh.hora_entrada,
    rh.fecha_salida,
    rh.hora_salida,
    rh.duracion_horas,
    rh.estado,
    rh.observaciones,
    rh.created_at,
    rh.updated_at
FROM registros_horas rh
JOIN empleados e ON rh.empleado_id = e.id
JOIN sedes s ON rh.sede_id = s.id;

-- Función para calcular duración automáticamente
CREATE OR REPLACE FUNCTION calcular_duracion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hora_salida IS NOT NULL AND NEW.hora_entrada IS NOT NULL THEN
        NEW.duracion_horas = EXTRACT(EPOCH FROM (NEW.hora_salida - NEW.hora_entrada)) / 3600;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular duración automáticamente
CREATE TRIGGER calcular_duracion_trigger BEFORE INSERT OR UPDATE ON registros_horas
    FOR EACH ROW EXECUTE FUNCTION calcular_duracion();

-- Función para obtener estadísticas por sede
CREATE OR REPLACE FUNCTION obtener_estadisticas_sede(p_sede_id INTEGER, p_fecha DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_registros BIGINT,
    empleados_activos BIGINT,
    horas_totales DECIMAL(10,2),
    promedio_horas DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_registros,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END) as empleados_activos,
        COALESCE(SUM(duracion_horas), 0) as horas_totales,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(duracion_horas), 0) / COUNT(*)
            ELSE 0 
        END as promedio_horas
    FROM registros_horas 
    WHERE sede_id = p_sede_id 
    AND fecha_entrada = p_fecha;
END;
$$ language 'plpgsql';
