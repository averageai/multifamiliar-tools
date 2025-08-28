# 🛒 API de Compras Recientes - Sistema Multifamiliar

API para obtener compras recientes, listar proveedores y generar JSON de selección para herramientas de impresión.

## 🚀 Características

- **Multi-sede**: Conecta a bases de datos de Manizales y La Dorada
- **Filtros avanzados**: Por sede, proveedor, días y límite de resultados
- **Listado de proveedores**: Con estadísticas de facturas y última compra
- **Generación de JSON**: Formato específico para impresión
- **Validación de parámetros**: Control de rangos y formatos
- **Logs detallados**: Para debugging y monitoreo

## 📡 Endpoints Disponibles

### 1. **GET `/api/compras-recientes`**

Obtiene las compras más recientes con filtros configurables.

**Parámetros:**
- `sede` (opcional): `manizales` o `ladorada` (si no se especifica, obtiene todas)
- `dias` (opcional): Número de días hacia atrás (default: 30, max: 365)
- `provider_id` (opcional): ID del proveedor específico
- `limit` (opcional): Límite de resultados (default: 100, max: 1000)

**Ejemplos:**
```bash
# Todas las sedes, últimos 30 días
curl "http://localhost:3002/api/compras-recientes"

# Sede específica, últimos 7 días
curl "http://localhost:3002/api/compras-recientes?sede=manizales&dias=7"

# Proveedor específico, máximo 50 resultados
curl "http://localhost:3002/api/compras-recientes?provider_id=123&limit=50"
```

**Respuesta:**
```json
{
  "success": true,
  "sede": "todas",
  "dias": 30,
  "provider_id": null,
  "limit": 100,
  "data": {
    "manizales": [
      {
        "compra_id": 12345,
        "invoice_number": "FAC-001",
        "fecha_compra": "2024-12-26T10:30:00.000Z",
        "total_value": 150000,
        "provider_id": 1,
        "nombre_proveedor": "Proveedor Ejemplo",
        "product_id": 100,
        "codigo_interno": "PROD001",
        "nombre_producto": "Producto de Ejemplo",
        "cantidad_comprada": 10,
        "precio_unitario": 15000,
        "nombre_headquarter": "MI HOGAR"
      }
    ],
    "ladorada": [...]
  },
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

### 2. **GET `/api/proveedores`**

Obtiene la lista de proveedores disponibles con estadísticas.

**Parámetros:**
- `sede` (opcional): `manizales` o `ladorada` (si no se especifica, obtiene todas)

**Ejemplos:**
```bash
# Todos los proveedores
curl "http://localhost:3002/api/proveedores"

