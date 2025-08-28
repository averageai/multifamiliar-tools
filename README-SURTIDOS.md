# Herramientas de Surtido - Sistema Multifamiliar

## Descripción General

Este documento describe las herramientas **Surtido Diario** y **Surtido Compras** del Sistema Multifamiliar, diseñadas para la gestión y visualización de datos de ventas y compras con funcionalidades de impresión POS 80mm.

## 🛠️ Surtido Diario

### Descripción
Herramienta para imprimir las ventas del día anterior en formato POS 80mm, organizadas por sede y punto de venta con estadísticas detalladas.

### Características Principales
- **Selección Obligatoria de Sede**: La selección de sede (Manizales o La Dorada) es el primer paso obligatorio antes de cualquier otra operación
- **Filtrado por Fecha**: Permite seleccionar una fecha específica para las ventas (día anterior por defecto)
- **Carga Automática de Todos los Puntos de Venta**: Carga automáticamente las ventas de todos los puntos de venta de la sede seleccionada
- **Agrupación Automática**: Suma cantidades por código de producto sin duplicados
- **Vista Previa de Impresión**: Genera una vista previa del formato POS 80mm
- **Impresión por Punto de Venta**: Cada punto de venta se imprime en una hoja separada
- **Exportación JSON**: Descarga de datos en formato JSON estructurado

### Funcionalidades
1. **Configuración de Búsqueda**
   - Selección de sede (obligatorio)
   - Selección de fecha
   - Selección de punto de venta
   - Botón para cargar ventas

2. **Estadísticas de Ventas**
   - Total de productos vendidos
   - Cantidad total
   - Número de proveedores

3. **Datos de Ventas**
   - Tabla con código, producto, cantidad y punto de venta
   - Datos organizados alfabéticamente por código

4. **Vista Previa de Impresión**
   - Formato POS 80mm
   - Encabezado con fecha y sede
   - Lista de productos con cantidades
   - Pie con totales

### Uso
1. Seleccionar **sede** (paso obligatorio)
2. Seleccionar **fecha** de ventas (día anterior por defecto)
3. Hacer clic en "📊 Cargar Ventas de Todos los Puntos de Venta"
4. Revisar estadísticas y datos
5. Generar vista previa de impresión
6. **Imprimir por punto de venta**: Cada punto de venta en una hoja separada
7. Opcionalmente descargar JSON

---

## 🛒 Surtido Compras

### Descripción
Herramienta para mostrar compras recientes, permitir selección de items y generar impresión POS 80mm con formato específico.

### Características Principales
- **Selección Obligatoria de Sede**: La selección de sede (Manizales o La Dorada) es el primer paso obligatorio antes de cualquier otra operación
- **Filtrado por Días**: Configuración de días hacia atrás para buscar compras
- **Filtrado por Proveedor**: Selección opcional de proveedor específico
- **Selección Múltiple**: Checkboxes para seleccionar compras individuales
- **Selección por Lotes**: Funciones para seleccionar/deseleccionar todos o por proveedor
- **Vista Previa de Impresión**: Genera vista previa del formato POS 80mm
- **Impresión POS 80mm**: Formato específico con proveedor, producto (limitado a 25 caracteres) y código interno
- **Generación JSON**: Exportación en formato JSON personalizado

### Funcionalidades
1. **Configuración de Búsqueda**
   - Selección de sede (obligatorio)
   - Configuración de días hacia atrás
   - Filtro opcional por proveedor
   - Límite de resultados
   - Botón para cargar compras

2. **Estadísticas de Compras**
   - Total de compras encontradas
   - Compras seleccionadas
   - Número de proveedores

3. **Datos de Compras**
   - Agrupación por proveedor
   - Checkboxes para selección individual
   - Controles de selección masiva
   - Información detallada de cada compra

4. **Generación de JSON**
   - Vista previa del JSON generado
   - Descarga en formato JSON
   - Estructura: Proveedor, Producto (limitado a 25 caracteres), código interno

5. **Vista Previa de Impresión POS**
   - Formato POS 80mm optimizado
   - Agrupación por proveedor
   - Productos con nombres limitados a 25 caracteres
   - Códigos internos
   - Totales y timestamps

### Uso
1. Seleccionar **sede** (paso obligatorio)
2. Configurar **días hacia atrás**
3. Opcionalmente seleccionar **proveedor**
4. Configurar **límite de resultados**
5. Hacer clic en "📊 Cargar Compras Recientes"
6. Seleccionar compras deseadas (individual o por lotes)
7. Generar vista previa de impresión POS
8. Imprimir en formato POS 80mm o generar JSON

