# 🆕 Nuevas Funcionalidades - Control de Horas

## 📋 Resumen de Cambios

Se han agregado dos funcionalidades importantes al sistema de Control de Horas:

1. **📅 Exportar registros de cualquier fecha específica**
2. **🕙 Cierre automático de sesiones a las 10:00 PM**

---

## 📅 Exportar Registros por Fecha Específica

### Funcionalidad
- Permite exportar registros de cualquier día específico, no solo del día actual
- Mantiene el mismo formato de exportación (archivo .txt para impresora POS 80mm)
- Incluye estadísticas completas de la fecha seleccionada

### Cómo usar
1. Selecciona una sede (Manizales o Dorada)
2. Haz clic en el botón **"📅 Exportar Fecha"**
3. Ingresa la contraseña: `admin123`
4. Ingresa la fecha en formato `YYYY-MM-DD` (ejemplo: `2024-01-15`)
5. El archivo se descargará automáticamente

### Características
- ✅ Validación de formato de fecha
- ✅ Verificación de contraseña
- ✅ Resumen por empleado con horas totales
- ✅ Estadísticas completas del día
- ✅ Formato compatible con impresora POS

---

## 🕙 Cierre Automático de Sesiones

### Funcionalidad
- Cierra automáticamente todas las sesiones activas a las 10:00 PM (22:00)
- Funciona para ambas sedes (Manizales y Dorada)
- Estado de sesión: `automatico` (para distinguir del cierre manual)

### Características
- ⏰ **Automático**: Se ejecuta automáticamente a las 10:00 PM
- 🔄 **Manual**: Botón para cerrar sesiones manualmente en cualquier momento
- 👥 **Visualización**: Modal para ver todas las sesiones activas
- 📊 **Logging**: Registro detallado de todas las operaciones

### Cómo usar

#### Cierre Manual
1. Selecciona una sede
2. Haz clic en **"👥 Sesiones Activas"**
3. Ingresa la contraseña: `admin123`
4. Revisa las sesiones activas
5. Haz clic en **"🕙 Cerrar Todas"** para cerrar manualmente

#### Cierre Automático
- Se ejecuta automáticamente a las 10:00 PM
- No requiere intervención manual
- Registra todas las operaciones en la consola

---

## 🔧 Nuevos Endpoints API

### Backend (server.js)
```javascript
// Obtener registros de fecha específica
GET /api/registros/fecha/:sede_id/:fecha

// Obtener estadísticas de fecha específica
GET /api/registros/estadisticas/:sede_id/:fecha

// Cerrar sesiones automáticamente
POST /api/registros/cerrar-sesiones-automaticas

// Obtener sesiones activas
GET /api/registros/sesiones-activas/:sede_id
```

### Base de Datos (db-config.js)
```sql
-- Nuevas consultas agregadas
getRegistrosPorFecha
getEstadisticasPorFecha
cerrarSesionesAutomaticas
getSesionesActivas
```

---

## 🎨 Nuevos Elementos de UI

### Botones Agregados
- **📅 Exportar Fecha**: Exportar registros de fecha específica
- **👥 Sesiones Activas**: Ver y gestionar sesiones activas

### Modales
- **Modal de Sesiones Activas**: Muestra todas las sesiones activas con detalles
- **Información detallada**: Empleado, documento, hora de entrada, duración

### Estilos CSS
- Nuevos estilos para el modal de sesiones activas
- Diseño responsivo y consistente con el tema existente

---

## 🚀 Script de Cierre Automático

### Archivo: `auto-close-sessions.js`
- Script independiente para cierre automático
- Verificación cada minuto
- Logging detallado
- Manejo de errores robusto

### Configuración
```javascript
const HORA_CIERRE = 22; // 10:00 PM
const MINUTO_CIERRE = 0;
const SEDES = [1, 2]; // Manizales y Dorada
```

### Ejecución
```bash
node auto-close-sessions.js
```

---

## 🔒 Seguridad

### Contraseñas Requeridas
- **Exportar Fecha**: `admin123`
- **Cerrar Sesiones**: `admin123`
- **Ver Sesiones Activas**: Sin contraseña (solo visualización)

### Validaciones
- ✅ Formato de fecha (YYYY-MM-DD)
- ✅ Existencia de registros
- ✅ Permisos de sede
- ✅ Manejo de errores

---

## 📊 Estados de Registro

### Nuevos Estados
- `automatico`: Sesión cerrada automáticamente a las 10:00 PM
- `forzado`: Sesión cerrada manualmente por administrador
- `finalizado`: Sesión cerrada normalmente por el empleado

---

## 🛠️ Instalación y Configuración

### Dependencias
```bash
npm install node-fetch
```

### Variables de Entorno
```bash
API_BASE=http://localhost:3000/api
```

### Verificación
1. Servidor funcionando en puerto 3000
2. Base de datos PostgreSQL conectada
3. Script de cierre automático ejecutándose (opcional)

---

## 📝 Logs y Monitoreo

### Logs del Servidor
```
📅 Obteniendo registros para sede: 1 fecha: 2024-01-15
📊 Obteniendo estadísticas para sede: 1 fecha: 2024-01-15
🕙 Cerrando sesiones automáticas para sede: 1
👥 Obteniendo sesiones activas para sede: 1
```

### Logs del Script Automático
```
🕙 [2024-01-15T22:00:00.000Z] Ejecutando cierre automático de sesiones
✅ [2024-01-15T22:00:01.000Z] 3 sesiones cerradas en sede 1
📊 [2024-01-15T22:00:02.000Z] Resumen: 5 sesiones cerradas en total
```

---

## 🔄 Compatibilidad

### Versiones Anteriores
- ✅ Totalmente compatible con funcionalidades existentes
- ✅ No afecta registros históricos
- ✅ Mantiene formato de exportación actual

### Navegadores
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Responsive design para móviles
- ✅ Funcionalidad offline limitada

---

## 📞 Soporte

### Problemas Comunes
1. **Error de contraseña**: Verificar que sea exactamente `admin123`
2. **Fecha inválida**: Usar formato YYYY-MM-DD
3. **Sin registros**: Verificar que existan registros para la fecha

### Contacto
- Email: weare.average.ai@gmail.com
- Desarrollado por: average.lat

---

## 🎯 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] Exportación a Excel (.xlsx)
- [ ] Reportes semanales/mensuales
- [ ] Notificaciones push
- [ ] Dashboard de estadísticas
- [ ] Integración con sistemas de nómina

### Optimizaciones
- [ ] Caché de consultas frecuentes
- [ ] Compresión de archivos de exportación
- [ ] Logs estructurados (JSON)
- [ ] Métricas de rendimiento