# Proveedores de sede específica
curl "http://localhost:3002/api/proveedores?sede=manizales"
```

**Respuesta:**
```json
{
  "success": true,
  "sede": "todas",
  "data": {
    "manizales": [
      {
        "id": 1,
        "nombre": "Proveedor Ejemplo",
        "total_facturas": 25,
        "ultima_compra": "2024-12-26T10:30:00.000Z"
      }
    ],
    "ladorada": [...]
  },
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

### 3. **POST `/api/generar-json-compras`**

Genera JSON con formato específico para impresión de compras seleccionadas.

**Body:**
```json
{
  "compras_seleccionadas": [
    {
      "nombre_proveedor": "Proveedor A",
      "nombre_producto": "Producto Ejemplo",
      "codigo_interno": "PROD001"
    }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "total_items": 1,
  "data": [
    {
      "proveedor": "Proveedor A",
      "producto": "Producto Ejemplo",
      "codigo_interno": "PROD001"
    }
  ],
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

### 4. **GET `/api/health`**

Verifica el estado de salud de la API.

**Respuesta:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "compras-recientes-api",
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

## 🛠️ Instalación y Uso

### 1. **Instalar dependencias:**
```bash
npm install
```

### 2. **Iniciar servidor:**
```bash
npm start
```

### 3. **Desarrollo con auto-reload:**
```bash
npm run dev
```

### 4. **Ejecutar pruebas:**
```bash
npm test
```

## 🔍 Consulta SQL Utilizada

La API utiliza consultas optimizadas con JOINs:

```sql
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
ORDER BY pur.created_at DESC, pr.name ASC, p.internal_code ASC
LIMIT $3
```

## 📊 Estructura de Datos

### **Compras:**
- `compra_id`: ID único de la compra
- `invoice_number`: Número de factura
- `fecha_compra`: Fecha y hora de la compra
- `total_value`: Valor total de la factura
- `provider_id`: ID del proveedor
- `nombre_proveedor`: Nombre del proveedor
- `product_id`: ID del producto
- `codigo_interno`: Código interno del producto
- `nombre_producto`: Nombre del producto (limitado a 25 caracteres)
- `cantidad_comprada`: Cantidad comprada
- `precio_unitario`: Precio por unidad
- `nombre_headquarter`: Nombre del punto de venta

### **Proveedores:**
- `id`: ID único del proveedor
- `nombre`: Nombre del proveedor
- `total_facturas`: Número total de facturas
- `ultima_compra`: Fecha de la última compra

## ⚠️ Manejo de Errores

### **Error de parámetros inválidos:**
```json
{
  "success": false,
  "error": "Días debe estar entre 1 y 365",
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

### **Error de conexión a base de datos:**
```json
{
  "success": false,
  "error": "Error conectando a manizales: connection refused",
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

## 🧪 Pruebas

El archivo `test-compras.js` incluye pruebas para:
- Validación de parámetros
- Obtención de proveedores
- Obtención de compras recientes
- Generación de JSON de selección

## 📈 Casos de Uso

### **1. Herramienta de Selección de Compras:**
```javascript
// 1. Cargar proveedores para filtros
const proveedores = await fetch('/api/proveedores?sede=manizales');

// 2. Cargar compras recientes
const compras = await fetch('/api/compras-recientes?sede=manizales&dias=7');

// 3. Permitir selección al usuario
// 4. Generar JSON para impresión
const jsonImpresion = await fetch('/api/generar-json-compras', {
  method: 'POST',
  body: JSON.stringify({ compras_seleccionadas: seleccionadas })
});
```

### **2. Filtrado por Proveedor:**
```javascript
// Obtener compras de un proveedor específico
const comprasProveedor = await fetch('/api/compras-recientes?provider_id=123&dias=30');
```

### **3. Monitoreo de Compras:**
```javascript
// Obtener compras de las últimas 24 horas
const comprasHoy = await fetch('/api/compras-recientes?dias=1&limit=200');
```

## 🔧 Personalización

### **Modificar límites:**
Editar la función `validarParametros` en `api-compras-recientes.js`:
```javascript
function validarParametros(dias, limit) {
  if (dias && (dias < 1 || dias > 365)) {
    throw new Error('Días debe estar entre 1 y 365');
  }
  
  if (limit && (limit < 1 || limit > 1000)) {
    throw new Error('Límite debe estar entre 1 y 1000');
  }
  
  return true;
}
```

### **Cambiar formato de JSON:**
Modificar la función `generarJSONComprasSeleccionadas`:
```javascript
function generarJSONComprasSeleccionadas(comprasSeleccionadas) {
  const resultado = comprasSeleccionadas.map(compra => ({
    proveedor: compra.nombre_proveedor,
    producto: compra.nombre_producto,
    codigo_interno: compra.codigo_interno
    // Agregar más campos según necesidad
  }));
  
  return {
    success: true,
    total_items: resultado.length,
    data: resultado,
    timestamp: new Date().toISOString()
  };
}
```

## 📊 Logs y Debug

La API incluye logs detallados con prefijos:
- `[DEBUG]`: Información de debug
- `✅`: Operaciones exitosas
- `❌`: Errores

## 🚀 Integración con Herramientas Web

Para crear una herramienta web completa, puedes usar estas APIs con:

1. **Frontend**: HTML + JavaScript + CSS
2. **Filtros**: Dropdowns para sede y proveedor
3. **Tabla**: Para mostrar compras con checkboxes
4. **Botón**: Para generar JSON de selección
5. **Descarga**: Para descargar el JSON generado

## 📞 Soporte

Para soporte técnico o preguntas sobre la API, contactar al equipo de desarrollo del Sistema Multifamiliar.
