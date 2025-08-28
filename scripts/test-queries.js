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

// Función para probar consulta de compras recientes
async function testComprasRecientes(environment) {
  console.log(`\n🧪 PROBANDO CONSULTA DE COMPRAS RECIENTES EN ${environment.toUpperCase()}`);
  console.log('=' .repeat(60));
  
  const queries = [
    {
      name: 'Consulta original con pp.cost',
      query: `
        SELECT 
          p.name as proveedor,
          p.id as provider_id,
          pur.id as purchase_id,
          pur.created_at,
          pp."productId",
          pr.internal_code,
          pr.name as nombre_producto,
          pp.quantity,
          pp.cost
        FROM provider p
        JOIN purchase pur ON p.id = pur."providerId" AND pur.deleted_at IS NULL
        JOIN product_purchase pp ON pur.id = pp."purchaseId" AND pp.deleted_at IS NULL
        JOIN product pr ON pp."productId" = pr.id AND pr.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
        AND pur.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY pur.created_at DESC
        LIMIT 10;
      `
    },
    {
      name: 'Consulta alternativa con pp.price',
      query: `
        SELECT 
          p.name as proveedor,
          p.id as provider_id,
          pur.id as purchase_id,
          pur.created_at,
          pp."productId",
          pr.internal_code,
          pr.name as nombre_producto,
          pp.quantity,
          pp.price
        FROM provider p
        JOIN purchase pur ON p.id = pur."providerId" AND pur.deleted_at IS NULL
        JOIN product_purchase pp ON pur.id = pp."purchaseId" AND pp.deleted_at IS NULL
        JOIN product pr ON pp."productId" = pr.id AND pr.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
        AND pur.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY pur.created_at DESC
        LIMIT 10;
      `
    },
    {
      name: 'Consulta alternativa con pp.unit_price',
      query: `
        SELECT 
          p.name as proveedor,
          p.id as provider_id,
          pur.id as purchase_id,
          pur.created_at,
          pp."productId",
          pr.internal_code,
          pr.name as nombre_producto,
          pp.quantity,
          pp.unit_price
        FROM provider p
        JOIN purchase pur ON p.id = pur."providerId" AND pur.deleted_at IS NULL
        JOIN product_purchase pp ON pur.id = pp."purchaseId" AND pp.deleted_at IS NULL
        JOIN product pr ON pp."productId" = pr.id AND pr.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
        AND pur.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY pur.created_at DESC
        LIMIT 10;
      `
    },
    {
      name: 'Consulta sin columna de precio',
      query: `
        SELECT 
          p.name as proveedor,
          p.id as provider_id,
          pur.id as purchase_id,
          pur.created_at,
          pp."productId",
          pr.internal_code,
          pr.name as nombre_producto,
          pp.quantity
        FROM provider p
        JOIN purchase pur ON p.id = pur."providerId" AND pur.deleted_at IS NULL
        JOIN product_purchase pp ON pur.id = pp."purchaseId" AND pp.deleted_at IS NULL
        JOIN product pr ON pp."productId" = pr.id AND pr.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
        AND pur.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY pur.created_at DESC
        LIMIT 10;
      `
    }
  ];
  
  for (const queryTest of queries) {
    console.log(`\n📋 ${queryTest.name}`);
    console.log('-'.repeat(40));
    
    try {
      const result = await executeQuery(environment, queryTest.query);
      console.log(`✅ ÉXITO: ${result.length} registros encontrados`);
      
      if (result.length > 0) {
        console.log('📝 Primer registro:');
        console.log(JSON.stringify(result[0], null, 2));
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      
      // Si es un error de columna no encontrada, sugerir alternativas
      if (error.message.includes('does not exist')) {
        console.log('💡 SUGERENCIA: La columna no existe, prueba con una alternativa');
      }
    }
  }
}

// Función para probar consulta de ventas del día
async function testVentasDia(environment) {
  console.log(`\n🧪 PROBANDO CONSULTA DE VENTAS DEL DÍA EN ${environment.toUpperCase()}`);
  console.log('=' .repeat(60));
  
  const fecha = '2024-01-15'; // Fecha de ejemplo
  
  const queries = [
    {
      name: 'Consulta original de ventas',
      query: `
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
        ) as resultado;
      `,
      params: [fecha]
    }
  ];
  
  for (const queryTest of queries) {
    console.log(`\n📋 ${queryTest.name}`);
    console.log('-'.repeat(40));
    
    try {
      const result = await executeQuery(environment, queryTest.query, queryTest.params);
      console.log(`✅ ÉXITO: ${result.length} registros encontrados para fecha ${fecha}`);
      
      if (result.length > 0) {
        console.log('📝 Primer registro:');
        console.log(JSON.stringify(result[0], null, 2));
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
}

// Función para explorar columnas de product_purchase
async function exploreProductPurchaseColumns(environment) {
  console.log(`\n🔍 EXPLORANDO COLUMNAS DE PRODUCT_PURCHASE EN ${environment.toUpperCase()}`);
  console.log('=' .repeat(60));
  
  try {
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'product_purchase'
      ORDER BY ordinal_position;
    `;
    
    const columns = await executeQuery(environment, columnsQuery);
    console.log(`📋 Columnas encontradas en product_purchase (${columns.length}):`);
    
    columns.forEach((column, index) => {
      console.log(`  ${index + 1}. ${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Buscar columnas relacionadas con precio
    const priceColumns = columns.filter(col => 
      col.column_name.toLowerCase().includes('price') || 
      col.column_name.toLowerCase().includes('cost') ||
      col.column_name.toLowerCase().includes('value')
    );
    
    if (priceColumns.length > 0) {
      console.log(`\n💰 Columnas relacionadas con precio:`);
      priceColumns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log(`\n⚠️  No se encontraron columnas relacionadas con precio`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

// Función principal
async function main() {
  console.log('🧪 SCRIPT DE PRUEBA DE CONSULTAS');
  console.log('=' .repeat(60));
  
  const environments = ['manizales', 'ladorada'];
  
  for (const environment of environments) {
    console.log(`\n🌐 PROBANDO EN ${environment.toUpperCase()}`);
    console.log('=' .repeat(40));
    
    try {
      // Probar conexión
      const testQuery = 'SELECT NOW() as current_time;';
      const result = await executeQuery(environment, testQuery);
      console.log(`✅ Conexión exitosa a ${environment}`);
      
      // Explorar columnas de product_purchase
      await exploreProductPurchaseColumns(environment);
      
      // Probar consultas de compras
      await testComprasRecientes(environment);
      
      // Probar consultas de ventas
      await testVentasDia(environment);
      
    } catch (error) {
      console.error(`❌ Error en ${environment}:`, error.message);
    }
  }
  
  console.log('\n🎯 RESUMEN DE PRUEBAS');
  console.log('=' .repeat(40));
  console.log('Este script ha probado:');
  console.log('✅ Conexión a ambas bases de datos');
  console.log('✅ Estructura de product_purchase');
  console.log('✅ Consultas de compras con diferentes columnas de precio');
  console.log('✅ Consultas de ventas del día');
  console.log('\n📋 Revisa los resultados arriba para identificar la columna correcta.');
}

// Ejecutar el script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testComprasRecientes,
  testVentasDia,
  exploreProductPurchaseColumns,
  executeQuery
};
