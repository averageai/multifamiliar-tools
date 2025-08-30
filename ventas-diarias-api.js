const { Pool } = require('pg');

// Configuración de bases de datos del sistema de análisis de inventario
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

// Headquarter IDs por sede (actualizados según la base de datos)
const headquarterIds = {
  manizales: [
    { id: 1, name: 'MULTIFAMILIAR 2' },
    { id: 2, name: 'BODEGA' },
    { id: 3, name: 'MI HOGAR' }
  ],
  ladorada: [
    { id: 2, name: 'SURTITODO' },
    { id: 3, name: 'EL HOGAR' },
    { id: 5, name: 'MULTIFAMILIAR' },
    { id: 6, name: 'BODEGA DORADA' }
  ]
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
async function executeQuery(pool, query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error(`Error ejecutando query:`, error);
    throw error;
  }
}

// Función para obtener ventas diarias
async function getVentasDiarias(sede, headquarterId, fecha) {
  console.log(`🔍 Consultando ventas diarias: ${sede}, headquarter: ${headquarterId}, fecha: ${fecha} (fecha product_sell)`);
  
  const pool = await createConnection(sede);
  
  try {
    // Query para obtener ventas diarias agrupadas por producto
    // Usar fecha de product_sell.created_at como solicitado
    const query = `
      SELECT 
        p.internal_code as codigo,
        p.name as nombre,
        p.id as "productId",
        SUM(ps.quantity) as cantidad
      FROM product_sell ps
      JOIN sell s ON ps."sellId" = s.id
      JOIN product p ON ps."productId" = p.id
      WHERE s."headquarterId" = $1
        AND s.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND ps.deleted_at IS NULL
        AND DATE(ps.created_at) = $2
      GROUP BY p.id, p.internal_code, p.name
      HAVING SUM(ps.quantity) > 0
      ORDER BY p.name ASC
    `;
    
    const resultados = await executeQuery(pool, query, [headquarterId, fecha]);
    
    console.log(`✅ Ventas encontradas: ${resultados.length} productos`);
    
    // Formatear resultados
    const ventas = resultados.map(row => ({
      codigo: row.codigo || 'N/A',
      nombre: row.nombre || 'Producto sin nombre',
      cantidad: parseInt(row.cantidad) || 0,
      productId: parseInt(row.productId) || 0
    }));
    
    return ventas;
    
  } finally {
    await pool.end();
  }
}

// Función para obtener movimientos del día
async function getMovimientosDia(sede, headquarterId, fecha) {
  console.log(`🔍 Consultando movimientos del día: ${sede}, headquarter: ${headquarterId}, fecha: ${fecha}`);
  
  const pool = await createConnection(sede);
  
  try {
    // Query para obtener movimientos de entrada y salida del día
    const query = `
      SELECT 
        p.internal_code as codigo,
        p.name as nombre,
        p.id as "productId",
        m.movement_quantity as cantidad,
        m."sourceId",
        m."recieverId",
        CASE 
          WHEN m."sourceId" = $1 THEN -m.movement_quantity
          WHEN m."recieverId" = $1 THEN m.movement_quantity
          ELSE 0
        END as cantidad_ajustada
      FROM movement m
      JOIN product p ON m."productId" = p.id
      WHERE (m."sourceId" = $1 OR m."recieverId" = $1)
        AND m.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND DATE(m.created_at) = $2
      ORDER BY p.name ASC
    `;
    
    const resultados = await executeQuery(pool, query, [headquarterId, fecha]);
    
    console.log(`✅ Movimientos encontrados: ${resultados.length} registros`);
    
    // Formatear resultados
    const movimientos = resultados.map(row => ({
      codigo: row.codigo || 'N/A',
      nombre: row.nombre || 'Producto sin nombre',
      cantidad: parseInt(row.cantidad) || 0,
      cantidad_ajustada: parseInt(row.cantidad_ajustada) || 0,
      sourceId: parseInt(row.sourceId) || 0,
      receiverId: parseInt(row.recieverId) || 0,
      productId: parseInt(row.productId) || 0
    }));
    
    return movimientos;
    
  } finally {
    await pool.end();
  }
}

