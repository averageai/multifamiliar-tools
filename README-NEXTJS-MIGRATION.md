# Migración a Next.js - Multifamiliar Tools

## Resumen de Cambios

Se ha migrado el proyecto de APIs independientes (Express.js) a una estructura Next.js unificada para mejorar el despliegue en Vercel.

## Nueva Estructura

```
multifamiliar-tools/
├── src/
│   ├── pages/
│   │   ├── api/
│   │   │   ├── ventas-dia.js
│   │   │   ├── compras-recientes.js
│   │   │   ├── proveedores.js
│   │   │   └── generar-json-compras.js
│   │   ├── index.js
│   │   └── _app.js
│   └── styles/
│       └── globals.css
├── package.json
├── next.config.js
├── jsconfig.json
├── vercel.json
└── .gitignore
```

## APIs Migradas

### 1. `/api/ventas-dia`
- **Método**: GET
- **Parámetros**: `fecha`, `sede`, `headquarter_id` (opcional)
- **Función**: Lista productos vendidos por sede y punto de venta en una fecha específica

### 2. `/api/compras-recientes`
- **Método**: GET
- **Parámetros**: `sede`, `dias`, `provider_id` (opcional), `limit`
- **Función**: Obtiene compras recientes agrupadas por proveedor

### 3. `/api/proveedores`
- **Método**: GET
- **Parámetros**: `sede`
- **Función**: Lista proveedores con estadísticas de compras

### 4. `/api/generar-json-compras`
- **Método**: POST
- **Body**: Array de compras seleccionadas
- **Función**: Genera JSON con formato específico para impresión

## Configuración de Vercel

### vercel.json
- Configuración de builds para Next.js
- Variables de entorno para bases de datos
- Headers CORS para APIs
- Región de despliegue: `iad1`

### Variables de Entorno
```env
DB_HOST=5.161.103.230
DB_PORT=7717
DB_USER=vercel_user
DB_PASSWORD=non@ver@ge
DB_USER_MANIZALES=vercel_user
DB_PASSWORD_MANIZALES=non@ver@ge
DB_USER_LADORADA=vercel_user
DB_PASSWORD_LADORADA=non@ver@ge
DB_NAME_MANIZALES=crsitaleriamanizales_complete
DB_NAME_LADORADA=cristaleriaprod_complete
```

## Scripts Disponibles

```bash
npm run dev      # Desarrollo local
npm run build    # Construcción para producción
npm run start    # Iniciar servidor de producción
npm run lint     # Linting del código
```

## Herramientas Frontend

Las herramientas HTML (`surtido-diario.html`, `surtido-compras.html`) han sido actualizadas para usar las nuevas APIs:

- **API_BASE**: Cambiado a `window.location.origin`
- **Endpoints**: Actualizados para usar rutas `/api/*`
- **CORS**: Configurado automáticamente por Next.js

## Ventajas de la Migración

1. **Despliegue Simplificado**: Vercel maneja automáticamente las funciones serverless
2. **Mejor Performance**: Optimizaciones automáticas de Next.js
3. **Estructura Unificada**: Todas las APIs en un solo proyecto
4. **CORS Automático**: Configuración centralizada
5. **Variables de Entorno**: Gestión simplificada

## Notas Importantes

- Las herramientas HTML siguen funcionando como antes
- Las APIs mantienen la misma interfaz y respuestas
- El despliegue ahora es más confiable en Vercel
- Se eliminaron las dependencias de Express.js y CORS manual

## Troubleshooting

Si hay problemas de despliegue:

1. Verificar que todos los archivos estén en `src/pages/api/`
2. Confirmar que `package.json` tenga las dependencias correctas
3. Revisar que `vercel.json` no tenga configuraciones conflictivas
4. Verificar que las variables de entorno estén configuradas en Vercel
