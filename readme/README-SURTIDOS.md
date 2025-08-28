# 🛒 Herramientas de Surtido - Sistema Multifamiliar

Documentación completa para las herramientas de Surtido Diario y Surtido Compras del Sistema Multifamiliar.

## 📋 Índice

1. [Surtido Diario](#surtido-diario)
2. [Surtido Compras](#surtido-compras)
3. [APIs Requeridas](#apis-requeridas)
4. [Configuración](#configuración)
5. [Casos de Uso](#casos-de-uso)

---

## 📊 Surtido Diario

### Descripción
Herramienta para imprimir las ventas del día anterior en formato POS 80mm, organizadas por sede y punto de venta.

### Características
- **Formato POS 80mm**: Optimizado para impresoras térmicas
- **Multi-sede**: Soporte para Manizales y La Dorada
- **Filtros por punto de venta**: Selección específica de headquarters
- **Estadísticas en tiempo real**: Contadores de productos y cantidades
- **Vista previa de impresión**: Antes de imprimir
- **Exportación JSON**: Para uso posterior

### Funcionalidades

#### 1. Configuración de Impresión
- **Fecha de Ventas**: Selección de fecha específica (por defecto día anterior)
- **Sede**: Manizales o La Dorada
- **Punto de Venta**: Headquarters específicos por sede

#### 2. Estadísticas de Ventas
- Total de productos vendidos
- Cantidad total de unidades
- Número de proveedores involucrados

#### 3. Datos de Ventas
- Tabla organizada con código, producto, cantidad y punto de venta
- Ordenamiento alfabético por código interno
- Agrupación por sede y headquarters

#### 4. Vista Previa de Impresión
- Formato POS 80mm simulado
- Encabezado con fecha y sede
- Lista de productos con códigos y cantidades
- Pie de página con totales

### Uso

1. **Acceder a la herramienta**: Desde el Hub principal → Surtido Diario
2. **Configurar parámetros**:
   - Seleccionar fecha de ventas
   - Elegir sede (Manizales/La Dorada)
   - Seleccionar punto de venta específico
3. **Cargar datos**: Hacer clic en "Cargar Ventas del Día"
4. **Revisar estadísticas**: Ver contadores en tiempo real
5. **Imprimir**: Usar "Imprimir Surtido" para impresora POS
6. **Exportar**: Descargar JSON si es necesario

---

## 🛒 Surtido Compras

### Descripción
Herramienta para seleccionar compras recientes y generar JSON personalizado para impresión.

### Características
- **Selección múltiple**: Checkboxes para cada compra
- **Filtros avanzados**: Por sede, días, proveedor y límite
- **Agrupación por proveedor**: Organización visual mejorada
- **Generación de JSON**: Formato específico para impresión
- **Controles de selección**: Seleccionar/deseleccionar todo

### Funcionalidades

#### 1. Configuración de Búsqueda
- **Sede**: Manizales o La Dorada
- **Días hacia atrás**: Rango de 1-365 días (default: 30)
- **Proveedor**: Filtro opcional por proveedor específico
- **Límite de resultados**: Máximo 1000 registros

#### 2. Estadísticas de Compras
- Total de compras encontradas
- Compras seleccionadas actualmente
- Número de proveedores involucrados

#### 3. Datos de Compras
- **Agrupación por proveedor**: Cada proveedor en un grupo colapsable
- **Información detallada**: Factura, fecha, producto, código, cantidad, precio
- **Controles de selección**:
  - ✅ Seleccionar Todos
  - ❌ Deseleccionar Todos
  - 🏢 Seleccionar por Proveedor

#### 4. Generación de JSON
- **Vista previa**: JSON formateado antes de descargar
- **Formato específico**: Proveedor, producto (25 chars), código interno
- **Descarga**: Archivo JSON con timestamp

### Uso

1. **Acceder a la herramienta**: Desde el Hub principal → Surtido Compras
2. **Configurar búsqueda**:
   - Seleccionar sede
   - Definir días hacia atrás
   - Opcional: filtrar por proveedor
   - Establecer límite de resultados
3. **Cargar compras**: Hacer clic en "Cargar Compras Recientes"
4. **Seleccionar compras**:
   - Usar checkboxes individuales
   - Usar controles masivos (todos, por proveedor)
5. **Generar JSON**: Hacer clic en "Generar JSON"
6. **Descargar**: Guardar archivo JSON

---

## 🔌 APIs Requeridas

### API de Ventas por Día (Puerto 3001)
```bash
# Endpoint principal
GET /api/ventas-dia?fecha=YYYY-MM-DD&sede=manizales&headquarter_id=3

# Respuesta esperada
{
  "success": true,
  "data": {
    "manizales": {
      "MI HOGAR": [
        {
          "codigo": "001",
          "nombre": "Producto Ejemplo",
          "cantidad": 5
        }
      ]
    }
  }
}
```

### API de Compras Recientes (Puerto 3002)
```bash
# Endpoint de compras
GET /api/compras-recientes?sede=manizales&dias=30&limit=100

# Endpoint de proveedores
GET /api/proveedores?sede=manizales

# Endpoint de generación JSON
POST /api/generar-json-compras
{
  "compras_seleccionadas": [...]
}
```

---

## ⚙️ Configuración

### Puertos de APIs
- **API Ventas por Día**: `http://localhost:3001`
- **API Compras Recientes**: `http://localhost:3002`

### Headquarter IDs por Sede

#### Manizales
- `3`: MI HOGAR
- `1`: MULTIFAMILIAR 2
- `2`: BODEGA

#### La Dorada
- `6`: CRISTALERIA MI HOGAR
- `3`: SURTITODO
- `2`: CRISTALERIA MULTIFAMILIAR
- `5`: CRISTALERIA MULTIFAMILIAR 2

### Permisos de Usuario
- **Administrador**: Acceso completo a ambas herramientas
- **Operativo**: Acceso completo a ambas herramientas
- **Usuario**: Sin acceso
- **Desarrollador**: Sin acceso (solo APIs)

---

## 📈 Casos de Uso

### Surtido Diario

#### Caso 1: Impresión Diaria de Ventas
1. **Objetivo**: Imprimir surtido para reposición diaria
2. **Proceso**:
   - Seleccionar fecha del día anterior
   - Elegir sede y punto de venta
   - Cargar datos
   - Imprimir en formato POS 80mm
3. **Resultado**: Lista de productos vendidos para reposición

#### Caso 2: Análisis de Ventas por Sede
1. **Objetivo**: Comparar ventas entre sedes
2. **Proceso**:
   - Cargar datos para cada sede
   - Revisar estadísticas
   - Exportar JSON para análisis
3. **Resultado**: Datos estructurados para análisis

### Surtido Compras

#### Caso 1: Selección de Compras por Proveedor
1. **Objetivo**: Generar surtido para un proveedor específico
2. **Proceso**:
   - Filtrar por proveedor
   - Seleccionar compras relevantes
   - Generar JSON personalizado
3. **Resultado**: Lista de productos por proveedor

#### Caso 2: Análisis de Compras Recientes
1. **Objetivo**: Revisar patrones de compra
2. **Proceso**:
   - Cargar compras de últimos 30 días
   - Agrupar por proveedor
   - Seleccionar compras representativas
   - Exportar para análisis
3. **Resultado**: Datos de compras para análisis

---

## 🔧 Solución de Problemas

### Error de Conexión a API
```
❌ Error: Failed to fetch
```
**Solución**: Verificar que las APIs estén ejecutándose en los puertos correctos

### No se Cargan Datos
```
⚠️ No hay ventas/compras para mostrar
```
**Solución**: 
- Verificar fecha seleccionada
- Comprobar sede y punto de venta
- Revisar conexión a base de datos

### Error de Impresión
```
⚠️ No hay datos para imprimir
```
**Solución**: Asegurar que se hayan cargado datos antes de imprimir

---

## 📞 Soporte

Para soporte técnico o preguntas sobre las herramientas de Surtido:
- **Email**: weare.average.ai@gmail.com
- **Desarrollador**: Sistema Multifamiliar
- **Versión**: 1.0.0

---

## 🔄 Actualizaciones

### v1.0.0 (Actual)
- ✅ Surtido Diario con formato POS 80mm
- ✅ Surtido Compras con selección múltiple
- ✅ Integración con APIs JSON
- ✅ Interfaz consistente con cierre-caja
- ✅ Permisos de usuario configurados
- ✅ Documentación completa
