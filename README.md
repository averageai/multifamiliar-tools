# Hub de Herramientas Multifamiliar

Sistema integrado de herramientas administrativas y operativas con control de acceso.

## 🚀 Características

- **Control de Acceso**: Sistema de login con diferentes niveles de usuario
- **Dashboard Moderno**: Interfaz intuitiva y responsiva
- **Herramientas Integradas**: Acceso centralizado a todas las herramientas
- **Diseño Responsivo**: Funciona en dispositivos móviles y de escritorio

## 👥 Usuarios y Permisos

### Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Acceso**: Todas las herramientas

### Operativo
- **Usuario**: `operativo`
- **Contraseña**: `operativo123`
- **Acceso**: Solo Sistema de Precios

### Usuario
- **Usuario**: `usuario`
- **Contraseña**: `usuario123`
- **Acceso**: Solo Control de Inventarios

## 🛠️ Herramientas Disponibles

### 1. Control de Inventarios (Administrativo)
- **Archivo**: `Control de Inventarios (Administrativo).html`
- **Función**: Sistema de redistribución de inventario entre bodegas
- **Características**:
  - Optimización automática de stock
  - Generación de reportes de traslados
  - Detección de productos sin stock
  - Exportación a Excel

### 2. Sistema de Precios (Operativo)
- **Archivo**: `Sistema de Precios Afectados (Operativo).html`
- **Función**: Consulta de precios y márgenes
- **Características**:
  - Control de precios de referencia
  - Identificación de productos nuevos
  - Generación de listas para impresora POS
  - Exportación de reportes

## 📁 Estructura del Proyecto

```
multifamiliar-tools/
├── index.html                                    # Hub principal con login
├── config.js                                     # Configuración con variables de entorno
├── Control de Inventarios (Administrativo).html  # Herramienta de inventarios
├── Sistema de Precios Afectados (Operativo).html # Herramienta de precios
├── vercel.json                                   # Configuración de Vercel
├── package.json                                  # Configuración del proyecto
└── README.md                                     # Este archivo
```

## 🚀 Cómo Usar

1. **Abrir el Hub**: Abre `index.html` en tu navegador
2. **Iniciar Sesión**: Usa las credenciales correspondientes a tu rol
3. **Acceder a Herramientas**: Haz clic en la herramienta que necesites
4. **Cerrar Sesión**: Usa el botón "Cerrar Sesión" cuando termines

## 🚀 Despliegue en Vercel

### **Opción 1: Despliegue Automático (Recomendado)**

1. **Subir a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Hub de Herramientas Multifamiliar"
   git push origin main
   ```

2. **Conectar con Vercel:**
   - Ir a [vercel.com](https://vercel.com)
   - Importar proyecto desde GitHub
   - Configurar variables de entorno (opcional)

### **Opción 2: Despliegue Manual**

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Desplegar:**
   ```bash
   vercel --prod
   ```

### **Variables de Entorno (Opcional)**

En Vercel Dashboard → Settings → Environment Variables:

```env
NODE_ENV=production
JWT_SECRET=tu-secreto-super-seguro
ADMIN_PASSWORD=tu-contraseña-admin
OPERATIVO_PASSWORD=tu-contraseña-operativo
USUARIO_PASSWORD=tu-contraseña-usuario
```

## 📱 Compatibilidad

- ✅ Chrome (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Dispositivos móviles

## 🔒 Seguridad

**Nota**: Este es un sistema de demostración. En un entorno de producción:
- Las credenciales deberían estar en un servidor
- Usar HTTPS para conexiones seguras
- Implementar autenticación de dos factores
- Usar bases de datos para almacenar usuarios

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisa la documentación de cada herramienta
- Verifica que los archivos estén completos
- Asegúrate de usar un navegador actualizado

## 🎯 Funcionalidades Principales

### Hub Principal
- ✅ Login seguro con validación
- ✅ Dashboard responsivo
- ✅ Control de sesión persistente
- ✅ Navegación intuitiva

### Control de Inventarios
- ✅ Carga de archivos Excel
- ✅ Análisis automático de bodegas
- ✅ Generación de traslados optimizados
- ✅ Reportes detallados

### Sistema de Precios
- ✅ Búsqueda de productos
- ✅ Control de márgenes
- ✅ Generación de listas POS
- ✅ Exportación de reportes

---

**Desarrollado por Humanos + IA en average** 