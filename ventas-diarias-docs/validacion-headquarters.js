#!/usr/bin/env node

/**
 * 🔍 VALIDACIÓN DE HEADQUARTERS - VENTAS DIARIAS
 * ==============================================
 * 
 * Este script valida que la API relacione correctamente las ventas con sus headquarters
 * comparando con la consulta directa: public.product_sell id → public.sell headquarterId → public.headquarter
 */

const { Pool } = require('pg');

// Configuración de bases de datos
const dbConfigs = {
  manizales: {
    host: '5.161.103.230',
    port: 7717,
    database: 'crsitaleriamanizales_complete',
    user: 'vercel_user',
    password: 'non@ver@ge',
    ssl: { rejectUnauthorized: false }
  },
  ladorada: {
    host: '5.161.103.230',
    port: 7717,
    database: 'cristaleriaprod_complete',
    user: 'vercel_user',
    password: 'non@ver@ge',
    ssl: { rejectUnauthorized: false }
  }
};

// Función para crear conexión
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
async function executeQuery(pool, query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error(`Error ejecutando query:`, error);
    throw error;
  }
}

// Función para validar la relación de headquarters
async function validarHeadquarters(sede) {
  console.log(`\n🔍 VALIDACIÓN DE HEADQUARTERS - ${sede.toUpperCase()}`);
  console.log('=' .repeat(60));
  
  const pool = await createConnection(sede);
  
  try {
    // 1. Verificar estructura de la tabla headquarter
    console.log('\n📋 1. ESTRUCTURA DE LA TABLA HEADQUARTER:');
    const estructuraHeadquarterQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'headquarter' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const estructuraHeadquarter = await executeQuery(pool, estructuraHeadquarterQuery);
    estructuraHeadquarter.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // 2. Listar todos los headquarters disponibles
    console.log('\n🏢 2. HEADQUARTERS DISPONIBLES:');
    const headquartersQuery = `
      SELECT id, name, created_at
      FROM headquarter
      WHERE deleted_at IS NULL
      ORDER BY id;
    `;
    
    const headquarters = await executeQuery(pool, headquartersQuery);
    headquarters.forEach(hq => {
      console.log(`   - ID ${hq.id}: ${hq.name} (creado: ${hq.created_at})`);
    });

    // 3. Verificar la relación product_sell → sell → headquarter
    console.log('\n🔗 3. VALIDACIÓN DE RELACIÓN PRODUCT_SELL → SELL → HEADQUARTER:');
    const relacionQuery = `
      SELECT 
        ps.id as product_sell_id,
        ps."sellId" as sell_id,
        s."headquarterId" as headquarter_id,
        h.name as headquarter_name,
        ps."created_at" as product_sell_date,
        s."created_at" as sell_date
      FROM product_sell ps
      JOIN sell s ON ps."sellId" = s.id
      JOIN headquarter h ON s."headquarterId" = h.id
      WHERE ps.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND h.deleted_at IS NULL
        AND DATE(ps."created_at") = '2025-08-28'
      ORDER BY ps.id
      LIMIT 10;
    `;
    
    const relaciones = await executeQuery(pool, relacionQuery);
    console.log(`   📊 Encontradas ${relaciones.length} relaciones para el 28/08/2025:`);
    relaciones.forEach(rel => {
      console.log(`   - ProductSell ID ${rel.product_sell_id} → Sell ID ${rel.sell_id} → Headquarter ID ${rel.headquarter_id} (${rel.headquarter_name})`);
    });

    // 4. Comparar con la consulta de la API
    console.log('\n🔍 4. COMPARACIÓN CON CONSULTA DE LA API:');
    
    // Consulta de la API actual
    const apiQuery = `
      SELECT 
        p.internal_code as codigo,
        p.name as nombre,
        SUM(ps.quantity) as cantidad,
        s."headquarterId" as headquarter_id,
        h.name as headquarter_name
      FROM product_sell ps
      JOIN sell s ON ps."sellId" = s.id
      JOIN product p ON ps."productId" = p.id
      JOIN headquarter h ON s."headquarterId" = h.id
      WHERE s."headquarterId" = 1
        AND s.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND ps.deleted_at IS NULL
        AND h.deleted_at IS NULL
        AND DATE(ps.created_at) = '2025-08-28'
      GROUP BY p.id, p.internal_code, p.name, s."headquarterId", h.name
      HAVING SUM(ps.quantity) > 0
      ORDER BY p.name ASC
      LIMIT 5;
    `;
    
    const apiResults = await executeQuery(pool, apiQuery);
    console.log(`   📊 Resultados de la API (Headquarter ID 1):`);
    apiResults.forEach(result => {
      console.log(`   - ${result.codigo} | ${result.nombre} | ${result.cantidad} | Headquarter: ${result.headquarter_id} (${result.headquarter_name})`);
    });

    // 5. Verificar si hay productos sin relación correcta
    console.log('\n⚠️ 5. VERIFICACIÓN DE PRODUCTOS SIN RELACIÓN:');
    const productosSinRelacionQuery = `
      SELECT 
        ps.id as product_sell_id,
        ps."sellId" as sell_id,
        s."headquarterId" as headquarter_id,
        CASE 
          WHEN h.id IS NULL THEN 'HEADQUARTER NO ENCONTRADO'
          ELSE h.name
        END as headquarter_status
      FROM product_sell ps
      JOIN sell s ON ps."sellId" = s.id
      LEFT JOIN headquarter h ON s."headquarterId" = h.id AND h.deleted_at IS NULL
      WHERE ps.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND DATE(ps."created_at") = '2025-08-28'
        AND (h.id IS NULL OR h.deleted_at IS NOT NULL)
      LIMIT 5;
    `;
    
    const productosSinRelacion = await executeQuery(pool, productosSinRelacionQuery);
    if (productosSinRelacion.length > 0) {
      console.log(`   ⚠️ Encontrados ${productosSinRelacion.length} productos con problemas de relación:`);
      productosSinRelacion.forEach(prod => {
        console.log(`   - ProductSell ID ${prod.product_sell_id} → Sell ID ${prod.sell_id} → Headquarter ID ${prod.headquarter_id} → ${prod.headquarter_status}`);
      });
    } else {
      console.log('   ✅ Todos los productos tienen relación correcta con headquarters');
    }

    // 6. Verificar ventas por headquarter
    console.log('\n📊 6. VENTAS POR HEADQUARTER (28/08/2025):');
    const ventasPorHeadquarterQuery = `
      SELECT 
        h.id as headquarter_id,
        h.name as headquarter_name,
        COUNT(DISTINCT s.id) as total_ventas,
        COUNT(ps.id) as total_productos_vendidos,
        SUM(ps.quantity) as total_cantidad
      FROM headquarter h
      LEFT JOIN sell s ON h.id = s."headquarterId" AND s.deleted_at IS NULL
      LEFT JOIN product_sell ps ON s.id = ps."sellId" AND ps.deleted_at IS NULL AND DATE(ps."created_at") = '2025-08-28'
      WHERE h.deleted_at IS NULL
      GROUP BY h.id, h.name
      ORDER BY h.id;
    `;
    
    const ventasPorHeadquarter = await executeQuery(pool, ventasPorHeadquarterQuery);
    ventasPorHeadquarter.forEach(vh => {
      console.log(`   - Headquarter ${vh.headquarter_id} (${vh.headquarter_name}): ${vh.total_ventas} ventas, ${vh.total_productos_vendidos} productos, ${vh.total_cantidad} unidades`);
    });

  } finally {
    await pool.end();
  }
}

// Función principal
async function main() {
  console.log('🚀 VALIDACIÓN DE HEADQUARTERS - VENTAS DIARIAS');
  console.log('==============================================\n');

  try {
    // Validar ambas sedes
    await validarHeadquarters('manizales');
    await validarHeadquarters('ladorada');
    
    console.log('\n✅ Validación completada!');
    
  } catch (error) {
    console.error('❌ Error durante la validación:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  validarHeadquarters
};
