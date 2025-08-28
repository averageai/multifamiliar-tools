# APIs de Surtido - Sistema Multifamiliar

## Descripción

Este documento describe las APIs de Next.js implementadas para las herramientas de Surtido Diario y Surtido Compras, siguiendo el patrón de implementación del proyecto `stock-analisis`.

## 🏗️ Arquitectura

### Tecnologías Utilizadas
- **Next.js 14**: Framework para APIs serverless
- **PostgreSQL**: Base de datos con conexiones SSL
- **Vercel**: Plataforma de despliegue
- **CORS**: Configurado para acceso desde cualquier origen

### Estructura de Archivos
```
multifamiliar-tools/
├── src/
│   └── pages/
│       └── api/
│           ├── ventas-dia.js           # API de ventas del día
│           ├── compras-recientes.js    # API de compras recientes
│           ├── proveedores.js          # API de proveedores
│           └── generar-json-compras.js # API para generar JSON
├── vercel.json                         # Configuración de Vercel
├── next.config.js                      # Configuración de Next.js
└── package.json                        # Dependencias del proyecto
```

## 🔧 APIs Implementadas

### 1. **API de Ventas del Día**
- **Endpoint**: `GET /api/ventas-dia`
- **Descripción**: Obtiene ventas agrupadas por punto de venta para una fecha específica
- **Parámetros**:
  - `fecha` (requerido): Fecha en formato YYYY-MM-DD
  - `sede` (requerido): "manizales" o "ladorada"
  - `headquarter_id` (opcional): ID específico del punto de venta

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": {
    "manizales": {
      "MI HOGAR": [
        {
          "codigo": "001",
          "nombre": "Producto A",
          "cantidad": 5
        }
      ]
    }
  },
  "metadata": {
    "sede": "manizales",
    "fecha": "2024-12-15",
    "total_headquarters": 1,
    "total_productos": 1
  }
}
```

### 2. **API de Compras Recientes**
- **Endpoint**: `GET /api/compras-recientes`
- **Descripción**: Obtiene compras recientes agrupadas por proveedor
- **Parámetros**:
  - `sede` (requerido): "manizales" o "ladorada"
  - `dias` (opcional): Número de días hacia atrás (default: 30)
  - `provider_id` (opcional): ID específico del proveedor
  - `limit` (opcional): Límite de resultados (default: 100)

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": {
    "manizales": {
      "Proveedor A": {
        "provider_id": 1,
        "provider_name": "Proveedor A",
        "compras": [
          {
            "id": 1,
            "codigo": "001",
            "nombre": "Producto A",
            "cantidad": 10,
            "costo": 100.50,
            "fecha_compra": "2024-12-15T10:30:00Z"
          }
        ]
      }
    }
  },
  "metadata": {
    "sede": "manizales",
    "dias": 30,
    "total_proveedores": 1,
    "total_compras": 1
  }
}
```

### 3. **API de Proveedores**
- **Endpoint**: `GET /api/proveedores`
- **Descripción**: Obtiene lista de proveedores con estadísticas
- **Parámetros**:
  - `sede` (requerido): "manizales" o "ladorada"

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": {
    "manizales": [
      {
        "id": 1,
        "name": "Proveedor A",
        "total_facturas": 5,
        "productos_comprados": 25,
        "ultima_compra": "2024-12-15T10:30:00Z"
      }
    ]
  },
  "metadata": {
    "sede": "manizales",
    "total_proveedores": 1,
    "total_facturas": 5
  }
}
```

### 4. **API para Generar JSON de Compras**
- **Endpoint**: `POST /api/generar-json-compras`
- **Descripción**: Genera JSON estructurado de compras seleccionadas
- **Body**:
  ```json
  {
    "compras_seleccionadas": [
      {
        "proveedor": "Proveedor A",
        "nombre": "Producto A",
        "codigo": "001"
      }
    ]
  }
  ```

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": {
    "compras_por_proveedor": {
      "Proveedor A": [
        {
          "producto": "Producto A",
          "codigo_interno": "001"
        }
      ]
    },
    "lista_plana": [
      {
        "proveedor": "Proveedor A",
        "producto": "Producto A",
        "codigo_interno": "001"
      }
    ]
  },
  "metadata": {
    "total_compras": 1,
    "total_proveedores": 1,
    "timestamp": "2024-12-15T10:30:00Z"
  }
}
```

