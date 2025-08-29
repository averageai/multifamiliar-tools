# 📚 DOCUMENTACIÓN - VENTAS DIARIAS POS

## 📋 **DESCRIPCIÓN**

Esta carpeta contiene toda la documentación, scripts de validación y archivos de testing relacionados con el sistema de Ventas Diarias POS.

## 📁 **CONTENIDO**

### 🧪 **Scripts de Validación:**
- `validacion-headquarters.js` - Validación de relaciones entre tablas
- `validacion-final.js` - Validación completa del sistema
- `validacion-directa-postgres.js` - Comparación directa API vs PostgreSQL
- `test-html-api.js` - Test de integración HTML-API
- `diagnostico-fechas.js` - Diagnóstico de fechas disponibles
- `test-multi-entorno.js` - Test de compatibilidad multi-entorno

### 📚 **Documentación:**
- `VALIDACION_HEADQUARTERS.md` - Documentación de validación de headquarters
- `CORRECCION_HTML_VENTAS_DIARIAS.md` - Correcciones del HTML
- `CORRECCIONES_ZONA_HORARIA.md` - Correcciones de zona horaria
- `CORRECCION_CONSULTA_SQL.md` - Corrección de consulta SQL

## 🚀 **USO**

### **Para ejecutar validaciones:**
```bash
# Validación de headquarters
node validacion-headquarters.js

# Validación completa del sistema
node validacion-final.js

# Comparación directa con PostgreSQL
node validacion-directa-postgres.js

# Test de integración HTML-API
node test-html-api.js

# Diagnóstico de fechas
node diagnostico-fechas.js

# Test de compatibilidad multi-entorno
node test-multi-entorno.js

### **Para revisar documentación:**
- Abrir cualquier archivo `.md` para ver la documentación detallada
- Cada archivo contiene información específica sobre correcciones y validaciones

## 📊 **RESULTADOS DE VALIDACIÓN**

### ✅ **Datos Confirmados (28/08/2025):**
- **Manizales MULTIFAMILIAR 2**: 134 productos
- **Manizales MI HOGAR**: 55 productos
- **La Dorada SURTITODO**: 9 productos
- **La Dorada MULTIFAMILIAR**: 54 productos

### 🔍 **Validaciones Exitosas:**
- ✅ Headquarter IDs sincronizados
- ✅ Zona horaria colombiana (UTC-5)
- ✅ Fuente de datos correcta (`product_sell.created_at`)
- ✅ 0 discrepancias entre API y PostgreSQL
- ✅ Datos simulados mejorados
- ✅ Compatibilidad multi-entorno (desarrollo/producción)

## 📞 **SOPORTE**

Para problemas técnicos o consultas sobre la documentación:
- Revisar el `CHANGELOG.md` en el directorio raíz
- Consultar la documentación específica en esta carpeta
- Ejecutar los scripts de validación para diagnóstico

---

*Documentación generada el 29/08/2025 - Sistema de Ventas Diarias POS*
