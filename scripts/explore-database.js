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

// Función para explorar tablas
async function exploreTables(environment) {
  console.log(`\n🔍 EXPLORANDO TABLAS EN ${environment.toUpperCase()}`);
  console.log('=' .repeat(50));
  
  try {
    // Obtener lista de tablas
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tables = await executeQuery(environment, tablesQuery);
    console.log(`📋 Tablas encontradas (${tables.length}):`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    return tables;
  } catch (error) {
    console.error(`❌ Error explorando tablas en ${environment}:`, error);
    return [];
  }
}

// Función para explorar estructura de una tabla específica
async function exploreTableStructure(environment, tableName) {
  console.log(`\n📊 ESTRUCTURA DE LA TABLA: ${tableName.toUpperCase()}`);
  console.log('-'.repeat(40));
  
  try {
    // Obtener columnas de la tabla
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position;
    `;
    
    const columns = await executeQuery(environment, columnsQuery, [tableName]);
    console.log(`Columnas (${columns.length}):`);
    columns.forEach((column, index) => {
      console.log(`  ${index + 1}. ${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Obtener algunos registros de ejemplo
    const sampleQuery = `SELECT * FROM "${tableName}" LIMIT 3;`;
    try {
      const sample = await executeQuery(environment, sampleQuery);
      console.log(`\n📝 Registros de ejemplo (${sample.length}):`);
      sample.forEach((row, index) => {
        console.log(`  Registro ${index + 1}:`, JSON.stringify(row, null, 2));
      });
    } catch (error) {
      console.log(`⚠️  No se pudieron obtener registros de ejemplo: ${error.message}`);
    }
    
    return columns;
  } catch (error) {
    console.error(`❌ Error explorando estructura de ${tableName}:`, error);
    return [];
  }
}

// Función para validar tablas específicas relacionadas con compras
async function validatePurchaseTables(environment) {
  console.log(`\n🔍 VALIDANDO TABLAS DE COMPRAS EN ${environment.toUpperCase()}`);
  console.log('=' .repeat(50));
  
  const purchaseTables = ['purchase', 'product_purchase', 'provider', 'product'];
  
  for (const tableName of purchaseTables) {
    try {
      const columns = await exploreTableStructure(environment, tableName);
      
      // Verificar si la tabla existe
      if (columns.length === 0) {
        console.log(`❌ La tabla ${tableName} NO EXISTE en ${environment}`);
        continue;
      }
      
      console.log(`✅ La tabla ${tableName} existe con ${columns.length} columnas`);
      
      // Verificar columnas específicas según la tabla
      switch (tableName) {
        case 'product_purchase':
          const costColumn = columns.find(col => col.column_name === 'cost');
          const priceColumn = columns.find(col => col.column_name === 'price');
          const unitPriceColumn = columns.find(col => col.column_name === 'unit_price');
          
          console.log(`  - Columna 'cost': ${costColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          console.log(`  - Columna 'price': ${priceColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          console.log(`  - Columna 'unit_price': ${unitPriceColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          break;
          
        case 'purchase':
          const providerIdColumn = columns.find(col => col.column_name === 'providerId');
          const createdAtColumn = columns.find(col => col.column_name === 'created_at');
          
          console.log(`  - Columna 'providerId': ${providerIdColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          console.log(`  - Columna 'created_at': ${createdAtColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          break;
          
        case 'provider':
          const nameColumn = columns.find(col => col.column_name === 'name');
          console.log(`  - Columna 'name': ${nameColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          break;
          
        case 'product':
          const internalCodeColumn = columns.find(col => col.column_name === 'internal_code');
          const nameColumn2 = columns.find(col => col.column_name === 'name');
          
          console.log(`  - Columna 'internal_code': ${internalCodeColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          console.log(`  - Columna 'name': ${nameColumn2 ? '✅ Existe' : '❌ NO EXISTE'}`);
          break;
      }
      
    } catch (error) {
      console.error(`❌ Error validando tabla ${tableName}:`, error.message);
    }
  }
}

// Función para validar tablas específicas relacionadas con ventas
async function validateSalesTables(environment) {
  console.log(`\n🔍 VALIDANDO TABLAS DE VENTAS EN ${environment.toUpperCase()}`);
  console.log('=' .repeat(50));
  
  const salesTables = ['sell', 'product_sell', 'headquarter', 'product'];
  
  for (const tableName of salesTables) {
    try {
      const columns = await exploreTableStructure(environment, tableName);
      
      // Verificar si la tabla existe
      if (columns.length === 0) {
        console.log(`❌ La tabla ${tableName} NO EXISTE en ${environment}`);
        continue;
      }
      
      console.log(`✅ La tabla ${tableName} existe con ${columns.length} columnas`);
      
      // Verificar columnas específicas según la tabla
      switch (tableName) {
        case 'product_sell':
          const quantityColumn = columns.find(col => col.column_name === 'quantity');
          const productIdColumn = columns.find(col => col.column_name === 'productId');
          const sellIdColumn = columns.find(col => col.column_name === 'sellId');
          
          console.log(`  - Columna 'quantity': ${quantityColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          console.log(`  - Columna 'productId': ${productIdColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          console.log(`  - Columna 'sellId': ${sellIdColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          break;
          
        case 'sell':
          const headquarterIdColumn = columns.find(col => col.column_name === 'headquarterId');
          const createdAtColumn = columns.find(col => col.column_name === 'created_at');
          
          console.log(`  - Columna 'headquarterId': ${headquarterIdColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          console.log(`  - Columna 'created_at': ${createdAtColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          break;
          
        case 'headquarter':
          const nameColumn = columns.find(col => col.column_name === 'name');
          console.log(`  - Columna 'name': ${nameColumn ? '✅ Existe' : '❌ NO EXISTE'}`);
          break;
      }
      
    } catch (error) {
      console.error(`❌ Error validando tabla ${tableName}:`, error.message);
    }
  }
}

// Función principal
async function main() {
  console.log('🚀 SCRIPT DE EXPLORACIÓN DE BASES DE DATOS');
  console.log('=' .repeat(60));
  
  const environments = ['manizales', 'ladorada'];
  
  for (const environment of environments) {
    console.log(`\n🌐 CONECTANDO A ${environment.toUpperCase()}`);
    console.log('=' .repeat(40));
    
    try {
      // Probar conexión
      const testQuery = 'SELECT NOW() as current_time;';
      const result = await executeQuery(environment, testQuery);
      console.log(`✅ Conexión exitosa a ${environment}`);
      console.log(`⏰ Hora del servidor: ${result[0].current_time}`);
      
      // Explorar todas las tablas
      await exploreTables(environment);
      
      // Validar tablas específicas
      await validatePurchaseTables(environment);
      await validateSalesTables(environment);
      
    } catch (error) {
      console.error(`❌ Error conectando a ${environment}:`, error.message);
    }
  }
  
  console.log('\n🎯 RESUMEN DE VALIDACIÓN');
  console.log('=' .repeat(40));
  console.log('Este script ha validado:');
  console.log('✅ Conexión a ambas bases de datos');
  console.log('✅ Existencia de tablas principales');
  console.log('✅ Estructura de columnas críticas');
  console.log('✅ Registros de ejemplo');
  console.log('\n📋 Revisa los resultados arriba para identificar problemas.');
}

// Ejecutar el script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  exploreTables,
  exploreTableStructure,
  validatePurchaseTables,
  validateSalesTables,
  executeQuery
};
