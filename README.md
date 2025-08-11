# 🛡️ SISTEMA MULTIFAMILIAR TOOLS - DOCUMENTACIÓN COMPLETA

## ⚠️ ARCHIVOS CRÍTICOS DEL SISTEMA - NO MODIFICAR SIN AUTORIZACIÓN

### 🚨 ARCHIVOS PROTEGIDOS

#### 1. `server.js` - SERVIDOR PRINCIPAL
- **Función**: Servidor Express que maneja todas las rutas y APIs
- **Protección**: Comentarios de advertencia al inicio
- **Modificación**: Solo agregar rutas en `appRoutes`, NO modificar estructura base
- **Riesgo**: Romper todo el sistema si se modifica incorrectamente

#### 2. `db-config.js` - CONFIGURACIÓN DE BASE DE DATOS
- **Función**: Conexión PostgreSQL y queries SQL
- **Protección**: Comentarios de advertencia al inicio
- **Modificación**: Solo agregar queries en objeto `queries`
- **Riesgo**: Perder conexión a base de datos

#### 3. `vercel.json` - CONFIGURACIÓN DE DEPLOYMENT
- **Función**: Configuración de Vercel para deployment
- **Protección**: Documentación en este README
- **Modificación**: Solo agregar rutas específicas
- **Riesgo**: Romper deployment en producción

#### 4. `index.html` - HUB PRINCIPAL
- **Función**: Página principal con autenticación y navegación
- **Protección**: Sistema de permisos y autenticación
- **Modificación**: Solo agregar nuevas herramientas en `routes`
- **Riesgo**: Romper autenticación y navegación

### 🔒 SISTEMA DE PROTECCIÓN

#### Autenticación y Permisos
```javascript
// Configuración en index.html
const authConfig = {
    'admin': { permissions: ['spav2', 'control-horas', ...] },
    'operativo': { permissions: ['spav2', 'control-horas', ...] },
    'usuario': { permissions: ['validador-v2-conectado'] }
};
```

#### Rutas Protegidas
- Todas las rutas van a `server.js` para control centralizado
- Sistema de logging para debugging
- Manejo de errores global

#### Base de Datos
- Conexión SSL deshabilitada para compatibilidad
- Pool de conexiones con timeout
- Queries preparadas para seguridad

### ⚡ PARA AGREGAR NUEVAS APLICACIONES

#### Paso 1: Crear el archivo HTML
```html
<!-- nueva-app.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Nueva Aplicación</title>
</head>
<body>
    <!-- Contenido de la aplicación -->
</body>
</html>
```

#### Paso 2: Agregar ruta en `server.js`
```javascript
// En appRoutes (línea ~84)
const appRoutes = {
    // ... rutas existentes
    '/nueva-app': 'nueva-app.html'  // ← AGREGAR AQUÍ
};
```

#### Paso 3: Agregar ruta en `vercel.json`
```json
{
  "routes": [
    // ... rutas existentes
    {
      "src": "/nueva-app",
      "dest": "/server.js"
    }
  ]
}
```

#### Paso 4: Agregar en `index.html` (opcional)
```javascript
// En routes (línea ~900)
const routes = {
    // ... rutas existentes
    '/nueva-app': 'nueva-app.html'  // ← AGREGAR AQUÍ
};
```

### 🚫 LO QUE NO SE DEBE MODIFICAR

#### Estructura Base del Servidor
- Middleware de Express
- Configuración de CORS
- Manejo de errores global
- Pool de conexiones PostgreSQL

#### Configuración de Base de Datos
- Parámetros de conexión
- Configuración SSL
- Estructura de pool

#### Sistema de Autenticación
- Lógica de verificación de credenciales
- Sistema de permisos
- Manejo de sesiones

### 🔍 DEBUGGING Y MONITOREO

#### Endpoints de Debug
- `/api/health` - Estado del servidor y base de datos
- `/api/debug/files` - Archivos HTML disponibles
- `/api/debug/routes` - Rutas registradas

#### Logs del Sistema
- Logging detallado en consola
- Errores de base de datos
- Rutas accedidas

### 🚀 CONFIGURACIÓN DE DEPLOYMENT - VERCEL

#### Configuración Vital
- **Build**: `@vercel/node` para `server.js`
- **Entorno**: `production`
- **Todas las rutas van a `server.js`**

#### Variables de Entorno Requeridas
- `DATABASE_URL` o configuración individual de DB
- `NODE_ENV`: production
- `ADMIN_PASSWORD`: Contraseña del administrador
- `OPERATIVO_PASSWORD`: Contraseña del operativo
- `USUARIO_PASSWORD`: Contraseña del usuario

#### Estructura del Archivo vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    // Rutas específicas de aplicaciones
    // Ruta catch-all al final
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 🔐 CONFIGURACIÓN DE CREDENCIALES

#### Variables de Entorno de Autenticación
- `ADMIN_PASSWORD`: Contraseña para el usuario administrador
- `OPERATIVO_PASSWORD`: Contraseña para el usuario operativo
- `USUARIO_PASSWORD`: Contraseña para el usuario básico

#### Configuración en Vercel
1. Ir a Vercel Dashboard → Settings → Environment Variables
2. Agregar cada variable con su valor correspondiente
3. Reiniciar el deployment después de agregar variables

#### Estructura de Usuarios
```javascript
// Configuración en config.js
const credentials = {
    'admin': { permissions: ['inventarios', 'precios', 'control-horas'] },
    'operativo': { permissions: ['precios', 'control-horas'] },
    'usuario': { permissions: ['inventarios'] }
};
```

### 🗄️ CONFIGURACIÓN DE BASE DE DATOS

#### Variables de Entorno (Vercel)
- `DATABASE_URL`: Conexión completa (prioridad)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Individuales
- `NODE_ENV`: production/development
- `ADMIN_PASSWORD`: Contraseña del administrador
- `OPERATIVO_PASSWORD`: Contraseña del operativo
- `USUARIO_PASSWORD`: Contraseña del usuario

#### Tablas Principales
- `sedes`: Configuración de sedes (Manizales, Dorada)
- `empleados`: Empleados registrados
- `registros_horas`: Registros de entrada/salida

#### Queries Protegidas
- `getSedes`: Obtener sedes activas
- `getEmpleadoByDocumento`: Buscar empleado
- `getRegistrosHoy`: Registros del día
- `createRegistro`: Crear entrada
- `finalizarRegistro`: Finalizar salida

### 🎯 APLICACIONES ACTUALES

| Aplicación | URL | Descripción |
|------------|-----|-------------|
| Hub Principal | `/` | Página principal con autenticación |
| Control de Horas | `/control-horas` | Registro de entrada/salida |
| SPA V2 | `/spav2` | Sistema de precios afectados |
| Validador V2 | `/validadorv2` | Validación de productos |
| Control | `/control` | Control de inventarios |
| Códigos | `/codigos-disponibles` | Gestión de códigos |
| Cotizaciones | `/cotizaciones` | Sistema de cotizaciones |
| Cierre Caja | `/cierre-caja` | Control de cierre |
| Faltantes | `/faltantes` | Control de faltantes |
| Duplicados | `/duplicados` | Detección de duplicados |

### 📞 CONTACTO Y SOPORTE

Para modificaciones críticas del sistema:
1. **NO modificar archivos protegidos sin autorización**
2. **Seguir el proceso de agregar nuevas aplicaciones**
3. **Probar en desarrollo antes de producción**
4. **Contactar al administrador del sistema**

### 🛡️ ESTADO DEL SISTEMA: PROTEGIDO ✅

El sistema está completamente documentado y protegido para futuras modificaciones. 