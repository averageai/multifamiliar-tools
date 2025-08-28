# Registro de Cambios - Sistema Multifamiliar

## [2024-01-15] - Corrección de Fecha en Permisos de Salida

### Problema Identificado
- **Archivo**: `permisos-salida.html`
- **Función**: `formatearFecha()`
- **Descripción**: Al imprimir permisos de salida, la fecha mostrada era del día anterior al ingresado en el formulario

### Causa Raíz
La función `formatearFecha()` creaba un objeto `Date` a partir de una fecha string sin especificar la zona horaria, causando que JavaScript interpretara la fecha en UTC y luego la convirtiera a la zona horaria local, resultando en un día anterior.

### Solución Implementada
- Modificada la función `formatearFecha()` para manejar correctamente las fechas en formato YYYY-MM-DD
- Agregada validación para asegurar que la fecha se interprete en la zona horaria local
- Implementado manejo de errores para fechas inválidas

### Archivos Modificados
- `multifamiliar-tools/permisos-salida.html` (líneas 846-853)

### Estado
- ✅ Problema identificado
- ✅ Solución implementada
- ✅ Código corregido
- ⏳ Pendiente: Pruebas de validación
