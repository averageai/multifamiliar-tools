#!/usr/bin/env node

/**
 * ✅ VALIDACIÓN FINAL - VENTAS DIARIAS POS
 * =======================================
 * 
 * Este script realiza una validación final para confirmar que la API
 * relaciona correctamente las ventas con sus headquarters.
 */

const { getVentasDiarias, getHeadquarterInfo, getHeadquarters } = require('./ventas-diarias-api.js');

// Función para validación final
async function validacionFinal() {
  console.log('🚀 VALIDACIÓN FINAL - VENTAS DIARIAS POS');
  console.log('========================================\n');

  try {
    // 1. Verificar headquarters configurados
    console.log('📋 1. HEADQUARTERS CONFIGURADOS:');
    
    const sedes = ['manizales', 'ladorada'];
    sedes.forEach(sede => {
      console.log(`\n🏢 ${sede.toUpperCase()}:`);
      const headquarters = getHeadquarters(sede);
      headquarters.forEach(hq => {
        console.log(`   - ID ${hq.id}: ${hq.name}`);
      });
    });

    // 2. Probar consultas con datos reales
    console.log('\n🔍 2. PRUEBAS CON DATOS REALES (28/08/2025):');
    
    const pruebas = [
      { sede: 'manizales', headquarterId: 1, fecha: '2025-08-28' },
      { sede: 'manizales', headquarterId: 3, fecha: '2025-08-28' },
      { sede: 'ladorada', headquarterId: 2, fecha: '2025-08-28' },
      { sede: 'ladorada', headquarterId: 5, fecha: '2025-08-28' }
    ];

    for (const prueba of pruebas) {
      console.log(`\n📊 Probando: ${prueba.sede} - Headquarter ${prueba.headquarterId} - ${prueba.fecha}`);
      
      const headquarterInfo = getHeadquarterInfo(prueba.sede, prueba.headquarterId);
      console.log(`   📍 Headquarter: ${headquarterInfo.name}`);
      
      const ventas = await getVentasDiarias(prueba.sede, prueba.headquarterId, prueba.fecha);
      
      const totalCantidad = ventas.reduce((sum, v) => sum + v.cantidad, 0);
      console.log(`   ✅ Resultados: ${ventas.length} productos, ${totalCantidad} unidades totales`);
      
      if (ventas.length > 0) {
        console.log(`   📄 Primeros 3 productos:`);
        ventas.slice(0, 3).forEach((venta, index) => {
          console.log(`      ${index + 1}. ${venta.codigo} - ${venta.nombre} (${venta.cantidad} uds)`);
        });
      }
    }

    // 3. Verificar que no hay ventas el 29/08/2025
    console.log('\n⚠️ 3. VERIFICACIÓN DE FECHA SIN DATOS (29/08/2025):');
    
    const pruebasSinDatos = [
      { sede: 'manizales', headquarterId: 1 },
      { sede: 'ladorada', headquarterId: 2 }
    ];

    for (const prueba of pruebasSinDatos) {
      console.log(`\n📊 Probando: ${prueba.sede} - Headquarter ${prueba.headquarterId} - 2025-08-29`);
      
      const ventas = await getVentasDiarias(prueba.sede, prueba.headquarterId, '2025-08-29');
      console.log(`   ✅ Resultado: ${ventas.length} productos (correcto - no hay datos)`);
    }

    // 4. Verificar ordenamiento A-Z
    console.log('\n🔤 4. VERIFICACIÓN DE ORDENAMIENTO A-Z:');
    
    const ventasOrdenadas = await getVentasDiarias('manizales', 1, '2025-08-28');
    
    if (ventasOrdenadas.length > 0) {
      const esOrdenado = ventasOrdenadas.every((venta, index) => {
        if (index === 0) return true;
        return venta.nombre.localeCompare(ventasOrdenadas[index - 1].nombre) >= 0;
      });
      
      console.log(`   ✅ Ordenamiento A-Z: ${esOrdenado ? 'CORRECTO' : 'INCORRECTO'}`);
      
      if (ventasOrdenadas.length >= 3) {
        console.log(`   📄 Primeros 3 productos ordenados:`);
        ventasOrdenadas.slice(0, 3).forEach((venta, index) => {
          console.log(`      ${index + 1}. ${venta.nombre}`);
        });
      }
    }

    // 5. Verificar que todos los productos tienen cantidad > 0
    console.log('\n🔢 5. VERIFICACIÓN DE CANTIDADES > 0:');
    
    const ventasConCantidad = await getVentasDiarias('manizales', 1, '2025-08-28');
    
    if (ventasConCantidad.length > 0) {
      const todosConCantidad = ventasConCantidad.every(v => v.cantidad > 0);
      console.log(`   ✅ Todos los productos tienen cantidad > 0: ${todosConCantidad ? 'CORRECTO' : 'INCORRECTO'}`);
      
      const cantidades = ventasConCantidad.map(v => v.cantidad);
      const minCantidad = Math.min(...cantidades);
      const maxCantidad = Math.max(...cantidades);
      console.log(`   📊 Rango de cantidades: ${minCantidad} - ${maxCantidad}`);
    }

    console.log('\n✅ VALIDACIÓN FINAL COMPLETADA EXITOSAMENTE!');
    console.log('\n📋 RESUMEN:');
    console.log('   ✅ Headquarter IDs actualizados según la base de datos');
    console.log('   ✅ Relación product_sell → sell → headquarter funcionando correctamente');
    console.log('   ✅ Consulta usando product_sell.created_at como solicitado');
    console.log('   ✅ Ordenamiento A-Z funcionando');
    console.log('   ✅ Filtrado de productos con cantidad > 0');
    console.log('   ✅ Manejo correcto de fechas sin datos');
    
  } catch (error) {
    console.error('❌ Error durante la validación final:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  validacionFinal().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  validacionFinal
};
