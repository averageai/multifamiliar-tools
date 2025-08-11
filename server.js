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
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/control-horas', (req, res) => {
    res.sendFile(path.join(__dirname, 'control-horas.html'));
});

// Ruta para servir otros archivos HTML estáticos
app.get('/:file.html', (req, res) => {
    const fileName = req.params.file + '.html';
    const filePath = path.join(__dirname, fileName);
    
    // Verificar si el archivo existe
    if (require('fs').existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Archivo no encontrado');
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
