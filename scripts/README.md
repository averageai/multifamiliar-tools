# Scripts de Exploración de Bases de Datos

Este directorio contiene scripts para explorar y validar la estructura de las bases de datos antes de implementar soluciones.

## Scripts Disponibles

### 1. `explore-database.js`
Script completo para explorar la estructura de las bases de datos.

**Funcionalidades:**
- ✅ Lista todas las tablas en ambas bases de datos
- ✅ Explora la estructura de columnas de cada tabla
- ✅ Valida tablas específicas relacionadas con compras y ventas
- ✅ Muestra registros de ejemplo
- ✅ Verifica la existencia de columnas críticas

**Uso:**
```bash
cd multifamiliar-tools
node scripts/explore-database.js
```

### 2. `test-queries.js`
Script específico para probar las consultas que están fallando.

**Funcionalidades:**
- ✅ Prueba consultas de compras recientes con diferentes columnas de precio
- ✅ Prueba consultas de ventas del día
- ✅ Explora específicamente las columnas de `product_purchase`
- ✅ Identifica la columna correcta para precios

**Uso:**
```bash
cd multifamiliar-tools
node scripts/test-queries.js
```

## Problema Identificado

El error `column pp.cost does not exist` indica que la columna `cost` no existe en la tabla `product_purchase`. 

**Posibles alternativas:**
- `pp.price`
- `pp.unit_price`
- `pp.value`
- O ninguna columna de precio (solo cantidad)

## Cómo Usar los Scripts

### Paso 1: Explorar la Estructura
```bash
node scripts/explore-database.js
```

Este script te mostrará:
- Todas las tablas disponibles
- Estructura de columnas de cada tabla
- Registros de ejemplo
- Validación de columnas críticas

### Paso 2: Probar Consultas Específicas
```bash
node scripts/test-queries.js
```

Este script probará:
- Consulta original con `pp.cost` (debería fallar)
- Consulta con `pp.price` (alternativa 1)
- Consulta con `pp.unit_price` (alternativa 2)
- Consulta sin columna de precio (solo cantidad)

### Paso 3: Analizar Resultados

Busca en la salida:
- ✅ **ÉXITO**: La consulta funcionó
- ❌ **ERROR**: La consulta falló
- 💡 **SUGERENCIA**: Alternativas sugeridas

## Ejemplo de Salida

```
🧪 PROBANDO CONSULTA DE COMPRAS RECIENTES EN MANIZALES
============================================================

📋 Consulta original con pp.cost
----------------------------------------
❌ ERROR: column pp.cost does not exist
💡 SUGERENCIA: La columna no existe, prueba con una alternativa

📋 Consulta alternativa con pp.price
----------------------------------------
✅ ÉXITO: 5 registros encontrados
📝 Primer registro:
{
  "proveedor": "PROVEEDOR EJEMPLO",
  "provider_id": 1,
  "purchase_id": 123,
  "created_at": "2024-01-15T10:30:00Z",
  "productId": 456,
  "internal_code": "PROD001",
  "nombre_producto": "Producto Ejemplo",
  "quantity": 10,
  "price": 15000
}
```

## Configuración

Los scripts usan las mismas variables de entorno que las APIs:

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

## Próximos Pasos

1. **Ejecutar los scripts** para identificar la estructura correcta
2. **Identificar la columna correcta** para precios en `product_purchase`
3. **Actualizar las APIs** con la columna correcta
4. **Probar las APIs** para confirmar que funcionan

## Notas Importantes

- Los scripts se conectan a ambas bases de datos (Manizales y La Dorada)
- Cada script maneja errores de conexión y consulta
- Los resultados se muestran en formato JSON para fácil lectura
- Se incluyen sugerencias cuando se encuentran errores
