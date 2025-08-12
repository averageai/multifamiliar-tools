/**
 * 🗄️ CONFIGURACIÓN DE BASE DE DATOS - MULTIFAMILIAR TOOLS
 * ======================================================
 * 
 * ⚠️  ARCHIVO CRÍTICO DEL SISTEMA - NO MODIFICAR SIN AUTORIZACIÓN
 * 
 * Este archivo maneja:
 * - Configuración de conexión PostgreSQL
 * - Queries SQL para control de horas
 * - Configuración de sedes
 * - Variables de entorno para Vercel
 * 
 * 🔧 CONFIGURACIÓN VITAL:
 * - Host: Configurar en variables de entorno
 * - Database: Configurar en variables de entorno
 * - User: Configurar en variables de entorno
 * - SSL: Deshabilitado (compatibilidad)
 * - Pool: 20 conexiones máximas
 * 
 * 🌍 VARIABLES DE ENTORNO (Vercel):
 * - DATABASE_URL: Conexión completa (prioridad)
 * - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD: Individuales
 * - NODE_ENV: production/development
 * 
 * 📋 TABLAS PRINCIPALES:
 * - sedes: Configuración de sedes (Manizales, Dorada)
 * - empleados: Empleados registrados
 * - registros_horas: Registros de entrada/salida
 * 
 * 🔒 QUERIES PROTEGIDAS:
 * - getSedes: Obtener sedes activas
 * - getEmpleadoByDocumento: Buscar empleado
 * - getRegistrosHoy: Registros del día
 * - createRegistro: Crear entrada
 * - finalizarRegistro: Finalizar salida
 * 
 * ⚡ PARA AGREGAR NUEVAS FUNCIONALIDADES:
 * 1. Agregar queries en el objeto 'queries'
 * 2. NO modificar la configuración base de conexión
 * 3. Usar parámetros preparados ($1, $2, etc.)
 * 
 * 🛡️ PROTECCIÓN DEL SISTEMA:
 * - Conexión SSL deshabilitada para compatibilidad
 * - Pool de conexiones con timeout
 * - Manejo de errores centralizado
 * - Configuración dinámica por entorno
 */

// Configuración de base de datos PostgreSQL
let dbConfig;

if (process.env.DATABASE_URL) {
    // Usar DATABASE_URL si está disponible (Vercel)
    dbConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: false, // Deshabilitar SSL para evitar errores de conexión
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        // Configurar timezone para Colombia
        options: '-c timezone=America/Bogota'
    };
} else {
    // Configuración individual
    dbConfig = {
        host: process.env.DB_HOST || '[CONFIGURAR_HOST]',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || '[CONFIGURAR_DATABASE]',
        user: process.env.DB_USER || '[CONFIGURAR_USER]',
        password: process.env.DB_PASSWORD || '[CONFIGURAR_PASSWORD]',
        ssl: false, // Deshabilitar SSL para evitar errores de conexión
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        // Configurar timezone para Colombia
        options: '-c timezone=America/Bogota'
    };
}

// Configuración de sedes
const sedesConfig = {
    manizales: {
        id: 1,
        nombre: 'Manizales',
        codigo: 'MAN',
        icon: '🏪',
        color: '#28a745'
    },
    dorada: {
        id: 2,
        nombre: 'Dorada',
        codigo: 'DOR',
        icon: '🏬',
        color: '#3498db'
    }
};

