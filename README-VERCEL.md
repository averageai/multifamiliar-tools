# 🚀 Deployment en Vercel - Control de Horas

## Configuración para Vercel

### 1. Variables de Entorno

En Vercel, necesitas configurar las siguientes variables de entorno:

```bash
# Base de datos PostgreSQL
DATABASE_URL=postgresql://average:nonaverage@panel.hub.average.lat:7118/faltantes

# O configuración individual
DB_HOST=panel.hub.average.lat
DB_PORT=7118
DB_NAME=faltantes
DB_USER=average
DB_PASSWORD=nonaverage
```

### 2. Configuración del Proyecto

El proyecto está configurado para funcionar en Vercel con:

- **`vercel.json`**: Configuración de rutas y build
- **`server.js`**: Servidor Node.js con Express
- **`package.json`**: Dependencias y scripts

### 3. Pasos para Deployment

1. **Conectar repositorio a Vercel**:
   ```bash
   vercel --prod
   ```

2. **Configurar variables de entorno** en el dashboard de Vercel

3. **Deploy automático** en cada push a main

### 4. URLs del Sistema

- **Dashboard principal**: `https://tu-proyecto.vercel.app/`
- **Control de horas**: `https://tu-proyecto.vercel.app/control-horas`
- **API**: `https://tu-proyecto.vercel.app/api/`

### 5. Estructura de la Base de Datos

Asegúrate de que las tablas estén creadas en PostgreSQL:

```sql
-- Ejecutar database-schema.sql en tu base de datos
```

### 6. Funcionalidades

✅ **Validación de empleados**: Solo documento → validar → mostrar nombre  
✅ **Control de entrada/salida**: Basado en estado de sesión  
✅ **Multi-sede**: Selector de sede antes de operaciones  
✅ **Persistencia**: Base de datos PostgreSQL  
✅ **Exportación**: Registros en formato texto  

### 7. Troubleshooting

**Error de conexión a BD**:
- Verificar variables de entorno
- Comprobar acceso a PostgreSQL desde Vercel

**Error 404 en rutas**:
- Verificar `vercel.json`
- Comprobar rutas en `server.js`

**Error de CORS**:
- Configuración ya incluida en `server.js`

### 8. Monitoreo

- **Logs**: Dashboard de Vercel
- **Métricas**: Analytics de Vercel
- **Errores**: Function logs en tiempo real
