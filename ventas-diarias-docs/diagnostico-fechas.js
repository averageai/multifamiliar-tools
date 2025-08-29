#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO DE FECHAS - VENTAS DIARIAS
 * =========================================
 * 
 * Este script diagnostica las fechas disponibles en la tabla product_sell
 * para entender por qué no aparecen ventas del 29 de agosto.
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

// Función para diagnosticar fechas en product_sell
async function diagnosticarFechas(sede) {
  console.log(`\n🔍 DIAGNÓSTICO DE FECHAS - ${sede.toUpperCase()}`);
  console.log('=' .repeat(50));
  
  const pool = await createConnection(sede);
  
  try {
    // 1. Verificar estructura de la tabla product_sell
    console.log('\n📋 1. ESTRUCTURA DE LA TABLA PRODUCT_SELL:');
    const estructuraQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'product_sell' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const estructura = await executeQuery(pool, estructuraQuery);
    estructura.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // 2. Verificar fechas disponibles en product_sell
    console.log('\n📅 2. FECHAS DISPONIBLES EN PRODUCT_SELL:');
    const fechasQuery = `
      SELECT 
        DATE(ps."created_at") as fecha,
        COUNT(*) as registros
      FROM product_sell ps
      WHERE ps.deleted_at IS NULL
      GROUP BY DATE(ps."created_at")
      ORDER BY fecha DESC
      LIMIT 10;
    `;
    
    const fechas = await executeQuery(pool, fechasQuery);
    fechas.forEach(fecha => {
      console.log(`   - ${fecha.fecha}: ${fecha.registros} registros`);
    });

    // 3. Verificar fechas en la tabla sell
    console.log('\n📅 3. FECHAS DISPONIBLES EN SELL:');
    const fechasSellQuery = `
      SELECT 
        DATE(s."created_at") as fecha,
        COUNT(*) as ventas
      FROM sell s
      WHERE s.deleted_at IS NULL
      GROUP BY DATE(s."created_at")
      ORDER BY fecha DESC
      LIMIT 10;
    `;
    
    const fechasSell = await executeQuery(pool, fechasSellQuery);
    fechasSell.forEach(fecha => {
      console.log(`   - ${fecha.fecha}: ${fecha.ventas} ventas`);
    });

    // 4. Verificar específicamente el 28 y 29 de agosto
    console.log('\n🎯 4. VERIFICACIÓN ESPECÍFICA - 28 Y 29 DE AGOSTO:');
    const fechasEspecificasQuery = `
      SELECT 
        DATE(s."created_at") as fecha,
        s."headquarterId",
        COUNT(DISTINCT s.id) as ventas,
        COUNT(ps.id) as productos_vendidos
      FROM sell s
      LEFT JOIN product_sell ps ON s.id = ps."sellId" AND ps.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
        AND DATE(s."created_at") IN ('2025-08-28', '2025-08-29')
      GROUP BY DATE(s."created_at"), s."headquarterId"
      ORDER BY fecha DESC, s."headquarterId";
    `;
    
    const fechasEspecificas = await executeQuery(pool, fechasEspecificasQuery);
    fechasEspecificas.forEach(fecha => {
      console.log(`   - ${fecha.fecha} - Headquarter ${fecha.headquarterid}: ${fecha.ventas} ventas, ${fecha.productos_vendidos} productos`);
    });

    // 5. Verificar con zona horaria colombiana
    console.log('\n🌍 5. VERIFICACIÓN CON ZONA HORARIA COLOMBIANA:');
    const fechasColombiaQuery = `
      SELECT 
        DATE(s."created_at" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota') as fecha_colombia,
        s."headquarterId",
        COUNT(DISTINCT s.id) as ventas,
        COUNT(ps.id) as productos_vendidos
      FROM sell s
      LEFT JOIN product_sell ps ON s.id = ps."sellId" AND ps.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
        AND DATE(s."created_at" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota') IN ('2025-08-28', '2025-08-29')
      GROUP BY DATE(s."created_at" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota'), s."headquarterId"
      ORDER BY fecha_colombia DESC, s."headquarterId";
    `;
    
    const fechasColombia = await executeQuery(pool, fechasColombiaQuery);
    fechasColombia.forEach(fecha => {
      console.log(`   - ${fecha.fecha_colombia} - Headquarter ${fecha.headquarterid}: ${fecha.ventas} ventas, ${fecha.productos_vendidos} productos`);
    });

    // 6. Verificar timestamps exactos
    console.log('\n⏰ 6. TIMESTAMPS EXACTOS DEL 29 DE AGOSTO:');
    const timestampsQuery = `
      SELECT 
        s."created_at",
        s."created_at" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota' as created_at_colombia,
        s."headquarterId",
        s.id as sell_id
      FROM sell s
      WHERE s.deleted_at IS NULL
        AND DATE(s."created_at") = '2025-08-29'
      ORDER BY s."created_at"
      LIMIT 5;
    `;
    
    const timestamps = await executeQuery(pool, timestampsQuery);
    if (timestamps.length > 0) {
      timestamps.forEach(ts => {
        console.log(`   - Sell ID ${ts.sell_id}: ${ts.created_at} (UTC) → ${ts.created_at_colombia} (Colombia) - Headquarter ${ts.headquarterid}`);
      });
    } else {
      console.log('   - No se encontraron ventas el 29 de agosto');
    }

  } finally {
    await pool.end();
  }
}

// Función principal
async function main() {
  console.log('🚀 DIAGNÓSTICO DE FECHAS - VENTAS DIARIAS');
  console.log('==========================================\n');

  try {
    // Diagnosticar ambas sedes
    await diagnosticarFechas('manizales');
    await diagnosticarFechas('ladorada');
    
    console.log('\n✅ Diagnóstico completado!');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
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
  diagnosticarFechas
};
