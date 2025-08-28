# 📊 API de Ventas por Día - Sistema Multifamiliar

API para listar productos vendidos por sede y punto de venta en un día específico, organizados alfabéticamente y agrupados por código.

## 🚀 Características

- **Multi-sede**: Conecta a bases de datos de Manizales y La Dorada
- **Agrupación por punto de venta**: Organiza productos por headquarters
- **Ordenamiento alfabético**: Productos ordenados por código interno
- **Suma de cantidades**: Agrupa productos duplicados sumando cantidades
- **Límite de caracteres**: Nombres limitados a 25 caracteres
- **Validación de fechas**: Formato YYYY-MM-DD requerido

## 📋 Estructura de Respuesta

```json
{
  "success": true,
  "fecha": "2024-12-26",
  "data": {
    "manizales": {
      "MI HOGAR": [
        {
          "codigo": "001",
          "nombre": "Producto Ejemplo",
          "cantidad": 5
        }
      ],
      "MULTIFAMILIAR 2": [
        {
          "codigo": "002",
          "nombre": "Otro Producto",
          "cantidad": 3
        }
      ]
    },
    "ladorada": {
      "CRISTALERIA MI HOGAR": [
        {
          "codigo": "003",
          "nombre": "Producto La Dorada",
          "cantidad": 2
        }
      ]
    }
  },
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

## 🛠️ Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno (opcional):**
   ```bash
   export PORT=3001
   ```

## 🚀 Uso

### Iniciar el servidor:
```bash
npm start
```

### Desarrollo con auto-reload:
```bash
npm run dev
```

### Ejecutar pruebas:
```bash
npm test
```

## 📡 Endpoints

### GET `/api/ventas-dia`

Obtiene las ventas de un día específico.

**Parámetros:**
- `fecha` (requerido): Fecha en formato YYYY-MM-DD

**Ejemplo:**
```bash
curl "http://localhost:3001/api/ventas-dia?fecha=2024-12-26"
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "fecha": "2024-12-26",
  "data": {
    "manizales": {
      "MI HOGAR": [
        {
          "codigo": "001",
          "nombre": "Producto Ejemplo",
          "cantidad": 5
        }
      ]
    },
    "ladorada": {
      "CRISTALERIA MI HOGAR": [
        {
          "codigo": "002",
          "nombre": "Otro Producto",
          "cantidad": 3
        }
      ]
    }
  },
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

### GET `/api/health`

Verifica el estado de salud de la API.

**Respuesta:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "ventas-dia-api",
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

## 🗄️ Configuración de Bases de Datos

### Sedes y Puntos de Venta:

**Manizales:**
- MI HOGAR (ID: 3)
- MULTIFAMILIAR 2 (ID: 1)
- BODEGA (ID: 2)

**La Dorada:**
- CRISTALERIA MI HOGAR (ID: 6)
- SURTITODO (ID: 3)
- CRISTALERIA MULTIFAMILIAR (ID: 2)
- CRISTALERIA MULTIFAMILIAR 2 (ID: 5)

## 🔍 Consulta SQL Utilizada

La API utiliza una consulta optimizada con CTEs:

```sql
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
SELECT * FROM ventas_del_dia
```

## ⚠️ Manejo de Errores

### Error de fecha inválida:
```json
{
  "success": false,
  "error": "Formato de fecha inválido. Use YYYY-MM-DD",
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

### Error de conexión a base de datos:
```json
{
  "success": false,
  "error": "Error conectando a manizales: connection refused",
  "timestamp": "2024-12-26T10:30:00.000Z"
}
```

## 🧪 Pruebas

Ejecutar el archivo de pruebas:
```bash
node test-ventas.js
```

Las pruebas incluyen:
- Validación de fechas
- Conexión a bases de datos
- Obtención de datos de ventas
- Análisis de resultados

## 📊 Logs y Debug

La API incluye logs detallados con prefijos:
- `[DEBUG]`: Información de debug
- `✅`: Operaciones exitosas
- `❌`: Errores

## 🔧 Personalización

### Modificar puntos de venta:
Editar el objeto `headquarters` en `api-ventas-dia.js`:

```javascript
const headquarters = {
  manizales: [
    { id: 3, nombre: 'MI HOGAR' },
    // Agregar más puntos de venta...
  ]
};
```

### Cambiar límite de caracteres:
Modificar la línea en `getVentasTodasLasSedes`:
```javascript
nombre: (venta.nombre_producto || 'SIN_NOMBRE').substring(0, 25)
```

## 📞 Soporte

Para soporte técnico o preguntas sobre la API, contactar al equipo de desarrollo del Sistema Multifamiliar.
