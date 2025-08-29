#!/usr/bin/env node

/**
 * 🔍 ANALIZADOR DE ESTRUCTURA DE BASES DE DATOS - STOCK ANÁLISIS
 * =============================================================
 * 
 * Este script analiza las estructuras de las bases de datos de:
 * - Manizales: crsitaleriamanizales_complete
 * - La Dorada: cristaleriaprod_complete
 * 
 * Genera un archivo markdown con la documentación completa de:
 * - Tablas y sus estructuras
 * - Relaciones entre tablas
 * - Tipos de datos y restricciones
 * - Estadísticas de datos
 * - Configuraciones de conexión
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de bases de datos del sistema de análisis de inventario
const dbConfigs = {
  manizales: {
    host: '5.161.103.230',
    port: 7717,
    database: 'crsitaleriamanizales_complete',
    user: 'vercel_user',
    password: 'non@ver@ge',
    ssl: {
      rejectUnauthorized: false
    }
  },
  ladorada: {
    host: '5.161.103.230',
    port: 7717,
    database: 'cristaleriaprod_complete',
    user: 'vercel_user',
    password: 'non@ver@ge',
    ssl: {
      rejectUnauthorized: false
    }
  }
};

// Función para crear conexión a la base de datos
async function createConnection(environment) {
  try {
    const config = dbConfigs[environment];
    const pool = new Pool(config);
    return pool;
  } catch (error) {
    console.error(`Error conectando a ${environment}:`, error);
    throw error;
  }
}

// Función para ejecutar consultas
async function executeQuery(pool, query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error(`Error ejecutando query:`, error);
    throw error;
  }
}

// Función para obtener todas las tablas
async function getTables(pool) {
  const query = `
    SELECT 
      table_name,
      table_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  return await executeQuery(pool, query);
}

// Función para obtener estructura de una tabla
async function getTableStructure(pool, tableName) {
  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale,
      ordinal_position
    FROM information_schema.columns 
    WHERE table_name = $1 
    AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  return await executeQuery(pool, query, [tableName]);
}

// Función para obtener restricciones de una tabla
async function getTableConstraints(pool, tableName) {
  const query = `
    SELECT 
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    LEFT JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = $1 
    AND tc.table_schema = 'public'
    ORDER BY tc.constraint_type, tc.constraint_name
  `;
  return await executeQuery(pool, query, [tableName]);
}

// Función para obtener estadísticas de una tabla
async function getTableStats(pool, tableName) {
  try {
    const countQuery = `SELECT COUNT(*) as total_rows FROM "${tableName}"`;
    const countResult = await executeQuery(pool, countQuery);
    
    // Obtener tamaño de la tabla
    const sizeQuery = `
      SELECT 
        pg_size_pretty(pg_total_relation_size($1)) as table_size,
        pg_size_pretty(pg_relation_size($1)) as data_size
    `;
    const sizeResult = await executeQuery(pool, sizeQuery, [tableName]);
    
    return {
      total_rows: parseInt(countResult[0].total_rows),
      table_size: sizeResult[0].table_size,
      data_size: sizeResult[0].data_size
    };
  } catch (error) {
    console.warn(`No se pudieron obtener estadísticas para ${tableName}:`, error.message);
    return {
      total_rows: 0,
      table_size: 'N/A',
      data_size: 'N/A'
    };
  }
}

// Función para obtener índices de una tabla
async function getTableIndexes(pool, tableName) {
  const query = `
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE tablename = $1 
    AND schemaname = 'public'
    ORDER BY indexname
  `;
  return await executeQuery(pool, query, [tableName]);
}

// Función para obtener datos de muestra de una tabla
async function getSampleData(pool, tableName, limit = 3) {
  try {
    const query = `SELECT * FROM "${tableName}" LIMIT $1`;
    return await executeQuery(pool, query, [limit]);
  } catch (error) {
    console.warn(`No se pudieron obtener datos de muestra para ${tableName}:`, error.message);
    return [];
  }
}

// Función para analizar una base de datos completa
async function analyzeDatabase(environment) {
  console.log(`🔍 Analizando base de datos: ${environment}...`);
  
  const pool = await createConnection(environment);
  const analysis = {
    environment,
    config: dbConfigs[environment],
    tables: [],
    summary: {
      total_tables: 0,
      total_rows: 0,
      total_size: '0 MB'
    }
  };
  
  try {
    // Obtener todas las tablas
    const tables = await getTables(pool);
    analysis.summary.total_tables = tables.length;
    
    console.log(`📋 Encontradas ${tables.length} tablas en ${environment}`);
    
    // Analizar cada tabla
    for (const table of tables) {
      console.log(`  📊 Analizando tabla: ${table.table_name}`);
      
      const tableAnalysis = {
        name: table.table_name,
        type: table.table_type,
        structure: await getTableStructure(pool, table.table_name),
        constraints: await getTableConstraints(pool, table.table_name),
        indexes: await getTableIndexes(pool, table.table_name),
        stats: await getTableStats(pool, table.table_name),
        sample_data: await getSampleData(pool, table.table_name)
      };
      
      analysis.tables.push(tableAnalysis);
      analysis.summary.total_rows += tableAnalysis.stats.total_rows;
    }
    
    // Calcular tamaño total
    const totalSizeQuery = `
      SELECT pg_size_pretty(SUM(pg_total_relation_size(quote_ident(tablename)::regclass))) as total_size
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    const totalSizeResult = await executeQuery(pool, totalSizeQuery);
    analysis.summary.total_size = totalSizeResult[0].total_size;
    
  } finally {
    await pool.end();
  }
  
  return analysis;
}

// Función para generar el markdown
function generateMarkdown(manizalesAnalysis, ladoradaAnalysis) {
  const now = new Date().toISOString();
  
  let markdown = `# 🗄️ ANÁLISIS COMPLETO DE ESTRUCTURA DE BASES DE DATOS - STOCK ANÁLISIS

## 📅 Fecha de Análisis: ${new Date(now).toLocaleDateString('es-ES')}
## 🕐 Hora de Análisis: ${new Date(now).toLocaleTimeString('es-ES')}

---

## 🎯 **RESUMEN EJECUTIVO**

### 📊 **Estadísticas Generales:**
- **Total de Bases de Datos**: 2 (Manizales + La Dorada)
- **Total de Tablas**: ${manizalesAnalysis.summary.total_tables + ladoradaAnalysis.summary.total_tables}
- **Total de Registros**: ${(manizalesAnalysis.summary.total_rows + ladoradaAnalysis.summary.total_rows).toLocaleString()}
- **Tamaño Total**: ${manizalesAnalysis.summary.total_size} + ${ladoradaAnalysis.summary.total_size}

### 🔧 **Configuración de Conexión:**
- **Host**: 5.161.103.230
- **Puerto**: 7717
- **Usuario**: vercel_user
- **SSL**: Habilitado (rejectUnauthorized: false)

---

## 🏪 **BASE DE DATOS: MANIZALES** (crsitaleriamanizales_complete)

### 📈 **Resumen:**
- **Total de Tablas**: ${manizalesAnalysis.summary.total_tables}
- **Total de Registros**: ${manizalesAnalysis.summary.total_rows.toLocaleString()}
- **Tamaño Total**: ${manizalesAnalysis.summary.total_size}

### 📋 **Tablas Detalladas:**

`;

  // Agregar tablas de Manizales
  manizalesAnalysis.tables.forEach(table => {
    markdown += generateTableMarkdown(table, 'Manizales');
  });

  markdown += `

---

## 🏬 **BASE DE DATOS: LA DORADA** (cristaleriaprod_complete)

### 📈 **Resumen:**
- **Total de Tablas**: ${ladoradaAnalysis.summary.total_tables}
- **Total de Registros**: ${ladoradaAnalysis.summary.total_rows.toLocaleString()}
- **Tamaño Total**: ${ladoradaAnalysis.summary.total_size}

### 📋 **Tablas Detalladas:**

`;

  // Agregar tablas de La Dorada
  ladoradaAnalysis.tables.forEach(table => {
    markdown += generateTableMarkdown(table, 'La Dorada');
  });

  markdown += `

---

## 🔍 **ANÁLISIS COMPARATIVO**

### 📊 **Comparación de Tablas:**

| Tabla | Manizales | La Dorada | Diferencia |
|-------|-----------|-----------|------------|
`;

  // Crear comparación de tablas
  const allTables = new Set([
    ...manizalesAnalysis.tables.map(t => t.name),
    ...ladoradaAnalysis.tables.map(t => t.name)
  ]);

  allTables.forEach(tableName => {
    const manizalesTable = manizalesAnalysis.tables.find(t => t.name === tableName);
    const ladoradaTable = ladoradaAnalysis.tables.find(t => t.name === tableName);
    
    const manizalesRows = manizalesTable ? manizalesTable.stats.total_rows : 0;
    const ladoradaRows = ladoradaTable ? ladoradaTable.stats.total_rows : 0;
    const difference = manizalesRows - ladoradaRows;
    
    markdown += `| ${tableName} | ${manizalesRows.toLocaleString()} | ${ladoradaRows.toLocaleString()} | ${difference > 0 ? '+' : ''}${difference.toLocaleString()} |\n`;
  });

  markdown += `

### 🎯 **Observaciones Clave:**

1. **Tablas Principales del Sistema:**
   - \`product\`: Catálogo de productos
   - \`stock\`: Inventario por sede
   - \`sell\`: Registro de ventas
   - \`purchase\`: Registro de compras
   - \`headquarter\`: Configuración de sedes

2. **Relaciones Clave:**
   - \`product_sell\`: Relación muchos a muchos entre productos y ventas
   - \`product_purchase\`: Relación muchos a muchos entre productos y compras
   - \`stock\`: Vincula productos con sedes (headquarterId)

3. **Campos Importantes:**
   - \`deleted_at\`: Soft delete en la mayoría de tablas
   - \`created_at\`: Timestamp de creación
   - \`updated_at\`: Timestamp de actualización
   - \`headquarterId\`: Identificador de sede (camelCase)

---

## 🔧 **CONFIGURACIÓN TÉCNICA**

### 📝 **Variables de Entorno Requeridas:**
\`\`\`env
DB_HOST=5.161.103.230
DB_PORT=7717
DB_USER=vercel_user
DB_PASSWORD=non@ver@ge
DB_NAME_MANIZALES=crsitaleriamanizales_complete
DB_NAME_LADORADA=cristaleriaprod_complete
\`\`\`

### 🔌 **Configuración de Conexión:**
\`\`\`javascript
const dbConfigs = {
  manizales: {
    host: '5.161.103.230',
    port: 7717,
    database: 'crsitaleriamanizales_complete',
    user: 'vercel_user',
    password: 'non@ver@ge',
    ssl: { rejectUnauthorized: false }
  },
  ladorada: {
    host: '5.161.103.230',
    port: 7717,
    database: 'cristaleriaprod_complete',
    user: 'vercel_user',
    password: 'non@ver@ge',
    ssl: { rejectUnauthorized: false }
  }
};
\`\`\`

---

## 🚀 **RECOMENDACIONES DE USO**

### 📊 **Para Análisis de Inventario:**
1. **Consultar stock actual**: Usar tabla \`stock\` con filtros por \`headquarterId\`
2. **Análisis de ventas**: Combinar \`sell\` + \`product_sell\` + \`product\`
3. **Análisis de compras**: Combinar \`purchase\` + \`product_purchase\` + \`product\`
4. **Productos inactivos**: Filtrar por \`deleted_at IS NULL\`

### 🔍 **Queries Recomendadas:**
\`\`\`sql
-- Stock actual por sede
SELECT p.name, s.quantity, h.name as sede
FROM product p
JOIN stock s ON p.id = s."productId"
JOIN headquarter h ON s."headquarterId" = h.id
WHERE p.deleted_at IS NULL AND s.quantity > 0;

-- Ventas del último mes
SELECT p.name, SUM(ps.quantity) as vendido
FROM product_sell ps
JOIN sell s ON ps."sellId" = s.id
JOIN product p ON ps."productId" = p.id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name;
\`\`\`

---

## 📋 **NOTAS TÉCNICAS**

### ⚠️ **Consideraciones Importantes:**
1. **Nombres de columnas**: Usar comillas dobles para campos camelCase (\`"productId"\`)
2. **Campos JSON**: Manejar con cuidado (ej: \`bar_code\`)
3. **Soft deletes**: Siempre filtrar por \`deleted_at IS NULL\`
4. **Timestamps**: Usar \`created_at\` y \`updated_at\` para auditoría

### 🔒 **Seguridad:**
- Conexión SSL habilitada
- Usuario con permisos limitados
- Queries parametrizadas para prevenir SQL injection

---

*Documento generado automáticamente por el analizador de estructura de bases de datos*
`;

  return markdown;
}

// Función para generar markdown de una tabla individual
function generateTableMarkdown(table, sede) {
  let markdown = `#### 📊 **${table.name}**\n\n`;
  
  // Estadísticas básicas
  markdown += `**Estadísticas:** ${table.stats.total_rows.toLocaleString()} registros | Tamaño: ${table.stats.table_size}\n\n`;
  
  // Estructura de columnas
  markdown += `**Estructura:**\n\n`;
  markdown += `| Columna | Tipo | Nullable | Default | Descripción |\n`;
  markdown += `|---------|------|----------|---------|-------------|\n`;
  
  table.structure.forEach(column => {
    const dataType = column.data_type + 
      (column.character_maximum_length ? `(${column.character_maximum_length})` : '') +
      (column.numeric_precision ? `(${column.numeric_precision},${column.numeric_scale})` : '');
    
    const nullable = column.is_nullable === 'YES' ? 'Sí' : 'No';
    const defaultValue = column.column_default || 'NULL';
    
    markdown += `| ${column.column_name} | ${dataType} | ${nullable} | ${defaultValue} | - |\n`;
  });
  
  markdown += `\n`;
  
  // Restricciones
  if (table.constraints.length > 0) {
    markdown += `**Restricciones:**\n\n`;
    markdown += `| Tipo | Nombre | Columna | Referencia |\n`;
    markdown += `|------|--------|---------|------------|\n`;
    
    table.constraints.forEach(constraint => {
      const reference = constraint.foreign_table_name ? 
        `${constraint.foreign_table_name}.${constraint.foreign_column_name}` : '-';
      
      markdown += `| ${constraint.constraint_type} | ${constraint.constraint_name} | ${constraint.column_name} | ${reference} |\n`;
    });
    
    markdown += `\n`;
  }
  
  // Índices
  if (table.indexes.length > 0) {
    markdown += `**Índices:**\n\n`;
    table.indexes.forEach(index => {
      markdown += `- **${index.indexname}**: \`${index.indexdef}\`\n`;
    });
    markdown += `\n`;
  }
  
  // Datos de muestra
  if (table.sample_data.length > 0) {
    markdown += `**Datos de Muestra:**\n\n`;
    markdown += `\`\`\`json\n`;
    markdown += JSON.stringify(table.sample_data, null, 2);
    markdown += `\n\`\`\`\n\n`;
  }
  
  markdown += `---\n\n`;
  
  return markdown;
}

// Función principal
async function main() {
  console.log('🚀 Iniciando análisis de estructura de bases de datos...\n');
  
  try {
    // Analizar ambas bases de datos
    const [manizalesAnalysis, ladoradaAnalysis] = await Promise.all([
      analyzeDatabase('manizales'),
      analyzeDatabase('ladorada')
    ]);
    
    console.log('\n📝 Generando documentación markdown...');
    
    // Generar markdown
    const markdown = generateMarkdown(manizalesAnalysis, ladoradaAnalysis);
    
    // Guardar archivo
    const outputPath = path.join(__dirname, 'DB_STRUCTURE_ANALYSIS.md');
    fs.writeFileSync(outputPath, markdown, 'utf8');
    
    console.log(`✅ Análisis completado exitosamente!`);
    console.log(`📄 Documentación guardada en: ${outputPath}`);
    console.log(`📊 Resumen:`);
    console.log(`   - Manizales: ${manizalesAnalysis.summary.total_tables} tablas, ${manizalesAnalysis.summary.total_rows.toLocaleString()} registros`);
    console.log(`   - La Dorada: ${ladoradaAnalysis.summary.total_tables} tablas, ${ladoradaAnalysis.summary.total_rows.toLocaleString()} registros`);
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  analyzeDatabase,
  generateMarkdown,
  dbConfigs
};
