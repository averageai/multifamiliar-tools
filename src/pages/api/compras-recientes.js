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

// Función para obtener compras recientes
async function getComprasRecientes(sede, dias = 30, providerId = null, limit = 100) {
  try {
    console.log(`[DEBUG] Obteniendo compras para ${sede}, últimos ${dias} días, provider: ${providerId}, limit: ${limit}`);
    
    // Calcular fecha límite
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);
    
    // Construir query base
    let query = `
      SELECT 
        pp.id as compra_id,
        pp."productId",
        pp."purchaseId",
        p.internal_code,
        p.name as nombre_producto,
        pp.quantity,
        pp.cost,
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
    `;
    
    const params = [fechaLimite];
    
    // Agregar filtro por proveedor si se especifica
    if (providerId) {
      query += ` AND pur."providerId" = $2`;
      params.push(providerId);
    }
    
    query += `
      ORDER BY pur.created_at DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);
    
    const resultado = await executeQuery(sede, query, params);
    
    console.log(`[DEBUG] Compras encontradas en ${sede}:`, resultado.length);
    
    // Agrupar por proveedor
    const comprasPorProveedor = {};
    resultado.forEach(compra => {
      const proveedor = compra.nombre_proveedor;
      if (!comprasPorProveedor[proveedor]) {
        comprasPorProveedor[proveedor] = {
          provider_id: compra.provider_id,
          provider_name: proveedor,
          compras: []
        };
      }
      
      comprasPorProveedor[proveedor].compras.push({
        id: compra.compra_id,
        product_id: compra.productId,
        purchase_id: compra.purchaseId,
        codigo: compra.internal_code,
        nombre: compra.nombre_producto.substring(0, 25), // Limitar a 25 caracteres
        cantidad: parseInt(compra.quantity),
        costo: parseFloat(compra.cost),
        fecha_compra: compra.fecha_compra
      });
    });
    
    return comprasPorProveedor;
  } catch (error) {
    console.error(`Error obteniendo compras en ${sede}:`, error);
    throw error;
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
        MAX(pur.created_at) as ultima_compra
      FROM provider p
      LEFT JOIN purchase pur ON p.id = pur."providerId" AND pur.deleted_at IS NULL
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
      ultima_compra: prov.ultima_compra
    }));
  } catch (error) {
    console.error(`Error obteniendo proveedores en ${sede}:`, error);
    throw error;
  }
}

// API Handler para Next.js - Compras Recientes
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
    const { sede, dias = 30, provider_id, limit = 100 } = req.query;

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

    // Validar y convertir parámetros
    const diasInt = parseInt(dias);
    const limitInt = parseInt(limit);
    
    if (isNaN(diasInt) || diasInt < 1 || diasInt > 365) {
      return res.status(400).json({
        success: false,
        message: 'Los días deben ser un número entre 1 y 365'
      });
    }

    if (isNaN(limitInt) || limitInt < 1 || limitInt > 1000) {
      return res.status(400).json({
        success: false,
        message: 'El límite debe ser un número entre 1 y 1000'
      });
    }

    console.log(`[API] Solicitud de compras: sede=${sede}, dias=${diasInt}, provider_id=${provider_id}, limit=${limitInt}`);

    // Obtener compras
    const compras = await getComprasRecientes(sede, diasInt, provider_id, limitInt);

    // Estructurar respuesta
    const response = {
      success: true,
      data: {
        [sede]: compras
      },
      metadata: {
        sede: sede,
        dias: diasInt,
        provider_id: provider_id,
        limit: limitInt,
        total_proveedores: Object.keys(compras).length,
        total_compras: Object.values(compras).reduce((total, prov) => total + prov.compras.length, 0)
      }
    };

    console.log(`[API] Respuesta exitosa: ${response.metadata.total_compras} compras de ${response.metadata.total_proveedores} proveedores`);

    res.status(200).json(response);

  } catch (error) {
    console.error('[API] Error en compras-recientes:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
}