## ⚙️ Configuración

### Variables de Entorno (Vercel)
```env
DB_HOST=5.161.103.230
DB_PORT=7717
DB_USER_MANIZALES=vercel_user
DB_PASSWORD_MANIZALES=non@ver@ge
DB_USER_LADORADA=vercel_user
DB_PASSWORD_LADORADA=non@ver@ge
DB_NAME_MANIZALES=crsitaleriamanizales_complete
DB_NAME_LADORADA=cristaleriaprod_complete
```

### Configuración de Base de Datos
- **Host**: 5.161.103.230
- **Puerto**: 7717
- **SSL**: Habilitado con `rejectUnauthorized: false`
- **Connection Pool**: Configurado para máximo 1 conexión por función
- **Timeout**: 30 segundos para consultas, 2 segundos para conexión

## 🚀 Despliegue

### Comandos de Desarrollo
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

### Despliegue en Vercel
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

## 🔍 Monitoreo y Logs

### Logs de Debug
Todas las APIs incluyen logs detallados:
- `[DEBUG]`: Información de consultas y resultados
- `[API]`: Información de solicitudes y respuestas
- `Error`: Errores detallados con stack trace

### Métricas de Rendimiento
- **maxDuration**: Configurado en `vercel.json`
- **Connection Pool**: Optimizado para serverless
- **Query Optimization**: Consultas optimizadas con índices

## 🛡️ Seguridad

### CORS
- Configurado para permitir acceso desde cualquier origen
- Headers de seguridad implementados
- Preflight requests manejados correctamente

### Validación de Entrada
- Validación de parámetros requeridos
- Validación de tipos de datos
- Sanitización de entrada SQL

### Manejo de Errores
- Errores HTTP apropiados (400, 405, 500)
- Mensajes de error descriptivos
- Logs de error para debugging

## 📊 Headquarter IDs

### Manizales
- `3`: MI HOGAR
- `1`: MULTIFAMILIAR 2
- `2`: BODEGA

### La Dorada
- `6`: CRISTALERIA MI HOGAR
- `3`: SURTITODO
- `2`: CRISTALERIA MULTIFAMILIAR
- `5`: CRISTALERIA MULTIFAMILIAR 2

## 🔄 Migración desde APIs Antiguas

### Cambios Principales
1. **Arquitectura**: De Express.js a Next.js API Routes
2. **Despliegue**: De servidores independientes a serverless functions
3. **Configuración**: Variables de entorno centralizadas
4. **URLs**: APIs ahora en el mismo dominio que las herramientas

### URLs Actualizadas
- **Antes**: `http://localhost:3001/api/ventas-dia`
- **Ahora**: `/api/ventas-dia` (mismo dominio)

### Compatibilidad
- Las herramientas HTML ya están actualizadas
- No se requieren cambios en el frontend
- Respuestas JSON mantienen la misma estructura

## 📝 Notas de Desarrollo

### Patrón de Implementación
Seguido el patrón exitoso de `stock-analisis`:
- Configuración de base de datos idéntica
- Manejo de errores consistente
- Estructura de respuesta estandarizada
- Logs y debugging similares

### Optimizaciones
- Connection pooling optimizado para serverless
- Queries optimizadas con índices apropiados
- Timeouts configurados para evitar bloqueos
- CORS configurado para acceso universal

### Próximos Pasos
- Implementar cache para consultas frecuentes
- Agregar autenticación si es necesario
- Implementar rate limiting
- Agregar métricas de uso
