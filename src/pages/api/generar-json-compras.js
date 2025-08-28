// API Handler para Next.js - Generar JSON de Compras
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

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Solo POST está soportado.' 
    });
  }

  try {
    const { compras_seleccionadas } = req.body;

    // Validar parámetros requeridos
    if (!compras_seleccionadas || !Array.isArray(compras_seleccionadas)) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro compras_seleccionadas es requerido y debe ser un array'
      });
    }

    if (compras_seleccionadas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar al menos una compra'
      });
    }

    console.log(`[API] Generando JSON para ${compras_seleccionadas.length} compras seleccionadas`);

    // Procesar las compras seleccionadas
    const jsonCompras = compras_seleccionadas.map(compra => ({
      proveedor: compra.proveedor || 'Sin proveedor',
      producto: compra.nombre ? compra.nombre.substring(0, 25) : 'Sin nombre',
      codigo_interno: compra.codigo || 'Sin código'
    }));

    // Agrupar por proveedor
    const comprasPorProveedor = {};
    jsonCompras.forEach(compra => {
      const proveedor = compra.proveedor;
      if (!comprasPorProveedor[proveedor]) {
        comprasPorProveedor[proveedor] = [];
      }
      comprasPorProveedor[proveedor].push({
        producto: compra.producto,
        codigo_interno: compra.codigo_interno
      });
    });

    // Estructurar respuesta
    const response = {
      success: true,
      data: {
        compras_por_proveedor: comprasPorProveedor,
        lista_plana: jsonCompras
      },
      metadata: {
        total_compras: jsonCompras.length,
        total_proveedores: Object.keys(comprasPorProveedor).length,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`[API] JSON generado exitosamente: ${response.metadata.total_compras} compras de ${response.metadata.total_proveedores} proveedores`);

    res.status(200).json(response);

  } catch (error) {
    console.error('[API] Error generando JSON de compras:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
}
