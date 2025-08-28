const { Pool } = require('pg');

// Configuración de bases de datos
const dbConfigs = {
  manizales: {
    host: '5.161.103.230',
    port: 7717,
    user: 'vercel_user',
    password: 'non@ver@ge',
    database: 'crsitaleriamanizales_complete',
    ssl: {
      rejectUnauthorized: false
    }
  },
  ladorada: {
    host: '5.161.103.230',
    port: 7717,
    user: 'vercel_user',
    password: 'non@ver@ge',
    database: 'cristaleriaprod_complete',
    ssl: {
      rejectUnauthorized: false
    }
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

// Función para obtener compras recientes
async function getComprasRecientes(sede, dias = 30, providerId = null, limit = 100) {
  try {
    console.log(`[DEBUG] Obteniendo compras recientes para ${sede}:`, { dias, providerId, limit });
    
    const headquarterIds = headquarters[sede].map(hq => hq.id);
    
    // Calcular fecha límite
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);
    
    // Construir filtro de proveedor
    let filtroProveedor = '';
    let params = [headquarterIds, fechaLimite.toISOString()];
    let paramIndex = 3;
    
    if (providerId) {
      filtroProveedor = `AND pur."providerId" = $${paramIndex}`;
      params.push(providerId);
      paramIndex++;
    }
    
    // Query para obtener compras recientes
    const query = `
      SELECT DISTINCT
        pur.id as compra_id,
        pur.invoice_number,
        pur.created_at as fecha_compra,
        pur.total_value,
        pr.id as provider_id,
        pr.name as nombre_proveedor,
        p.id as product_id,
        p.internal_code,
        p.name as nombre_producto,
        pp.quantity as cantidad_comprada,
        pp.unit_price as precio_unitario,
        h.name as nombre_headquarter
      FROM purchase pur
      JOIN provider pr ON pur."providerId" = pr.id
      JOIN product_purchase pp ON pur.id = pp."purchaseId"
      JOIN product p ON pp."productId" = p.id
      JOIN headquarter h ON pur."headquarterId" = h.id
      WHERE pur."headquarterId" = ANY($1)
        AND pur.created_at >= $2
        AND pur.deleted_at IS NULL
        AND pr.deleted_at IS NULL
        AND p.deleted_at IS NULL
        ${filtroProveedor}
      ORDER BY pur.created_at DESC, pr.name ASC, p.internal_code ASC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    
    const resultados = await executeQuery(sede, query, params);
    
    console.log(`[DEBUG] Compras encontradas para ${sede}:`, {
      dias,
      providerId,
      totalCompras: resultados.length,
      muestra: resultados.slice(0, 3).map(r => ({
        compra_id: r.compra_id,
        proveedor: r.nombre_proveedor,
        producto: r.nombre_producto,
        codigo: r.internal_code,
        fecha: r.fecha_compra
      }))
    });
    
    return resultados;
  } catch (error) {
    console.error(`Error obteniendo compras recientes para ${sede}:`, error);
    throw error;
  }
}

// Función para obtener proveedores disponibles
async function getProveedores(sede) {
  try {
    console.log(`[DEBUG] Obteniendo proveedores de ${sede}...`);
    
    const headquarterIds = headquarters[sede].map(hq => hq.id);
    
    const query = `
      SELECT DISTINCT
        pr.id,
        pr.name as nombre,
        COUNT(DISTINCT pur.id) as total_facturas,
        MAX(pur.created_at) as ultima_compra
      FROM provider pr
      INNER JOIN purchase pur ON pr.id = pur."providerId"
      WHERE pur."headquarterId" = ANY($1)
        AND pur.deleted_at IS NULL
        AND pr.deleted_at IS NULL
      GROUP BY pr.id, pr.name
      ORDER BY pr.name
    `;
    
    const proveedores = await executeQuery(sede, query, [headquarterIds]);
    
    // Convertir fechas a strings para serialización JSON
    const proveedoresFormateados = proveedores.map(proveedor => ({
      ...proveedor,
      ultima_compra: proveedor.ultima_compra?.toISOString()
    }));
    
    console.log(`[DEBUG] Proveedores encontrados en ${sede}:`, proveedoresFormateados.length);
    
    return proveedoresFormateados;
  } catch (error) {
    console.error(`Error obteniendo proveedores para ${sede}:`, error);
    throw error;
  }
}

// Función para obtener compras de todas las sedes
async function getComprasTodasLasSedes(dias = 30, providerId = null, limit = 100) {
  try {
    console.log(`[DEBUG] Obteniendo compras de todas las sedes:`, { dias, providerId, limit });
    
    const sedes = ['manizales', 'ladorada'];
    const resultadoFinal = {};
    
    for (const sede of sedes) {
      try {
        const comprasSede = await getComprasRecientes(sede, dias, providerId, limit);
        
        // Formatear resultados
        const comprasFormateadas = comprasSede.map(compra => ({
          compra_id: compra.compra_id,
          invoice_number: compra.invoice_number,
          fecha_compra: compra.fecha_compra.toISOString(),
          total_value: compra.total_value,
          provider_id: compra.provider_id,
          nombre_proveedor: compra.nombre_proveedor,
          product_id: compra.product_id,
          codigo_interno: compra.internal_code || 'SIN_CODIGO',
          nombre_producto: (compra.nombre_producto || 'SIN_NOMBRE').substring(0, 25),
          cantidad_comprada: parseInt(compra.cantidad_comprada),
          precio_unitario: parseFloat(compra.precio_unitario),
          nombre_headquarter: compra.nombre_headquarter
        }));
        
        resultadoFinal[sede] = comprasFormateadas;
        
        console.log(`[DEBUG] ${sede} procesada:`, {
          totalCompras: comprasFormateadas.length,
          proveedores: [...new Set(comprasFormateadas.map(c => c.nombre_proveedor))]
        });
        
      } catch (error) {
        console.error(`Error procesando sede ${sede}:`, error);
        resultadoFinal[sede] = {
          error: `Error procesando sede: ${error.message}`
        };
      }
    }
    
    return resultadoFinal;
  } catch (error) {
    console.error('Error obteniendo compras de todas las sedes:', error);
    throw error;
  }
}

// Función para obtener proveedores de todas las sedes
async function getProveedoresTodasLasSedes() {
  try {
    console.log(`[DEBUG] Obteniendo proveedores de todas las sedes...`);
    
    const sedes = ['manizales', 'ladorada'];
    const resultadoFinal = {};
    
    for (const sede of sedes) {
      try {
        const proveedoresSede = await getProveedores(sede);
        resultadoFinal[sede] = proveedoresSede;
        
        console.log(`[DEBUG] Proveedores de ${sede}:`, proveedoresSede.length);
        
      } catch (error) {
        console.error(`Error obteniendo proveedores de ${sede}:`, error);
        resultadoFinal[sede] = {
          error: `Error obteniendo proveedores: ${error.message}`
        };
      }
    }
    
    return resultadoFinal;
  } catch (error) {
    console.error('Error obteniendo proveedores de todas las sedes:', error);
    throw error;
  }
}

// Función para generar JSON de compras seleccionadas
function generarJSONComprasSeleccionadas(comprasSeleccionadas) {
  try {
    console.log(`[DEBUG] Generando JSON para ${comprasSeleccionadas.length} compras seleccionadas`);
    
    const resultado = comprasSeleccionadas.map(compra => ({
      proveedor: compra.nombre_proveedor,
      producto: compra.nombre_producto,
      codigo_interno: compra.codigo_interno
    }));
    
    console.log(`[DEBUG] JSON generado:`, {
      totalItems: resultado.length,
      muestra: resultado.slice(0, 3)
    });
    
    return {
      success: true,
      total_items: resultado.length,
      data: resultado,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generando JSON:', error);
    throw error;
  }
}

// Función para validar parámetros
function validarParametros(dias, limit) {
  if (dias && (dias < 1 || dias > 365)) {
    throw new Error('Días debe estar entre 1 y 365');
  }
  
  if (limit && (limit < 1 || limit > 1000)) {
    throw new Error('Límite debe estar entre 1 y 1000');
  }
  
  return true;
}

// Exportar funciones
module.exports = {
  getComprasRecientes,
  getComprasTodasLasSedes,
  getProveedores,
  getProveedoresTodasLasSedes,
  generarJSONComprasSeleccionadas,
  validarParametros,
  dbConfigs,
  headquarters
};

// Si se ejecuta directamente, crear el servidor API
if (require.main === module) {
  const express = require('express');
  const cors = require('cors');
  
  const app = express();
  const PORT = process.env.PORT || 3002;
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Endpoint para obtener compras recientes
  app.get('/api/compras-recientes', async (req, res) => {
    try {
      const { sede, dias = 30, provider_id, limit = 100 } = req.query;
      
      // Validar parámetros
      validarParametros(parseInt(dias), parseInt(limit));
      
      let resultado;
      
      if (sede && (sede === 'manizales' || sede === 'ladorada')) {
        // Obtener compras de una sede específica
        resultado = await getComprasRecientes(sede, parseInt(dias), provider_id, parseInt(limit));
      } else {
        // Obtener compras de todas las sedes
        resultado = await getComprasTodasLasSedes(parseInt(dias), provider_id, parseInt(limit));
      }
      
      res.json({
        success: true,
        sede: sede || 'todas',
        dias: parseInt(dias),
        provider_id: provider_id || null,
        limit: parseInt(limit),
        data: resultado,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error en API compras recientes:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Endpoint para obtener proveedores
  app.get('/api/proveedores', async (req, res) => {
    try {
      const { sede } = req.query;
      
      let resultado;
      
      if (sede && (sede === 'manizales' || sede === 'ladorada')) {
        // Obtener proveedores de una sede específica
        resultado = await getProveedores(sede);
      } else {
        // Obtener proveedores de todas las sedes
        resultado = await getProveedoresTodasLasSedes();
      }
      
      res.json({
        success: true,
        sede: sede || 'todas',
        data: resultado,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error en API proveedores:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Endpoint para generar JSON de compras seleccionadas
  app.post('/api/generar-json-compras', async (req, res) => {
    try {
      const { compras_seleccionadas } = req.body;
      
      if (!compras_seleccionadas || !Array.isArray(compras_seleccionadas)) {
        return res.status(400).json({
          success: false,
          error: 'compras_seleccionadas debe ser un array'
        });
      }
      
      const resultado = generarJSONComprasSeleccionadas(compras_seleccionadas);
      
      res.json(resultado);
      
    } catch (error) {
      console.error('Error generando JSON:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Endpoint de salud
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      service: 'compras-recientes-api',
      timestamp: new Date().toISOString()
    });
  });
  
  // Iniciar servidor
  app.listen(PORT, () => {
    console.log(`🚀 API de Compras Recientes ejecutándose en puerto ${PORT}`);
    console.log(`📊 Endpoint compras: http://localhost:${PORT}/api/compras-recientes`);
    console.log(`🏢 Endpoint proveedores: http://localhost:${PORT}/api/proveedores`);
    console.log(`📄 Endpoint generar JSON: http://localhost:${PORT}/api/generar-json-compras`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
}
