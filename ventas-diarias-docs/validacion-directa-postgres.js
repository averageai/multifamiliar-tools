#!/usr/bin/env node

/**
 * 🔍 VALIDACIÓN DIRECTA POSTGRESQL - VENTAS DIARIAS POS
 * ====================================================
 * 
 * Este script valida directamente en PostgreSQL y compara con la API
 * para identificar discrepancias en los datos de ventas.
 */

const { Pool } = require('pg');
const { getVentasDiarias } = require('./ventas-diarias-api.js');

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
  const config = dbConfigs[environment];
  if (!config) {
    throw new Error(`Configuración no encontrada para: ${environment}`);
  }
  return new Pool(config);
}

// Función para ejecutar query
async function executeQuery(pool, query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error ejecutando query:', error.message);
    throw error;
  }
}

// Función para validar datos directamente en PostgreSQL
async function validarDatosDirectos(sede, headquarterId, fecha) {
  const pool = await createConnection(sede);
  
  try {
    console.log(`\n🔍 VALIDACIÓN DIRECTA - ${sede.toUpperCase()} - Headquarter ${headquarterId} - ${fecha}`);
    console.log('=' .repeat(60));

    // 1. Query directa en PostgreSQL (igual a la API)
    const queryDirecta = `
      SELECT 
        p.sku as codigo,
        p.name as nombre,
        SUM(ps.quantity) as cantidad
      FROM public.product_sell ps
      INNER JOIN public.sell s ON ps."sellId" = s.id
      INNER JOIN public.product p ON ps."productId" = p.id
      WHERE s."headquarterId" = $1 
        AND DATE(ps.created_at) = $2
        AND s.deleted_at IS NULL
        AND ps.deleted_at IS NULL
        AND p.deleted_at IS NULL
      GROUP BY p.id, p.sku, p.name
      HAVING SUM(ps.quantity) > 0
      ORDER BY p.name ASC
    `;

    console.log('📊 Ejecutando query directa en PostgreSQL...');
    const datosDirectos = await executeQuery(pool, queryDirecta, [headquarterId, fecha]);
    
    console.log(`✅ Datos directos PostgreSQL: ${datosDirectos.length} productos`);
    
    // 2. Query para verificar total de registros en product_sell
    const queryTotalProductSell = `
      SELECT COUNT(*) as total_registros
      FROM public.product_sell ps
      INNER JOIN public.sell s ON ps."sellId" = s.id
      WHERE s."headquarterId" = $1 
        AND DATE(ps.created_at) = $2
        AND s.deleted_at IS NULL
        AND ps.deleted_at IS NULL
    `;

    const totalProductSell = await executeQuery(pool, queryTotalProductSell, [headquarterId, fecha]);
    console.log(`📈 Total registros en product_sell: ${totalProductSell[0].total_registros}`);

    // 3. Query para verificar ventas por headquarter
    const queryVentasHeadquarter = `
      SELECT 
        h.id as headquarter_id,
        h.name as headquarter_name,
        COUNT(DISTINCT s.id) as total_ventas,
        COUNT(ps.id) as total_productos_vendidos
      FROM public.headquarter h
      LEFT JOIN public.sell s ON h.id = s."headquarterId" AND DATE(s.created_at) = $1
      LEFT JOIN public.product_sell ps ON s.id = ps."sellId" AND DATE(ps.created_at) = $1
      WHERE h.id = $2
        AND (s.deleted_at IS NULL OR s.deleted_at IS NULL)
        AND (ps.deleted_at IS NULL OR ps.deleted_at IS NULL)
      GROUP BY h.id, h.name
    `;

    const ventasHeadquarter = await executeQuery(pool, queryVentasHeadquarter, [fecha, headquarterId]);
    console.log(`🏢 Headquarter: ${ventasHeadquarter[0]?.headquarter_name || 'N/A'}`);
    console.log(`   - Total ventas: ${ventasHeadquarter[0]?.total_ventas || 0}`);
    console.log(`   - Total productos vendidos: ${ventasHeadquarter[0]?.total_productos_vendidos || 0}`);

    // 4. Query para verificar fechas disponibles
    const queryFechasDisponibles = `
      SELECT DISTINCT DATE(ps.created_at) as fecha
      FROM public.product_sell ps
      INNER JOIN public.sell s ON ps."sellId" = s.id
      WHERE s."headquarterId" = $1
        AND s.deleted_at IS NULL
        AND ps.deleted_at IS NULL
      ORDER BY DATE(ps.created_at) DESC
      LIMIT 10
    `;

    const fechasDisponibles = await executeQuery(pool, queryFechasDisponibles, [headquarterId]);
    console.log(`📅 Últimas 10 fechas con datos:`);
    fechasDisponibles.forEach(f => console.log(`   - ${f.fecha}`));

    // 5. Query para verificar productos con cantidad 0 o negativa
    const queryProductosCero = `
      SELECT 
        p.sku as codigo,
        p.name as nombre,
        SUM(ps.quantity) as cantidad_total
      FROM public.product_sell ps
      INNER JOIN public.sell s ON ps."sellId" = s.id
      INNER JOIN public.product p ON ps."productId" = p.id
      WHERE s."headquarterId" = $1 
        AND DATE(ps.created_at) = $2
        AND s.deleted_at IS NULL
        AND ps.deleted_at IS NULL
        AND p.deleted_at IS NULL
      GROUP BY p.id, p.sku, p.name
      HAVING SUM(ps.quantity) <= 0
      ORDER BY p.name ASC
    `;

    const productosCero = await executeQuery(pool, queryProductosCero, [headquarterId, fecha]);
    console.log(`⚠️ Productos con cantidad <= 0: ${productosCero.length}`);

    return {
      datosDirectos,
      totalProductSell: totalProductSell[0].total_registros,
      ventasHeadquarter: ventasHeadquarter[0],
      fechasDisponibles,
      productosCero
    };

  } finally {
    await pool.end();
  }
}

