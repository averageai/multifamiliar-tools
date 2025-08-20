# 🛡️ SISTEMA MULTIFAMILIAR TOOLS - DOCUMENTACIÓN COMPLETA

## 📋 **DESCRIPCIÓN DEL PROYECTO**

Sistema integral de herramientas administrativas y operativas para la gestión de inventarios, precios, control de horas y validación de productos en múltiples sedes (Manizales y Dorada).

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **Backend (Node.js + Express)**
- **Servidor**: `server.js` - Servidor principal con todas las rutas y APIs
- **Base de Datos**: PostgreSQL con configuración en `db-config.js`
- **Configuración**: Variables de entorno para credenciales y conexiones

### **Frontend (HTML + JavaScript)**
- **Hub Principal**: `index.html` - Página de autenticación y navegación
- **Aplicaciones**: Múltiples herramientas HTML independientes
- **Autenticación**: Sistema de roles y permisos integrado

## 🔧 **APLICACIONES DISPONIBLES**

### **🕐 Control de Horas** (`/control-horas`)
- Registro de entrada/salida de empleados
- Gestión de jornadas laborales
- Estadísticas en tiempo real
- Cierre automático de sesiones

### **📊 Gestión de Inventarios**
- **Control de Inventarios** (`/control`) - Gestión administrativa
- **Control v2** (`/controlv2`) - Versión mejorada
- **Faltantes** (`/faltantes`) - Identificación de productos faltantes
- **Duplicados** (`/duplicados`) - Detección de productos duplicados

### **💰 Gestión de Precios**
- **Sistema de Precios** (`/spa`) - Gestión general de precios
- **Sistema de Precios v2** (`/spav2`) - Versión mejorada
- **Precios Manizales** (`/spam`) - Gestión específica para Manizales

### **🔍 Validación y Escaneo**
- **Validador** (`/validador`) - Validación básica de productos
- **Validador v2** (`/validadorv2`) - Versión mejorada
- **Validador Conectado** (`/validadorc`) - Con integración de escáner

### **📋 Herramientas Adicionales**
- **Cierre de Caja** (`/cierre-caja`) - Gestión de cierre de caja
- **Permisos de Salida** (`/permisos-salida`) - Gestión de permisos
- **Cotizaciones** (`/cotizaciones`) - Generación de cotizaciones
- **Códigos Disponibles** (`/codigos-disponibles`) - Gestión de códigos

## 🔒 **SISTEMA DE AUTENTICACIÓN**

### **Roles de Usuario**
- **Administrador**: Acceso completo a todas las herramientas
- **Operativo**: Acceso a herramientas de precios y control de horas
- **Usuario**: Acceso limitado a inventarios y validación

### **Configuración de Credenciales**
Las credenciales se configuran mediante variables de entorno:
- `ADMIN_PASSWORD`
- `OPERATIVO_PASSWORD`
- `USUARIO_PASSWORD`

## 🗄️ **BASE DE DATOS**

### **Configuración PostgreSQL**
- Conexión configurada en `db-config.js`
- Timezone configurado para Colombia (America/Bogota)
- Pool de conexiones con timeout configurado

### **Tablas Principales**
- `sedes`: Configuración de sedes (Manizales, Dorada)
- `empleados`: Registro de empleados
- `registros_horas`: Registros de entrada/salida

## 🚀 **INSTALACIÓN Y DESPLIEGUE**

### **Requisitos**
- Node.js >= 14.0.0
- PostgreSQL
- Variables de entorno configuradas

### **Instalación Local**
```bash
npm install
npm run dev
```

### **Despliegue en Vercel**
- Configuración automática mediante `vercel.json`
- Variables de entorno configuradas en Vercel
- Rutas específicas mapeadas para cada aplicación

## 📁 **ESTRUCTURA DE ARCHIVOS**

```
multifamiliar-tools/
├── server.js              # Servidor principal
├── db-config.js           # Configuración de base de datos
├── config.js              # Configuración de credenciales
├── index.html             # Hub principal
├── package.json           # Dependencias y scripts
├── vercel.json            # Configuración de Vercel
├── README.md              # Esta documentación
└── [aplicaciones].html    # Archivos de aplicaciones
```

## 🔧 **CONFIGURACIÓN DE VARIABLES DE ENTORNO**

### **Base de Datos**
- `DATABASE_URL`: URL completa de conexión (prioridad)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Configuración individual

### **Autenticación**
- `ADMIN_PASSWORD`: Contraseña del administrador
- `OPERATIVO_PASSWORD`: Contraseña del operativo
- `USUARIO_PASSWORD`: Contraseña del usuario

### **Entorno**
- `NODE_ENV`: production/development
- `PORT`: Puerto del servidor (opcional, default: 3000)

## 🛠️ **MANTENIMIENTO Y ACTUALIZACIONES**

### **Agregar Nueva Aplicación**
1. Crear archivo HTML de la aplicación
2. Agregar ruta en `server.js` (appRoutes)
3. Agregar ruta en `vercel.json`
4. Opcional: Agregar enlace en `index.html`

### **Modificar Configuración**
- **Base de datos**: Editar `db-config.js`
- **Credenciales**: Configurar variables de entorno
- **Rutas**: Editar `server.js` y `vercel.json`

## 🚨 **ARCHIVOS CRÍTICOS - NO MODIFICAR SIN AUTORIZACIÓN**

- `server.js`: Estructura base del servidor
- `db-config.js`: Configuración de base de datos
- `vercel.json`: Configuración de deployment
- `index.html`: Sistema de autenticación

## 📞 **SOPORTE**

Para soporte técnico o modificaciones del sistema, contactar al equipo de desarrollo.

---

**Desarrollado por Humanos + IA en [average](https://ai.average.lat)** 