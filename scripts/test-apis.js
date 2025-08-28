const { Pool } = require('pg');

// Configuración de bases de datos
const dbConfigs = {
  manizales: {
    host: process.env.DB_HOST || '5.161.103.230',
    port: process.env.DB_PORT || 7717,
    database: process.env.DB_NAME_MANIZALES || 'crsitaleriamanizales_complete',
    user: process.env.DB_USER_MANIZALES || 'vercel_user',
    password: process.env.DB_PASSWORD_MANIZALES || 'non@ver@ge',
    ssl: {
      rejectUnauthorized: false
    },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  ladorada: {
    host: process.env.DB_HOST || '5.161.103.230',
    port: process.env.DB_PORT || 7717,
    database: process.env.DB_NAME_LADORADA || 'cristaleriaprod_complete',
    user: process.env.DB_USER_LADORADA || 'vercel_user',
    password: process.env.DB_PASSWORD_LADORADA || 'non@ver@ge',
    ssl: {
      rejectUnauthorized: false
    },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
};

// Función para crear conexión a la base de datos
async function createConnection(environment) {
  try {
    const config = dbConfigs[environment];
    const pool = new Pool(config);
    return pool;
  } catch (error) {
    console.error(`Error conectando a ${environment}:`, error);
    throw error;
  }
}

// Función para ejecutar consultas
async function executeQuery(environment, query, params = []) {
  let pool;
  try {
    pool = await createConnection(environment);
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error(`Error ejecutando query en ${environment}:`, error);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Función para probar la consulta corregida de compras recientes
async function testComprasRecientesCorregida(environment) {
  console.log(`\n🧪 PROBANDO CONSULTA CORREGIDA DE COMPRAS RECIENTES EN ${environment.toUpperCase()}`);
  console.log('=' .repeat(70));
  
  try {
    // Calcular fecha límite (últimos 30 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    
    const query = `
      SELECT 
        pp.id as compra_id,
        pp."productId",
        pp."purchaseId",
        p.internal_code,
        p.name as nombre_producto,
        pp.quantity,
        pp.unit_price,
        pur.created_at as fecha_compra,
        prov.name as nombre_proveedor,
        prov.id as provider_id
      FROM product_purchase pp
      JOIN purchase pur ON pp."purchaseId" = pur.id
      JOIN product p ON pp."productId" = p.id
      JOIN provider prov ON pur."providerId" = prov.id
      WHERE pur.deleted_at IS NULL
        AND pp.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND pur.created_at >= $1
      ORDER BY pur.created_at DESC
      LIMIT 5
    `;
    
    const result = await executeQuery(environment, query, [fechaLimite]);
    
    console.log(`✅ ÉXITO: ${result.length} registros encontrados`);
    
    if (result.length > 0) {
      console.log('📝 Primer registro:');
      console.log(JSON.stringify(result[0], null, 2));
      
      // Verificar que unit_price tiene valores válidos
      const preciosValidos = result.filter(r => r.unit_price !== null && r.unit_price > 0);
      console.log(`💰 Registros con precios válidos: ${preciosValidos.length}/${result.length}`);
      
      if (preciosValidos.length > 0) {
        console.log('📊 Ejemplo de precios:');
        preciosValidos.slice(0, 3).forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.nombre_producto}: $${r.unit_price} (${r.quantity} unidades)`);
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

// Función para probar la consulta de ventas del día
async function testVentasDia(environment) {
  console.log(`\n🧪 PROBANDO CONSULTA DE VENTAS DEL DÍA EN ${environment.toUpperCase()}`);
  console.log('=' .repeat(60));
  
  try {
    // Usar una fecha reciente para tener datos
    const fecha = '2025-08-28'; // Fecha de ejemplo con datos
    
    const query = `
      WITH ventas_del_dia AS (
        SELECT 
          ps."productId",
          p.internal_code,
          p.name as nombre_producto,
          s."headquarterId",
          h.name as nombre_headquarter,
          SUM(ps.quantity) as cantidad_total
        FROM product_sell ps
        JOIN sell s ON ps."sellId" = s.id
        JOIN product p ON ps."productId" = p.id
        JOIN headquarter h ON s."headquarterId" = h.id
        WHERE DATE(s.created_at) = $1
        AND s.deleted_at IS NULL
        AND ps.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND h.deleted_at IS NULL
        GROUP BY ps."productId", p.internal_code, p.name, s."headquarterId", h.name
      )
      SELECT 
        codigo,
        nombre,
        cantidad,
        headquarter
      FROM (
        SELECT 
          internal_code as codigo,
          nombre_producto as nombre,
          cantidad_total as cantidad,
          nombre_headquarter as headquarter
        FROM ventas_del_dia
        ORDER BY internal_code ASC, nombre_headquarter ASC
      ) as resultado
      LIMIT 5;
    `;
    
    const result = await executeQuery(environment, query, [fecha]);
    
    console.log(`✅ ÉXITO: ${result.length} registros encontrados para fecha ${fecha}`);
    
    if (result.length > 0) {
      console.log('📝 Primer registro:');
      console.log(JSON.stringify(result[0], null, 2));
    } else {
      console.log('⚠️  No se encontraron ventas para esta fecha, probando con fecha anterior...');
      
      // Probar con fecha anterior
      const fechaAnterior = '2025-08-27';
      const result2 = await executeQuery(environment, query, [fechaAnterior]);
      console.log(`📊 Ventas para ${fechaAnterior}: ${result2.length} registros`);
      
      if (result2.length > 0) {
        console.log('📝 Ejemplo de venta:');
        console.log(JSON.stringify(result2[0], null, 2));
      }
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

// Función para probar la consulta de proveedores
async function testProveedores(environment) {
  console.log(`\n🧪 PROBANDO CONSULTA DE PROVEEDORES EN ${environment.toUpperCase()}`);
  console.log('=' .repeat(60));
  
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        COUNT(DISTINCT pur.id) as total_facturas,
        MAX(pur.created_at) as ultima_compra,
        COUNT(DISTINCT pp."productId") as productos_comprados
      FROM provider p
      LEFT JOIN purchase pur ON p.id = pur."providerId" AND pur.deleted_at IS NULL
      LEFT JOIN product_purchase pp ON pur.id = pp."purchaseId" AND pp.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
      GROUP BY p.id, p.name
      HAVING COUNT(DISTINCT pur.id) > 0
      ORDER BY p.name ASC
      LIMIT 5;
    `;
    
    const result = await executeQuery(environment, query);
    
    console.log(`✅ ÉXITO: ${result.length} proveedores encontrados`);
    
    if (result.length > 0) {
      console.log('📝 Primer proveedor:');
      console.log(JSON.stringify(result[0], null, 2));
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

// Función principal
async function main() {
  console.log('🧪 SCRIPT DE PRUEBA DE APIs CORREGIDAS');
  console.log('=' .repeat(70));
  
  const environments = ['manizales', 'ladorada'];
  
  for (const environment of environments) {
    console.log(`\n🌐 PROBANDO EN ${environment.toUpperCase()}`);
    console.log('=' .repeat(40));
    
    try {
      // Probar conexión
      const testQuery = 'SELECT NOW() as current_time;';
      const result = await executeQuery(environment, testQuery);
      console.log(`✅ Conexión exitosa a ${environment}`);
      
      // Probar consultas corregidas
      await testComprasRecientesCorregida(environment);
      await testVentasDia(environment);
      await testProveedores(environment);
      
    } catch (error) {
      console.error(`❌ Error en ${environment}:`, error.message);
    }
  }
  
  console.log('\n🎯 RESUMEN DE PRUEBAS');
  console.log('=' .repeat(40));
  console.log('Este script ha probado:');
  console.log('✅ Conexión a ambas bases de datos');
  console.log('✅ Consulta corregida de compras recientes (usando unit_price)');
  console.log('✅ Consulta de ventas del día');
  console.log('✅ Consulta de proveedores');
  console.log('\n📋 Si todas las pruebas pasan, las APIs están listas para usar.');
}

// Ejecutar el script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testComprasRecientesCorregida,
  testVentasDia,
  testProveedores,
  executeQuery
};
