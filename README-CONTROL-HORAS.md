# 🕐 Sistema de Control de Horas Multi-Sede

Sistema completo de registro de entrada y salida de empleados con soporte multi-sede y base de datos PostgreSQL.

## 🚀 Características

- **Multi-Sede**: Soporte para Manizales y Dorada
- **Base de Datos PostgreSQL**: Persistencia completa de datos
- **API REST**: Backend con Express.js
- **Interfaz Moderna**: Diseño consistente con el sistema existente
- **Estadísticas en Tiempo Real**: Cálculo automático de horas trabajadas
- **Exportación de Reportes**: Formato POS 80mm y archivos de texto
- **Validaciones Robustas**: Prevención de errores y duplicados

## 📋 Requisitos Previos

- **Node.js** (versión 14 o superior)
- **PostgreSQL** (versión 12 o superior)
- **npm** o **yarn**

## 🛠️ Instalación

### 1. Clonar/Descargar el Proyecto

```bash
# Si tienes el proyecto completo
cd multifamiliar-tools
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Base de Datos PostgreSQL

#### Crear Base de Datos
```sql
CREATE DATABASE multifamiliar_tools;
```

#### Configurar Conexión
Editar el archivo `db-config.js`:

```javascript
const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'multifamiliar_tools',
    user: 'postgres',
    password: 'tu_password_aqui', // Cambiar por tu contraseña real
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
```

#### Ejecutar Esquema de Base de Datos
```bash
npm run db:setup
```

O manualmente:
```bash
psql -U postgres -d multifamiliar_tools -f database-schema.sql
```

### 4. Iniciar el Servidor

```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## 📊 Estructura de la Base de Datos

### Tablas Principales

#### `sedes`
- `id`: Identificador único
- `nombre`: Nombre de la sede (Manizales, Dorada)
- `codigo`: Código corto (MAN, DOR)
- `activa`: Estado de la sede

#### `empleados`
- `id`: Identificador único
- `documento`: Número de documento (único)
- `nombre`: Nombre completo del empleado
- `sede_id`: Referencia a la sede
- `activo`: Estado del empleado

#### `registros_horas`
- `id`: Identificador único
- `empleado_id`: Referencia al empleado
- `sede_id`: Referencia a la sede
- `fecha_entrada`: Fecha de entrada
- `hora_entrada`: Timestamp de entrada
- `fecha_salida`: Fecha de salida (opcional)
- `hora_salida`: Timestamp de salida (opcional)
- `duracion_horas`: Duración calculada automáticamente
- `estado`: activo, finalizado, forzado

### Vistas y Funciones

- **`registros_completos`**: Vista con información completa de registros
- **`obtener_estadisticas_sede()`**: Función para calcular estadísticas por sede
- **Triggers automáticos**: Cálculo de duración y timestamps

## 🔧 API Endpoints

### Sedes
- `GET /api/sedes` - Obtener todas las sedes activas

### Empleados
- `GET /api/empleados/:documento` - Obtener empleado por documento
- `POST /api/empleados` - Crear nuevo empleado

### Registros
- `GET /api/registros/:sede_id/:fecha` - Obtener registros del día por sede
- `GET /api/registros/activo/:documento` - Obtener registro activo de empleado
- `POST /api/registros/entrada` - Registrar entrada
- `PUT /api/registros/:id/salida` - Registrar salida
- `PUT /api/registros/:id/forzar` - Forzar salida
- `POST /api/registros/finalizar-jornada` - Finalizar jornada para toda la sede

### Estadísticas
- `GET /api/estadisticas/:sede_id/:fecha` - Obtener estadísticas del día

## 🎯 Uso del Sistema

### 1. Seleccionar Sede
- Al abrir la aplicación, seleccionar entre Manizales o Dorada
- El sistema cargará automáticamente los datos de la sede seleccionada

### 2. Registrar Entrada
- Ingresar documento de identidad
- Ingresar nombre completo (si es nuevo empleado)
- Hacer clic en "Registrar Entrada"

### 3. Registrar Salida
- Ingresar solo el documento de identidad
- Hacer clic en "Registrar Salida"
- El sistema calculará automáticamente la duración

### 4. Funciones Administrativas
- **Forzar Salida**: Para empleados que olvidan registrar salida
- **Finalizar Jornada**: Cierra todas las sesiones activas de la sede
- **Exportar Registros**: Genera reporte en formato POS 80mm
- **Cambiar Sede**: Permite cambiar entre sedes

## 📈 Estadísticas Disponibles

- **Total de registros** del día
- **Empleados activos** actualmente
- **Horas totales** trabajadas
- **Promedio de horas** por empleado

## 🔒 Validaciones y Seguridad

- **Prevención de duplicados**: No permite múltiples sesiones activas
- **Validación de empleados**: Verifica existencia antes de crear registros
- **Cálculo automático**: Duración calculada por la base de datos
- **Estados de registro**: activo, finalizado, forzado

## 📱 Características Técnicas

- **Responsive Design**: Funciona en dispositivos móviles
- **Tiempo Real**: Reloj actualizado cada segundo
- **Persistencia**: Datos guardados en PostgreSQL
- **API REST**: Backend escalable
- **Exportación**: Reportes en formato POS 80mm

## 🚨 Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar configuración en db-config.js
# Asegurar que la contraseña sea correcta
```

### Error de Puerto en Uso
```bash
# Cambiar puerto en server.js
const port = process.env.PORT || 3001;
```

### Problemas de Permisos
```bash
# Dar permisos al usuario de PostgreSQL
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE multifamiliar_tools TO tu_usuario;
```

## 🔄 Actualizaciones Futuras

- [ ] Dashboard de estadísticas históricas
- [ ] Reportes por rangos de fechas
- [ ] Integración con sistemas de nómina
- [ ] Notificaciones automáticas
- [ ] App móvil nativa

## 📞 Soporte

Para soporte técnico o reportar problemas:
- **Email**: weare.average.ai@gmail.com
- **Desarrollado por**: Humanos + IA en [average](https://ai.average.lat)

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Compatibilidad**: Node.js 14+, PostgreSQL 12+
