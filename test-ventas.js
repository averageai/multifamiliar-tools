const { getVentasTodasLasSedes, validarFecha } = require('./api-ventas-dia');

// Función de prueba
async function testAPI() {
  try {
    console.log('🧪 Iniciando pruebas de la API de Ventas por Día...\n');
    
    // Test 1: Validación de fecha
    console.log('📅 Test 1: Validación de fecha');
    try {
      const fechaValida = validarFecha('2024-12-26');
      console.log('✅ Fecha válida:', fechaValida);
    } catch (error) {
      console.log('❌ Error en validación de fecha:', error.message);
    }
    
    // Test 2: Fecha inválida
    console.log('\n📅 Test 2: Fecha inválida');
    try {
      validarFecha('fecha-invalida');
      console.log('❌ Debería haber fallado');
    } catch (error) {
      console.log('✅ Error capturado correctamente:', error.message);
    }
    
    // Test 3: Obtener ventas de hoy
    console.log('\n📊 Test 3: Obtener ventas de hoy');
    const hoy = new Date().toISOString().split('T')[0];
    console.log('Fecha de prueba:', hoy);
    
    const ventas = await getVentasTodasLasSedes(hoy);
    
    console.log('\n📋 Resultado de la API:');
    console.log(JSON.stringify(ventas, null, 2));
    
    // Análisis del resultado
    console.log('\n📈 Análisis del resultado:');
    
    Object.keys(ventas).forEach(sede => {
      if (ventas[sede].error) {
        console.log(`❌ ${sede}: ${ventas[sede].error}`);
      } else {
        const puntosVenta = Object.keys(ventas[sede]);
        console.log(`✅ ${sede}: ${puntosVenta.length} puntos de venta`);
        
        puntosVenta.forEach(puntoVenta => {
          const productos = ventas[sede][puntoVenta];
          console.log(`   📍 ${puntoVenta}: ${productos.length} productos`);
          
          if (productos.length > 0) {
            console.log(`   📦 Primer producto: ${productos[0].codigo} - ${productos[0].nombre} (${productos[0].cantidad})`);
          }
        });
      }
    });
    
    console.log('\n🎉 Pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
