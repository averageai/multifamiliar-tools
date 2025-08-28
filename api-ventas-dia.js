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

// Función para obtener ventas por sede y punto de venta en un día específico
async function getVentasPorDia(sede, fecha) {
  try {
    console.log(`[DEBUG] Obteniendo ventas para ${sede} en fecha: ${fecha}`);
    
    const headquarterIds = headquarters[sede].map(hq => hq.id);
    
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
        vd."productId",
        vd.internal_code,
        vd.nombre_producto,
        vd."headquarterId",
        vd.nombre_headquarter,
        vd.cantidad_total
      FROM ventas_del_dia vd
      ORDER BY vd.internal_code ASC, vd.nombre_producto ASC
    `;
    
    const resultados = await executeQuery(sede, query, [headquarterIds, fecha]);
    
    console.log(`[DEBUG] Ventas encontradas para ${sede}:`, {
      fecha,
      totalProductos: resultados.length,
      muestra: resultados.slice(0, 3).map(r => ({
        codigo: r.internal_code,
        nombre: r.nombre_producto,
        headquarter: r.nombre_headquarter,
        cantidad: r.cantidad_total
      }))
    });
    
    return resultados;
  } catch (error) {
    console.error(`Error obteniendo ventas para ${sede}:`, error);
    throw error;
  }
}

// Función principal para obtener ventas de todas las sedes
async function getVentasTodasLasSedes(fecha) {
  try {
    console.log(`[DEBUG] Iniciando obtención de ventas para fecha: ${fecha}`);
    
    const sedes = ['manizales', 'ladorada'];
    const resultadoFinal = {};
    
    for (const sede of sedes) {
      try {
        const ventasSede = await getVentasPorDia(sede, fecha);
        
        // Organizar por punto de venta
        const ventasPorPuntoVenta = {};
        
        ventasSede.forEach(venta => {
          const puntoVenta = venta.nombre_headquarter;
          
          if (!ventasPorPuntoVenta[puntoVenta]) {
            ventasPorPuntoVenta[puntoVenta] = [];
          }
          
          // Agregar producto al punto de venta
          ventasPorPuntoVenta[puntoVenta].push({
            codigo: venta.internal_code || 'SIN_CODIGO',
            nombre: (venta.nombre_producto || 'SIN_NOMBRE').substring(0, 25),
            cantidad: parseInt(venta.cantidad_total)
          });
        });
        
        // Ordenar productos alfabéticamente por código dentro de cada punto de venta
        Object.keys(ventasPorPuntoVenta).forEach(puntoVenta => {
          ventasPorPuntoVenta[puntoVenta].sort((a, b) => {
            return a.codigo.localeCompare(b.codigo);
          });
        });
        
        resultadoFinal[sede] = ventasPorPuntoVenta;
        
        console.log(`[DEBUG] ${sede} procesada:`, {
          puntosVenta: Object.keys(ventasPorPuntoVenta),
          totalProductos: ventasSede.length
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
    console.error('Error obteniendo ventas de todas las sedes:', error);
    throw error;
  }
}

// Función para validar formato de fecha
function validarFecha(fecha) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha)) {
    throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
  }
  
  const fechaObj = new Date(fecha);
  if (isNaN(fechaObj.getTime())) {
    throw new Error('Fecha inválida');
  }
  
  return fecha;
}

// Exportar funciones para uso en API
module.exports = {
  getVentasPorDia,
  getVentasTodasLasSedes,
  validarFecha,
  dbConfigs,
  headquarters
};

// Si se ejecuta directamente, crear el servidor API
if (require.main === module) {
  const express = require('express');
  const cors = require('cors');
  
  const app = express();
  const PORT = process.env.PORT || 3001;
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Endpoint principal
  app.get('/api/ventas-dia', async (req, res) => {
    try {
      const { fecha } = req.query;
      
      if (!fecha) {
        return res.status(400).json({
          success: false,
          error: 'Parámetro fecha es requerido (YYYY-MM-DD)'
        });
      }
      
      // Validar fecha
      const fechaValidada = validarFecha(fecha);
      
      // Obtener ventas
      const ventas = await getVentasTodasLasSedes(fechaValidada);
      
      res.json({
        success: true,
        fecha: fechaValidada,
        data: ventas,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error en API:', error);
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
      service: 'ventas-dia-api',
      timestamp: new Date().toISOString()
    });
  });
  
  // Iniciar servidor
  app.listen(PORT, () => {
    console.log(`🚀 API de Ventas por Día ejecutándose en puerto ${PORT}`);
    console.log(`📊 Endpoint: http://localhost:${PORT}/api/ventas-dia?fecha=YYYY-MM-DD`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
}