### Formato de Impresión POS 80mm
```
SURTIDO COMPRAS
Sede: MANIZALES
Últimos 30 días - 15/12/2024

PROVEEDOR: Proveedor A
Producto 1                    COD001
Producto 2                    COD002

PROVEEDOR: Proveedor B
Producto 3                    COD003

Total: 3 productos
Impreso el: 15/12/2024 10:30:00
```

---

## 🔧 APIs Requeridas

### API de Ventas del Día
- **Endpoint**: `GET /api/ventas-dia`
- **Puerto**: 3001
- **Parámetros**:
  - `fecha`: Fecha en formato YYYY-MM-DD
  - `sede`: "manizales" o "ladorada"
  - `headquarter_id`: ID del punto de venta
- **Respuesta**: JSON con estructura `Sede > PuntoVenta > [Productos]`

### API de Compras Recientes
- **Endpoint**: `GET /api/compras-recientes`
- **Puerto**: 3002
- **Parámetros**:
  - `sede`: "manizales" o "ladorada"
  - `dias`: Número de días hacia atrás
  - `provider_id`: ID del proveedor (opcional)
  - `limit`: Límite de resultados
- **Respuesta**: JSON con compras organizadas por sede

### API de Proveedores
- **Endpoint**: `GET /api/proveedores`
- **Puerto**: 3002
- **Parámetros**:
  - `sede`: "manizales" o "ladorada"
- **Respuesta**: Lista de proveedores con total de facturas

### API de Generación JSON Compras
- **Endpoint**: `POST /api/generar-json-compras`
- **Puerto**: 3002
- **Body**: Array de compras seleccionadas
- **Respuesta**: JSON con formato específico

---

## ⚙️ Configuración

### Puertos de APIs
- **API Ventas**: `http://localhost:3001`
- **API Compras**: `http://localhost:3002`

### Headquarter IDs
```javascript
const headquarters = {
    manizales: [
        { id: 1, nombre: "Punto de Venta 1" },
        { id: 2, nombre: "Punto de Venta 2" }
    ],
    ladorada: [
        { id: 3, nombre: "Punto de Venta 3" },
        { id: 4, nombre: "Punto de Venta 4" }
    ]
};
```

### Permisos de Usuario
- **admin**: Acceso completo a ambas herramientas
- **operativo**: Acceso completo a ambas herramientas
- **usuario**: Sin acceso
- **develop**: Sin acceso

---

## 📋 Casos de Uso

### Surtido Diario
1. **Análisis de Ventas**: Revisar productos más vendidos por sede y punto de venta
2. **Control de Inventario**: Identificar productos con mayor rotación
3. **Reportes Gerenciales**: Generar reportes de ventas diarias
4. **Impresión de Surtido**: Crear listas para reposición de inventario

### Surtido Compras
1. **Control de Compras**: Revisar compras recientes por proveedor
2. **Selección de Productos**: Elegir productos específicos para análisis
3. **Impresión de Listas**: Generar listas de productos para verificación
4. **Análisis de Proveedores**: Evaluar productos por proveedor

---

## 🔍 Solución de Problemas

### Errores Comunes
1. **"Por favor selecciona primero una sede"**
   - Solución: Seleccionar sede antes de continuar

2. **"Error al cargar datos"**
   - Verificar que las APIs estén ejecutándose
   - Comprobar conectividad de base de datos
   - Revisar logs de las APIs

3. **"No hay datos para mostrar"**
   - Verificar parámetros de búsqueda
   - Comprobar que existan datos para la fecha/sede seleccionada

### Verificación de APIs
```bash
# Verificar API de Ventas
curl "http://localhost:3001/api/ventas-dia?fecha=2024-12-15&sede=manizales&headquarter_id=1"

# Verificar API de Compras
curl "http://localhost:3002/api/compras-recientes?sede=manizales&dias=30&limit=100"
```

---

## 📝 Notas de Desarrollo

### Cambios Recientes
- **Selección Obligatoria de Sede**: Ambas herramientas ahora requieren selección de sede como primer paso
- **Impresión POS 80mm en Surtido Compras**: Nueva funcionalidad de impresión con formato específico
- **Validaciones Mejoradas**: Mensajes de error más claros y específicos

### Estructura de Archivos
```
multifamiliar-tools/
├── surtido-diario.html          # Herramienta de ventas diarias
├── surtido-compras.html         # Herramienta de compras recientes
├── api-ventas-dia.js           # API para ventas del día
├── api-compras-recientes.js    # API para compras recientes
└── README-SURTIDOS.md          # Esta documentación
```

### Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Base de Datos**: PostgreSQL
- **Impresión**: CSS Print Media Queries
- **Formato**: JSON, POS 80mm