// Función para comparar con API
async function compararConAPI(sede, headquarterId, fecha) {
  console.log(`\n🔄 COMPARANDO CON API - ${sede.toUpperCase()} - Headquarter ${headquarterId} - ${fecha}`);
  console.log('=' .repeat(60));

  try {
    // Obtener datos de la API
    console.log('📊 Consultando API...');
    const datosAPI = await getVentasDiarias(sede, headquarterId, fecha);
    console.log(`✅ Datos API: ${datosAPI.length} productos`);

    // Obtener datos directos
    const datosDirectos = await validarDatosDirectos(sede, headquarterId, fecha);

    // Comparar resultados
    console.log(`\n📊 COMPARACIÓN DE RESULTADOS:`);
    console.log(`   PostgreSQL directo: ${datosDirectos.datosDirectos.length} productos`);
    console.log(`   API: ${datosAPI.length} productos`);
    
    const diferencia = datosDirectos.datosDirectos.length - datosAPI.length;
    console.log(`   Diferencia: ${diferencia} productos`);

    if (diferencia !== 0) {
      console.log(`\n⚠️ DISCREPANCIA DETECTADA!`);
      
      // Mostrar productos que están en PostgreSQL pero no en API
      const codigosAPI = new Set(datosAPI.map(d => d.codigo));
      const productosFaltantes = datosDirectos.datosDirectos.filter(d => !codigosAPI.has(d.codigo));
      
      if (productosFaltantes.length > 0) {
        console.log(`\n📋 Productos en PostgreSQL pero NO en API (${productosFaltantes.length}):`);
        productosFaltantes.slice(0, 10).forEach((p, index) => {
          console.log(`   ${index + 1}. ${p.codigo} - ${p.nombre} (${p.cantidad} uds)`);
        });
        if (productosFaltantes.length > 10) {
          console.log(`   ... y ${productosFaltantes.length - 10} productos más`);
        }
      }

      // Mostrar productos que están en API pero no en PostgreSQL
      const codigosPostgres = new Set(datosDirectos.datosDirectos.map(d => d.codigo));
      const productosExtra = datosAPI.filter(d => !codigosPostgres.has(d.codigo));
      
      if (productosExtra.length > 0) {
        console.log(`\n📋 Productos en API pero NO en PostgreSQL (${productosExtra.length}):`);
        productosExtra.slice(0, 10).forEach((p, index) => {
          console.log(`   ${index + 1}. ${p.codigo} - ${p.nombre} (${p.cantidad} uds)`);
        });
        if (productosExtra.length > 10) {
          console.log(`   ... y ${productosExtra.length - 10} productos más`);
        }
      }
    } else {
      console.log(`\n✅ NO HAY DISCREPANCIAS - Los datos coinciden perfectamente`);
    }

    // Crear sets para comparación
    const codigosAPI = new Set(datosAPI.map(d => d.codigo));
    const codigosPostgres = new Set(datosDirectos.datosDirectos.map(d => d.codigo));

    return {
      datosDirectos: datosDirectos.datosDirectos,
      datosAPI,
      diferencia,
      productosFaltantes: datosDirectos.datosDirectos.filter(d => !codigosAPI.has(d.codigo)),
      productosExtra: datosAPI.filter(d => !codigosPostgres.has(d.codigo))
    };

  } catch (error) {
    console.error(`❌ Error comparando con API:`, error.message);
    throw error;
  }
}

// Función principal
async function main() {
  console.log('🔍 VALIDACIÓN DIRECTA POSTGRESQL - VENTAS DIARIAS POS');
  console.log('===================================================\n');

  try {
    const fecha = '2025-08-28';
    const pruebas = [
      { sede: 'manizales', headquarterId: 1 },
      { sede: 'manizales', headquarterId: 3 },
      { sede: 'ladorada', headquarterId: 2 },
      { sede: 'ladorada', headquarterId: 5 }
    ];

    for (const prueba of pruebas) {
      await compararConAPI(prueba.sede, prueba.headquarterId, fecha);
    }

    console.log('\n✅ VALIDACIÓN DIRECTA COMPLETADA');
    console.log('\n📋 RESUMEN:');
    console.log('   - Se compararon datos directos de PostgreSQL con la API');
    console.log('   - Se identificaron posibles discrepancias');
    console.log('   - Se verificaron totales y fechas disponibles');

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
  validarDatosDirectos,
  compararConAPI
};