// Función para obtener productos sin relacionar (que tuvieron movimientos pero no se vendieron)
async function getProductosSinRelacionar(sede, headquarterId, fecha) {
  console.log(`🔍 Consultando productos sin relacionar: ${sede}, headquarter: ${headquarterId}, fecha: ${fecha}`);
  
  const pool = await createConnection(sede);
  
  try {
    // Query para obtener productos que tuvieron movimientos pero no se vendieron
    // Estos son productos que fueron surtidos pero quedaron en positivo después de la fórmula
    const query = `
      SELECT 
        p.internal_code as codigo,
        p.name as nombre,
        p.id as "productId",
        COALESCE(movimientos_recibidos.cantidad_total, 0) as cantidad
      FROM product p
      LEFT JOIN (
        -- Calcular movimientos recibidos por producto
        SELECT 
          m."productId",
          SUM(CASE 
            WHEN m."recieverId" = $1 THEN m.movement_quantity
            ELSE 0
          END) as cantidad_total
        FROM movement m
        WHERE m.deleted_at IS NULL
          AND DATE(m.created_at) = $2
          AND (m."sourceId" = $1 OR m."recieverId" = $1)
        GROUP BY m."productId"
      ) movimientos_recibidos ON p.id = movimientos_recibidos."productId"
      LEFT JOIN (
        -- Calcular ventas por producto
        SELECT 
          ps."productId",
          SUM(ps.quantity) as cantidad_total
        FROM product_sell ps
        JOIN sell s ON ps."sellId" = s.id
        WHERE s."headquarterId" = $1
          AND s.deleted_at IS NULL
          AND ps.deleted_at IS NULL
          AND DATE(ps.created_at) = $2
        GROUP BY ps."productId"
      ) ventas ON p.id = ventas."productId"
      WHERE p.deleted_at IS NULL
        AND movimientos_recibidos."productId" IS NOT NULL  -- Solo productos que tuvieron movimientos
        AND (ventas."productId" IS NULL OR ventas.cantidad_total = 0)  -- Y no se vendieron
        AND COALESCE(movimientos_recibidos.cantidad_total, 0) > 0  -- Y quedan en positivo
      ORDER BY p.name ASC
    `;
    
    const resultados = await executeQuery(pool, query, [headquarterId, fecha]);
    
    console.log(`✅ Productos sin relacionar encontrados: ${resultados.length} productos`);
    
    // Formatear resultados
    const productosSinRelacionar = resultados.map(row => ({
      codigo: row.codigo || 'N/A',
      nombre: row.nombre || 'Producto sin nombre',
      cantidad: parseInt(row.cantidad) || 0,
      productId: parseInt(row.productId) || 0
    }));
    
    return productosSinRelacionar;
    
  } finally {
    await pool.end();
  }
}

// Función para obtener información del headquarter
function getHeadquarterInfo(sede, headquarterId) {
  const headquarters = headquarterIds[sede] || [];
  return headquarters.find(hq => hq.id == headquarterId) || { name: 'N/A' };
}

// Función para obtener todos los headquarters de una sede
function getHeadquarters(sede) {
  return headquarterIds[sede] || [];
}

// Exportar funciones
module.exports = {
  getVentasDiarias,
  getMovimientosDia,
  getProductosSinRelacionar,
  getHeadquarterInfo,
  getHeadquarters,
  headquarterIds,
  dbConfigs
};

// Si se ejecuta directamente, crear un servidor de prueba
if (require.main === module) {
  const express = require('express');
  const cors = require('cors');
  
  const app = express();
  const PORT = process.env.PORT || 3001;
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Endpoint para obtener ventas diarias con movimientos
  app.get('/api/ventas-diarias', async (req, res) => {
    try {
      const { sede, headquarterId, fecha } = req.query;
      
      if (!sede || !headquarterId || !fecha) {
        return res.status(400).json({
          success: false,
          message: 'Faltan parámetros requeridos: sede, headquarterId, fecha'
        });
      }
      
      if (!['manizales', 'ladorada'].includes(sede)) {
        return res.status(400).json({
          success: false,
          message: 'Sede debe ser "manizales" o "ladorada"'
        });
      }
      
      // Obtener ventas, movimientos y productos sin relacionar
      const [ventas, movimientos, productosSinRelacionar] = await Promise.all([
        getVentasDiarias(sede, headquarterId, fecha),
        getMovimientosDia(sede, headquarterId, fecha),
        getProductosSinRelacionar(sede, headquarterId, fecha)
      ]);
      
      const headquarterInfo = getHeadquarterInfo(sede, headquarterId);
      
      res.json({
        success: true,
        data: {
          ventas,
          movimientos,
          productosSinRelacionar,
          headquarter: headquarterInfo,
          sede,
          fecha,
          total_productos: ventas.length + productosSinRelacionar.length,
          total_cantidad: ventas.reduce((sum, v) => sum + v.cantidad, 0) + productosSinRelacionar.reduce((sum, p) => sum + p.cantidad, 0)
        }
      });
      
    } catch (error) {
      console.error('Error en endpoint ventas-diarias:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  });
  
  // Endpoint para obtener headquarters de una sede
  app.get('/api/headquarters/:sede', (req, res) => {
    try {
      const { sede } = req.params;
      
      if (!['manizales', 'ladorada'].includes(sede)) {
        return res.status(400).json({
          success: false,
          message: 'Sede debe ser "manizales" o "ladorada"'
        });
      }
      
      const headquarters = getHeadquarters(sede);
      
      res.json({
        success: true,
        data: headquarters
      });
      
    } catch (error) {
      console.error('Error en endpoint headquarters:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  });
  
  // Endpoint de salud
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'API de Ventas Diarias funcionando correctamente',
      timestamp: new Date().toISOString()
    });
  });
  
  // Iniciar servidor
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de Ventas Diarias iniciado en puerto ${PORT}`);
    console.log(`📊 Endpoints disponibles:`);
    console.log(`   GET /api/health`);
    console.log(`   GET /api/headquarters/:sede`);
    console.log(`   GET /api/ventas-diarias?sede=manizales&headquarterId=3&fecha=2025-08-29`);
  });
}
