/**
 * 🕙 SCRIPT DE CIERRE AUTOMÁTICO DE SESIONES
 * ==========================================
 * 
 * Este script se ejecuta automáticamente para cerrar todas las sesiones activas
 * a las 10:00 PM (22:00) en timezone de América.
 * 
 * Funcionalidades:
 * - Verificación automática cada minuto
 * - Cierre de sesiones a las 10:00 PM exactas
 * - Logging detallado de operaciones
 * - Manejo de errores robusto
 * 
 * Configuración:
 * - Hora de cierre: 22:00 (10:00 PM)
 * - Intervalo de verificación: 1 minuto
 * - Timezone: América (automático)
 */

const fetch = require('node-fetch');

// Configuración
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const SEDES = [1, 2]; // Manizales y Dorada
const HORA_CIERRE = 22; // 10:00 PM
const MINUTO_CIERRE = 0;

// Función para obtener fecha y hora actual en formato correcto
function obtenerFechaHoraActual() {
    const ahora = new Date();
    return {
        fecha: ahora.toISOString().split('T')[0],
        hora: ahora.toTimeString().split(' ')[0]
    };
}

// Función para cerrar sesiones de una sede específica
async function cerrarSesionesSede(sedeId) {
    try {
        const { fecha, hora } = obtenerFechaHoraActual();
        
        console.log(`🕙 [${new Date().toISOString()}] Cerrando sesiones para sede ${sedeId} - Fecha: ${fecha}, Hora: ${hora}`);
        
        const response = await fetch(`${API_BASE}/registros/cerrar-sesiones-automaticas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sede_id: sedeId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error desconocido');
        }

        const { registros_cerrados } = result.data;
        
        if (registros_cerrados > 0) {
            console.log(`✅ [${new Date().toISOString()}] ${registros_cerrados} sesiones cerradas en sede ${sedeId}`);
        } else {
            console.log(`📝 [${new Date().toISOString()}] No hay sesiones activas en sede ${sedeId}`);
        }

        return result.data;

    } catch (error) {
        console.error(`❌ [${new Date().toISOString()}] Error cerrando sesiones en sede ${sedeId}:`, error.message);
        return null;
    }
}

// Función principal para verificar y cerrar sesiones
async function verificarYCerrarSesiones() {
    const ahora = new Date();
    const hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    
    // Verificar si es exactamente las 10:00 PM
    if (hora === HORA_CIERRE && minutos === MINUTO_CIERRE) {
        console.log(`🕙 [${ahora.toISOString()}] Ejecutando cierre automático de sesiones a las ${HORA_CIERRE}:${MINUTO_CIERRE.toString().padStart(2, '0')}`);
        
        // Cerrar sesiones en todas las sedes
        const resultados = [];
        for (const sedeId of SEDES) {
            const resultado = await cerrarSesionesSede(sedeId);
            resultados.push({ sedeId, resultado });
        }
        
        // Resumen final
        const totalCerradas = resultados.reduce((total, { resultado }) => {
            return total + (resultado ? resultado.registros_cerrados : 0);
        }, 0);
        
        console.log(`📊 [${ahora.toISOString()}] Resumen: ${totalCerradas} sesiones cerradas en total`);
        
    } else {
        // Log de verificación (solo cada 10 minutos para no saturar)
        if (minutos % 10 === 0) {
            console.log(`⏰ [${ahora.toISOString()}] Verificando... Esperando ${HORA_CIERRE}:${MINUTO_CIERRE.toString().padStart(2, '0')} (actual: ${hora}:${minutos.toString().padStart(2, '0')})`);
        }
    }
}

// Función para manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error(`💥 [${new Date().toISOString()}] Error no capturado:`, error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`💥 [${new Date().toISOString()}] Promesa rechazada no manejada:`, reason);
});

// Función para manejar cierre graceful
process.on('SIGINT', () => {
    console.log(`\n🛑 [${new Date().toISOString()}] Cerrando script de cierre automático...`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`\n🛑 [${new Date().toISOString()}] Cerrando script de cierre automático...`);
    process.exit(0);
});

// Inicialización
console.log(`🚀 [${new Date().toISOString()}] Script de cierre automático iniciado`);
console.log(`⏰ [${new Date().toISOString()}] Configurado para cerrar sesiones a las ${HORA_CIERRE}:${MINUTO_CIERRE.toString().padStart(2, '0')}`);
console.log(`🏢 [${new Date().toISOString()}] Sedes configuradas: ${SEDES.join(', ')}`);
console.log(`🔄 [${new Date().toISOString()}] Verificando cada minuto...`);

// Ejecutar verificación inicial
verificarYCerrarSesiones();

// Configurar verificación automática cada minuto
setInterval(verificarYCerrarSesiones, 60000); // 60000 ms = 1 minuto