// Queries SQL comunes
const queries = {
    // Sedes
    getSedes: 'SELECT * FROM sedes WHERE activa = true ORDER BY nombre',
    
    // Empleados
    getEmpleadoByDocumento: 'SELECT * FROM empleados WHERE documento = $1 AND activo = true',
    createEmpleado: 'INSERT INTO empleados (documento, nombre, sede_id) VALUES ($1, $2, $3) RETURNING *',
    getEmpleadosBySede: 'SELECT * FROM empleados WHERE sede_id = $1 AND activo = true ORDER BY nombre',
    
    // Registros
    getRegistrosHoy: `
        SELECT 
            rh.id,
            rh.empleado_id,
            e.documento,
            e.nombre as nombre_empleado,
            s.nombre as nombre_sede,
            rh.fecha_entrada,
            rh.hora_entrada,
            rh.fecha_salida,
            rh.hora_salida,
            rh.duracion_horas,
            rh.estado,
            rh.observaciones
        FROM registros_horas rh
        JOIN empleados e ON rh.empleado_id = e.id
        JOIN sedes s ON rh.sede_id = s.id
        WHERE rh.sede_id = $1 
        AND rh.fecha_entrada = $2
        ORDER BY rh.hora_entrada DESC
    `,
    
    getRegistroActivo: `
        SELECT rh.*, e.documento, e.nombre as nombre_empleado
        FROM registros_horas rh
        JOIN empleados e ON rh.empleado_id = e.id
        WHERE e.documento = $1 
        AND rh.estado = 'activo'
        AND rh.fecha_entrada = $2
        ORDER BY rh.hora_entrada DESC
        LIMIT 1
    `,
    
    getUltimoRegistroHoy: `
        SELECT rh.*, e.documento, e.nombre as nombre_empleado
        FROM registros_horas rh
        JOIN empleados e ON rh.empleado_id = e.id
        WHERE e.documento = $1 
        AND rh.fecha_entrada = $2
        ORDER BY rh.hora_entrada DESC
        LIMIT 1
    `,
    
    createRegistro: `
        INSERT INTO registros_horas (empleado_id, sede_id, fecha_entrada, hora_entrada, estado)
        SELECT $1, $2, $3, $4, 'activo'
        WHERE NOT EXISTS (
            SELECT 1 FROM registros_horas 
            WHERE empleado_id = $1 
            AND estado = 'activo' 
            AND fecha_entrada = $3
        )
        RETURNING *
    `,
    
    finalizarRegistro: `
        UPDATE registros_horas 
        SET fecha_salida = $1, hora_salida = $2, estado = 'finalizado'
        WHERE id = $3
        RETURNING *
    `,
    
    forzarSalida: `
        UPDATE registros_horas 
        SET fecha_salida = $1, hora_salida = $2, estado = 'forzado'
        WHERE id = $3
        RETURNING *
    `,
    
    getEstadisticas: `
        SELECT 
            COUNT(*) as total_registros,
            COUNT(CASE WHEN estado = 'activo' THEN 1 END) as empleados_activos,
            COALESCE(SUM(duracion_horas), 0) as horas_totales,
            CASE 
                WHEN COUNT(*) > 0 THEN COALESCE(SUM(duracion_horas), 0) / COUNT(*)
                ELSE 0 
            END as promedio_horas
        FROM registros_horas 
        WHERE sede_id = $1 
        AND fecha_entrada = $2
    `,
    
    finalizarJornadaSede: `
        UPDATE registros_horas 
        SET fecha_salida = $1, hora_salida = $2, estado = 'forzado'
        WHERE sede_id = $3 
        AND estado = 'activo'
        RETURNING *
    `,
    
    // Nuevas consultas para funcionalidades adicionales
    getRegistrosPorFecha: `
        SELECT 
            rh.id,
            rh.empleado_id,
            e.documento,
            e.nombre as nombre_empleado,
            s.nombre as nombre_sede,
            rh.fecha_entrada,
            rh.hora_entrada,
            rh.fecha_salida,
            rh.hora_salida,
            rh.duracion_horas,
            rh.estado,
            rh.observaciones
        FROM registros_horas rh
        JOIN empleados e ON rh.empleado_id = e.id
        JOIN sedes s ON rh.sede_id = s.id
        WHERE rh.sede_id = $1 
        AND rh.fecha_entrada = $2
        ORDER BY rh.hora_entrada DESC
    `,
    
    getEstadisticasPorFecha: `
        SELECT 
            COUNT(*) as total_registros,
            COUNT(CASE WHEN estado = 'activo' THEN 1 END) as empleados_activos,
            COALESCE(SUM(duracion_horas), 0) as horas_totales,
            CASE 
                WHEN COUNT(*) > 0 THEN COALESCE(SUM(duracion_horas), 0) / COUNT(*)
                ELSE 0 
            END as promedio_horas
        FROM registros_horas 
        WHERE sede_id = $1 
        AND fecha_entrada = $2
    `,
    
    cerrarSesionesAutomaticas: `
        UPDATE registros_horas 
        SET fecha_salida = $1, hora_salida = $2, estado = 'automatico'
        WHERE sede_id = $3 
        AND estado = 'activo'
        AND hora_entrada < $2
        RETURNING *
    `,
    
    getSesionesActivas: `
        SELECT 
            rh.id,
            rh.empleado_id,
            e.documento,
            e.nombre as nombre_empleado,
            s.nombre as nombre_sede,
            rh.fecha_entrada,
            rh.hora_entrada
        FROM registros_horas rh
        JOIN empleados e ON rh.empleado_id = e.id
        JOIN sedes s ON rh.sede_id = s.id
        WHERE rh.sede_id = $1 
        AND rh.estado = 'activo'
        ORDER BY rh.hora_entrada ASC
    `
};

module.exports = {
    dbConfig,
    sedesConfig,
    queries
};
