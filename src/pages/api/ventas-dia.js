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

// HeadquarterId por sede
const headquarters = {
  manizales: [
    { id: 3, nombre: 'MI HOGAR' },
    { id: 1, nombre: 'MULTIFAMILIAR 2' },
    { id: 2, nombre: 'BODEGA' }
  ],
  ladorada: [
    { id: 6, nombre: 'CRISTALERIA MI HOGAR' },
    { id: 3, nombre: 'SURTITODO' },
    { id: 2, nombre: 'CRISTALERIA MULTIFAMILIAR' },
    { id: 5, nombre: 'CRISTALERIA MULTIFAMILIAR 2' }
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

// Función para obtener ventas por sede y punto de venta en un día específico
async function getVentasPorDia(sede, fecha, headquarterId = null) {
  try {
    console.log(`[DEBUG] Obteniendo ventas para ${sede} en fecha: ${fecha}, headquarter: ${headquarterId}`);
    
    let headquarterIds = headquarters[sede].map(hq => hq.id);
    
    // Si se especifica un headquarter específico, filtrar solo ese
    if (headquarterId) {
      headquarterIds = [parseInt(headquarterId)];
    }
    
    // Query para obtener ventas agrupadas por producto y punto de venta
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
        WHERE s."headquarterId" = ANY($1)
          AND s.deleted_at IS NULL
          AND ps.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND DATE(s.created_at) = $2
        GROUP BY ps."productId", p.internal_code, p.name, s."headquarterId", h.name
        HAVING SUM(ps.quantity) > 0
        ORDER BY p.internal_code ASC, p.name ASC
      )
      SELECT 
        internal_code as codigo,
        LEFT(nombre_producto, 25) as nombre,
        cantidad_total as cantidad,
        nombre_headquarter as headquarter
      FROM ventas_del_dia
      ORDER BY internal_code ASC
    `;
    
    const resultado = await executeQuery(sede, query, [headquarterIds, fecha]);
    
    console.log(`[DEBUG] Ventas encontradas en ${sede}:`, resultado.length);
    
    // Agrupar por headquarter
    const ventasPorHeadquarter = {};
    resultado.forEach(venta => {
      const headquarter = venta.headquarter;
      if (!ventasPorHeadquarter[headquarter]) {
        ventasPorHeadquarter[headquarter] = [];
      }
      ventasPorHeadquarter[headquarter].push({
        codigo: venta.codigo,
        nombre: venta.nombre,
        cantidad: parseInt(venta.cantidad)
      });
    });
    
    return ventasPorHeadquarter;
  } catch (error) {
    console.error(`Error obteniendo ventas en ${sede}:`, error);
    throw error;
  }
}

// API Handler para Next.js
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Solo GET está soportado.' 
    });
  }

  try {
    const { fecha, sede, headquarter_id } = req.query;

    // Validar parámetros requeridos
    if (!fecha || !sede) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros fecha y sede son requeridos'
      });
    }

    // Validar sede
    if (!['manizales', 'ladorada'].includes(sede)) {
      return res.status(400).json({
        success: false,
        message: 'La sede debe ser "manizales" o "ladorada"'
      });
    }

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({
        success: false,
        message: 'El formato de fecha debe ser YYYY-MM-DD'
      });
    }

    console.log(`[API] Solicitud de ventas: sede=${sede}, fecha=${fecha}, headquarter_id=${headquarter_id}`);

    // Obtener ventas
    const ventas = await getVentasPorDia(sede, fecha, headquarter_id);

    // Estructurar respuesta
    const response = {
      success: true,
      data: {
        [sede]: ventas
      },
      metadata: {
        sede: sede,
        fecha: fecha,
        headquarter_id: headquarter_id,
        total_headquarters: Object.keys(ventas).length,
        total_productos: Object.values(ventas).reduce((total, productos) => total + productos.length, 0)
      }
    };

    console.log(`[API] Respuesta exitosa: ${response.metadata.total_productos} productos en ${response.metadata.total_headquarters} headquarters`);

    res.status(200).json(response);

  } catch (error) {
    console.error('[API] Error en ventas-dia:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
}
