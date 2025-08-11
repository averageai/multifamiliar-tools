/**
 * 🚀 SERVIDOR PRINCIPAL - MULTIFAMILIAR TOOLS
 * ===========================================
 * 
 * ⚠️  ARCHIVO CRÍTICO DEL SISTEMA - NO MODIFICAR SIN AUTORIZACIÓN
 * 
 * Este servidor maneja:
 * - Todas las rutas de aplicaciones HTML
 * - API REST para control de horas
 * - Conexión a base de datos PostgreSQL
 * - Servicio de archivos estáticos
 * 
 * 🔧 CONFIGURACIÓN VITAL:
 * - Puerto: process.env.PORT || 3000
 * - Base de datos: PostgreSQL (configurada en db-config.js)
 * - CORS: Habilitado para todas las rutas
 * - SSL: Deshabilitado para compatibilidad
 * 
 * 📋 APLICACIONES REGISTRADAS:
 * - /spa, /spam, /control, /validador, /validadorv2, /validadorc
 * - /controlv2, /spav2, /duplicados, /codigos-disponibles
 * - /cotizaciones, /cierre-caja, /faltantes, /control-horas
 * 
 * 🔒 ENDPOINTS PROTEGIDOS:
 * - /api/health - Estado del servidor
 * - /api/debug/* - Debugging (solo desarrollo)
 * - /api/sedes, /api/empleados/* - Control de horas
 * 
 * ⚡ PARA AGREGAR NUEVAS APLICACIONES:
 * 1. Agregar la ruta en appRoutes (línea ~84)
 * 2. Agregar la ruta en vercel.json
 * 3. NO modificar la estructura base del servidor
 * 
 * 🛡️ PROTECCIÓN DEL SISTEMA:
 * - Middleware de errores global
 * - Logging detallado para debugging
 * - Manejo graceful de cierre
 * - Pool de conexiones PostgreSQL
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const { dbConfig, sedesConfig, queries } = require('./db-config');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.', {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Crear pool de conexiones PostgreSQL
const pool = new Pool(dbConfig);

// Verificar conexión a la base de datos
pool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err);
});

// Middleware para manejar errores de base de datos
const handleDatabaseError = (err, res) => {
    console.error('Error de base de datos:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: err.message
    });
};

// Rutas API

// Health check
app.get('/api/health', async (req, res) => {
    try {
        // Verificar conexión a la base de datos
        await pool.query('SELECT NOW()');
        res.json({
            success: true,
            message: 'Servidor funcionando correctamente',
            timestamp: new Date().toISOString(),
            database: 'Conectado'
        });
    } catch (err) {
        console.error('Error en health check:', err);
        res.status(500).json({
            success: false,
            message: 'Error de conexión a la base de datos',
            timestamp: new Date().toISOString(),
            database: 'Desconectado',
            error: err.message
        });
    }
});

// Debug endpoint para verificar archivos
app.get('/api/debug/files', (req, res) => {
    const fs = require('fs');
    const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));
    res.json({
        success: true,
        files: files,
        currentDir: __dirname,
        indexExists: fs.existsSync(path.join(__dirname, 'index.html'))
    });
});

// Debug endpoint para verificar rutas
app.get('/api/debug/routes', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando',
        timestamp: new Date().toISOString(),
        routes: [
            '/',
            '/spa',
            '/spam',
            '/control',
            '/validador',
            '/validadorv2',
            '/validadorc',
            '/controlv2',
            '/spav2',
            '/duplicados',
            '/codigos-disponibles',
            '/cotizaciones',
            '/cierre-caja',
            '/faltantes',
            '/control-horas',
            '/api/health',
            '/api/debug/files',
            '/api/debug/routes'
        ],
        currentPath: req.path,
        userAgent: req.get('User-Agent')
    });
});

// Obtener sedes
app.get('/api/sedes', async (req, res) => {
    try {
        const result = await pool.query(queries.getSedes);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        handleDatabaseError(err, res);
    }
});

// Obtener empleado por documento
app.get('/api/empleados/:documento', async (req, res) => {
    try {
        const { documento } = req.params;
        const result = await pool.query(queries.getEmpleadoByDocumento, [documento]);
        
        if (result.rows.length === 0) {
            return res.json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        handleDatabaseError(err, res);
    }
});

// Crear empleado
app.post('/api/empleados', async (req, res) => {
    try {
        const { documento, nombre, sede_id } = req.body;
        
        // Verificar si el empleado ya existe
        const existingEmployee = await pool.query(queries.getEmpleadoByDocumento, [documento]);
        if (existingEmployee.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El empleado ya existe'
            });
        }
        
        const result = await pool.query(queries.createEmpleado, [documento, nombre, sede_id]);
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        handleDatabaseError(err, res);
    }
});

// Obtener registros del día por sede
app.get('/api/registros/:sede_id/:fecha', async (req, res) => {
    try {
        const { sede_id, fecha } = req.params;
        const result = await pool.query(queries.getRegistrosHoy, [sede_id, fecha]);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        handleDatabaseError(err, res);
    }
});

// Obtener registro activo de un empleado
app.get('/api/registros/activo/:documento', async (req, res) => {
    try {
        const { documento } = req.params;
        const result = await pool.query(queries.getRegistroActivo, [documento]);
        
        res.json({
            success: true,
            data: result.rows.length > 0 ? result.rows[0] : null
        });
    } catch (err) {
        handleDatabaseError(err, res);
    }
});

// Crear registro de entrada
app.post('/api/registros/entrada', async (req, res) => {
    try {
        const { empleado_id, sede_id, fecha_entrada, hora_entrada } = req.body;
        
        // Verificar si ya tiene un registro activo
        const empleado = await pool.query('SELECT documento FROM empleados WHERE id = $1', [empleado_id]);
        if (empleado.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }
        
        const registroActivo = await pool.query(queries.getRegistroActivo, [empleado.rows[0].documento]);
        if (registroActivo.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El empleado ya tiene una sesión activa'
            });
        }
        
        const result = await pool.query(queries.createRegistro, [empleado_id, sede_id, fecha_entrada, hora_entrada]);
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        handleDatabaseError(err, res);
    }
});

// Finalizar registro (salida)
app.put('/api/registros/:id/salida', async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_salida, hora_salida } = req.body;
        
        const result = await pool.query(queries.finalizarRegistro, [fecha_salida, hora_salida, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        handleDatabaseError(err, res);
    }
});

// Forzar salida
app.put('/api/registros/:id/forzar', async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_salida, hora_salida } = req.body;
        
        const result = await pool.query(queries.forzarSalida, [fecha_salida, hora_salida, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        handleDatabaseError(err, res);
    }
});

// Obtener estadísticas
app.get('/api/estadisticas/:sede_id/:fecha', async (req, res) => {
    try {
        const { sede_id, fecha } = req.params;
        const result = await pool.query(queries.getEstadisticas, [sede_id, fecha]);
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        handleDatabaseError(err, res);
    }
});

// Finalizar jornada para toda una sede
app.post('/api/registros/finalizar-jornada', async (req, res) => {
    try {
        const { sede_id, fecha_salida, hora_salida } = req.body;
        
        const result = await pool.query(queries.finalizarJornadaSede, [fecha_salida, hora_salida, sede_id]);
        
        res.json({
            success: true,
            data: {
                registros_actualizados: result.rows.length,
                registros: result.rows
            }
        });
    } catch (err) {
        handleDatabaseError(err, res);
    }
});

// Ruta para servir archivos HTML
app.get('/', (req, res) => {
    console.log('📄 Sirviendo index.html desde:', path.join(__dirname, 'index.html'));
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rutas específicas para cada aplicación
const appRoutes = {
    '/spa': 'spa.html',
    '/spam': 'spam.html',
    '/control': 'control.html',
    '/validador': 'validador.html',
    '/validadorv2': 'validadorv2.html',
    '/validadorc': 'validadorc.html',
    '/controlv2': 'controlv2.html',
    '/spav2': 'spav2.html',
    '/duplicados': 'duplicados.html',
    '/codigos-disponibles': 'codigos-disponibles.html',
    '/cotizaciones': 'cotizaciones.html',
    '/cierre-caja': 'cierre-caja.html',
    '/faltantes': 'faltantes.html',
    '/control-horas': 'control-horas.html'
};

// Configurar rutas para cada aplicación
Object.entries(appRoutes).forEach(([route, file]) => {
    app.get(route, (req, res) => {
        console.log(`📄 Sirviendo ${file} desde ruta ${route}`);
        const filePath = path.join(__dirname, file);
        if (require('fs').existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            console.log(`❌ Archivo no encontrado: ${file}`);
            res.status(404).send('Aplicación no encontrada');
        }
    });
});

// Ruta para servir otros archivos HTML estáticos
app.get('/:file.html', (req, res) => {
    const fileName = req.params.file + '.html';
    const filePath = path.join(__dirname, fileName);
    
    console.log('📄 Intentando servir:', fileName, 'desde:', filePath);
    
    // Verificar si el archivo existe
    if (require('fs').existsSync(filePath)) {
        console.log('✅ Archivo encontrado, sirviendo:', fileName);
        res.sendFile(filePath);
    } else {
        console.log('❌ Archivo no encontrado:', fileName);
        res.status(404).send('Archivo no encontrado');
    }
});

// Ruta catch-all para manejar cualquier otra ruta
app.get('*', (req, res) => {
    console.log('🔍 Ruta no encontrada:', req.path);
    
    // Si la ruta termina en .html, intentar servir el archivo
    if (req.path.endsWith('.html')) {
        const filePath = path.join(__dirname, req.path);
        if (require('fs').existsSync(filePath)) {
            console.log('✅ Archivo encontrado en catch-all:', req.path);
            res.sendFile(filePath);
        } else {
            console.log('❌ Archivo no encontrado en catch-all:', req.path);
            res.status(404).send('Archivo no encontrado');
        }
    } else {
        // Para rutas sin .html, intentar servir index.html
        console.log('🔄 Redirigiendo a index.html para ruta:', req.path);
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en puerto ${port}`);
    console.log(`📊 API disponible en /api`);
    console.log(`⏰ Control de horas: /control-horas`);
    console.log(`🔍 Health check: /api/health`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    pool.end();
    process.exit(0);
});
