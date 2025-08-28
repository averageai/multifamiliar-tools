const { 
  getComprasTodasLasSedes, 
  getProveedoresTodasLasSedes,
  generarJSONComprasSeleccionadas,
  validarParametros 
} = require('./api-compras-recientes');

// Función de prueba
async function testAPI() {
  try {
    console.log('🧪 Iniciando pruebas de la API de Compras Recientes...\n');
    
    // Test 1: Validación de parámetros
    console.log('📅 Test 1: Validación de parámetros');
    try {
      validarParametros(30, 100);
      console.log('✅ Parámetros válidos');
    } catch (error) {
      console.log('❌ Error en validación:', error.message);
    }
    
    // Test 2: Obtener proveedores
    console.log('\n🏢 Test 2: Obtener proveedores');
    const proveedores = await getProveedoresTodasLasSedes();
    
    console.log('📋 Proveedores encontrados:');
    Object.keys(proveedores).forEach(sede => {
      if (proveedores[sede].error) {
        console.log(`❌ ${sede}: ${proveedores[sede].error}`);
      } else {
        console.log(`✅ ${sede}: ${proveedores[sede].length} proveedores`);
        if (proveedores[sede].length > 0) {
          console.log(`   📍 Primer proveedor: ${proveedores[sede][0].nombre}`);
        }
      }
    });
    
    // Test 3: Obtener compras recientes (últimos 7 días)
    console.log('\n📊 Test 3: Obtener compras recientes (últimos 7 días)');
    const compras = await getComprasTodasLasSedes(7, null, 50);
    
    console.log('📋 Compras encontradas:');
    Object.keys(compras).forEach(sede => {
      if (compras[sede].error) {
        console.log(`❌ ${sede}: ${compras[sede].error}`);
      } else {
        console.log(`✅ ${sede}: ${compras[sede].length} compras`);
        if (compras[sede].length > 0) {
          const primeraCompra = compras[sede][0];
          console.log(`   📦 Primera compra: ${primeraCompra.nombre_proveedor} - ${primeraCompra.nombre_producto}`);
        }
      }
    });
    
    // Test 4: Generar JSON de compras seleccionadas
    console.log('\n📄 Test 4: Generar JSON de compras seleccionadas');
    
    // Tomar las primeras 3 compras de cada sede para la prueba
    const comprasSeleccionadas = [];
    Object.keys(compras).forEach(sede => {
      if (!compras[sede].error && compras[sede].length > 0) {
        comprasSeleccionadas.push(...compras[sede].slice(0, 3));
      }
    });
    
    if (comprasSeleccionadas.length > 0) {
      const jsonGenerado = generarJSONComprasSeleccionadas(comprasSeleccionadas);
      
      console.log('✅ JSON generado exitosamente:');
      console.log(JSON.stringify(jsonGenerado, null, 2));
      
      console.log('\n📈 Resumen del JSON generado:');
      console.log(`   Total items: ${jsonGenerado.total_items}`);
      console.log(`   Formato: ${jsonGenerado.data.length > 0 ? 'Correcto' : 'Vacío'}`);
      
      if (jsonGenerado.data.length > 0) {
        console.log('   📋 Muestra de datos:');
        jsonGenerado.data.slice(0, 3).forEach((item, index) => {
          console.log(`      ${index + 1}. ${item.proveedor} - ${item.producto} (${item.codigo_interno})`);
        });
      }
    } else {
      console.log('⚠️ No hay compras para generar JSON');
    }
    
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
