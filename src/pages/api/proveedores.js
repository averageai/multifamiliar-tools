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

// Función para obtener proveedores
async function getProveedores(sede) {
  try {
    console.log(`[DEBUG] Obteniendo proveedores para ${sede}`);
    
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
    `;
    
    const resultado = await executeQuery(sede, query);
    
    console.log(`[DEBUG] Proveedores encontrados en ${sede}:`, resultado.length);
    
    return resultado.map(prov => ({
      id: prov.id,
      name: prov.name,
      total_facturas: parseInt(prov.total_facturas),
      productos_comprados: parseInt(prov.productos_comprados),
      ultima_compra: prov.ultima_compra
    }));
  } catch (error) {
    console.error(`Error obteniendo proveedores en ${sede}:`, error);
    throw error;
  }
}

// API Handler para Next.js - Proveedores
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
    const { sede } = req.query;

    // Validar parámetros requeridos
    if (!sede) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro sede es requerido'
      });
    }

    // Validar sede
    if (!['manizales', 'ladorada'].includes(sede)) {
      return res.status(400).json({
        success: false,
        message: 'La sede debe ser "manizales" o "ladorada"'
      });
    }

    console.log(`[API] Solicitud de proveedores: sede=${sede}`);

    // Obtener proveedores
    const proveedores = await getProveedores(sede);

    // Estructurar respuesta
    const response = {
      success: true,
      data: {
        [sede]: proveedores
      },
      metadata: {
        sede: sede,
        total_proveedores: proveedores.length,
        total_facturas: proveedores.reduce((total, prov) => total + prov.total_facturas, 0)
      }
    };

    console.log(`[API] Respuesta exitosa: ${response.metadata.total_proveedores} proveedores con ${response.metadata.total_facturas} facturas`);

    res.status(200).json(response);

  } catch (error) {
    console.error('[API] Error en proveedores:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
}
