#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE PRUEBA - API DE VENTAS DIARIAS
 * ===========================================
 * 
 * Este script prueba la funcionalidad de la API de ventas diarias
 * sin necesidad de iniciar el servidor completo.
 */

const { getVentasDiarias, getHeadquarterInfo, getHeadquarters } = require('./ventas-diarias-api.js');

// Función para obtener fecha actual en horario colombiano
function getFechaColombiana() {
    const ahora = new Date();
    // Ajustar a zona horaria colombiana (UTC-5)
    const offsetColombia = -5 * 60; // -5 horas en minutos
    const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
    const fechaColombia = new Date(utc + (offsetColombia * 60000));
    return fechaColombia.toISOString().split('T')[0];
}

// Función para probar la consulta de ventas
async function testVentasDiarias() {
    console.log('🧪 Iniciando pruebas de la API de Ventas Diarias...\n');

    // Configuración de prueba
    const sede = 'manizales';
    const headquarterId = 3; // MI HOGAR
    const fecha = getFechaColombiana(); // Fecha actual en horario colombiano

    try {
        console.log(`📊 Probando consulta de ventas:`);
        console.log(`   Sede: ${sede}`);
        console.log(`   Headquarter ID: ${headquarterId}`);
        console.log(`   Fecha: ${fecha}\n`);

        // Obtener información del headquarter
        const headquarterInfo = getHeadquarterInfo(sede, headquarterId);
        console.log(`🏪 Headquarter: ${headquarterInfo.name}\n`);

        // Consultar ventas
        const ventas = await getVentasDiarias(sede, headquarterId, fecha);

        console.log(`✅ Consulta exitosa!`);
        console.log(`📋 Resultados:`);
        console.log(`   - Total de productos: ${ventas.length}`);
        
        const totalCantidad = ventas.reduce((sum, v) => sum + v.cantidad, 0);
        console.log(`   - Total de unidades: ${totalCantidad}`);

        if (ventas.length > 0) {
            console.log(`\n📄 Primeros 5 productos:`);
            ventas.slice(0, 5).forEach((venta, index) => {
                console.log(`   ${index + 1}. ${venta.codigo} - ${venta.nombre} (${venta.cantidad} uds)`);
            });

            if (ventas.length > 5) {
                console.log(`   ... y ${ventas.length - 5} productos más`);
            }
        } else {
            console.log(`\n⚠️ No se encontraron ventas para la fecha especificada`);
        }

        // Verificar ordenamiento (A-Z)
        const isOrdered = ventas.every((venta, index) => {
            if (index === 0) return true;
            return venta.nombre.localeCompare(ventas[index - 1].nombre) >= 0;
        });

        console.log(`\n🔍 Verificaciones:`);
        console.log(`   - Ordenamiento A-Z: ${isOrdered ? '✅ Correcto' : '❌ Incorrecto'}`);
        console.log(`   - Productos con cantidad > 0: ${ventas.every(v => v.cantidad > 0) ? '✅ Correcto' : '❌ Incorrecto'}`);

    } catch (error) {
        console.error('❌ Error durante la prueba:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Función para probar diferentes configuraciones
async function testMultipleConfigurations() {
    console.log('\n🔄 Probando múltiples configuraciones...\n');

    // Obtener fechas en horario colombiano
    const fechaHoy = getFechaColombiana();
    const fechaAyer = new Date(new Date(fechaHoy).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const configs = [
        { sede: 'manizales', headquarterId: 3, fecha: fechaHoy },
        { sede: 'ladorada', headquarterId: 6, fecha: fechaHoy },
        { sede: 'manizales', headquarterId: 1, fecha: fechaAyer }
    ];

    for (const config of configs) {
        try {
            console.log(`📊 Probando: ${config.sede} - Headquarter ${config.headquarterId} - ${config.fecha}`);
            
            const headquarterInfo = getHeadquarterInfo(config.sede, config.headquarterId);
            const ventas = await getVentasDiarias(config.sede, config.headquarterId, config.fecha);
            
            console.log(`   ✅ ${ventas.length} productos encontrados`);
            console.log(`   📍 ${headquarterInfo.name}`);
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        console.log('');
    }
}

// Función para probar headquarters disponibles
function testHeadquarters() {
    console.log('🏢 Probando headquarters disponibles...\n');

    const sedes = ['manizales', 'ladorada'];

    sedes.forEach(sede => {
        const headquarters = getHeadquarters(sede);
        console.log(`📋 ${sede.toUpperCase()}:`);
        headquarters.forEach(hq => {
            console.log(`   - ID ${hq.id}: ${hq.name}`);
        });
        console.log('');
    });
}

// Función principal
async function main() {
    console.log('🚀 SCRIPT DE PRUEBA - API DE VENTAS DIARIAS');
    console.log('===========================================\n');

    // Probar headquarters
    testHeadquarters();

    // Probar consulta principal
    await testVentasDiarias();

    // Probar múltiples configuraciones
    await testMultipleConfigurations();

    console.log('✅ Pruebas completadas!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

module.exports = {
    testVentasDiarias,
    testMultipleConfigurations,
    testHeadquarters
};
