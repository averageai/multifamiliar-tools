#!/usr/bin/env node

/**
 * 🔍 ANALIZADOR DE TABLAS ESPECÍFICAS - STOCK ANÁLISIS
 * ===================================================
 * 
 * Este script permite analizar tablas específicas de las bases de datos:
 * - Manizales: crsitaleriamanizales_complete
 * - La Dorada: cristaleriaprod_complete
 * 
 * Uso: node analyze-specific-table.js [sede] [tabla]
 * Ejemplo: node analyze-specific-table.js manizales product
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de bases de datos
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

// Función para crear conexión
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

// Función para obtener estadísticas de una tabla
async function getTableStats(pool, tableName) {
  try {
    const countQuery = `SELECT COUNT(*) as total_rows FROM "${tableName}"`;
    const countResult = await executeQuery(pool, countQuery);
    
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

// Función para obtener datos de muestra
async function getSampleData(pool, tableName, limit = 5) {
  try {
    const query = `SELECT * FROM "${tableName}" LIMIT $1`;
    return await executeQuery(pool, query, [limit]);
  } catch (error) {
    console.warn(`No se pudieron obtener datos de muestra para ${tableName}:`, error.message);
    return [];
  }
}

// Función para obtener restricciones
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

// Función para obtener índices
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

// Función para analizar una tabla específica
async function analyzeSpecificTable(environment, tableName) {
  console.log(`🔍 Analizando tabla ${tableName} en ${environment}...`);
  
  const pool = await createConnection(environment);
  
  try {
    // Verificar que la tabla existe
    const tableExistsQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    `;
    const tableExists = await executeQuery(pool, tableExistsQuery, [tableName]);
    
    if (tableExists.length === 0) {
      throw new Error(`La tabla '${tableName}' no existe en ${environment}`);
    }
    
    // Obtener análisis completo
    const [structure, stats, sampleData, constraints, indexes] = await Promise.all([
      getTableStructure(pool, tableName),
      getTableStats(pool, tableName),
      getSampleData(pool, tableName),
      getTableConstraints(pool, tableName),
      getTableIndexes(pool, tableName)
    ]);
    
    return {
      environment,
      tableName,
      structure,
      stats,
      sampleData,
      constraints,
      indexes
    };
    
  } finally {
    await pool.end();
  }
}

// Función para generar reporte
function generateReport(analysis) {
  const now = new Date().toISOString();
  
  let report = `# 📊 ANÁLISIS DE TABLA ESPECÍFICA - STOCK ANÁLISIS

## 📅 Fecha: ${new Date(now).toLocaleDateString('es-ES')}
## 🕐 Hora: ${new Date(now).toLocaleTimeString('es-ES')}

---

## 🎯 **INFORMACIÓN GENERAL**

- **Base de Datos**: ${analysis.environment}
- **Tabla**: ${analysis.tableName}
- **Total de Registros**: ${analysis.stats.total_rows.toLocaleString()}
- **Tamaño de Tabla**: ${analysis.stats.table_size}
- **Tamaño de Datos**: ${analysis.stats.data_size}

---

## 📋 **ESTRUCTURA DE COLUMNAS**

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
`;

  analysis.structure.forEach(column => {
    const dataType = column.data_type + 
      (column.character_maximum_length ? `(${column.character_maximum_length})` : '') +
      (column.numeric_precision ? `(${column.numeric_precision},${column.numeric_scale})` : '');
    
    const nullable = column.is_nullable === 'YES' ? 'Sí' : 'No';
    const defaultValue = column.column_default || 'NULL';
    
    report += `| ${column.column_name} | ${dataType} | ${nullable} | ${defaultValue} | - |\n`;
  });

  report += `\n`;

  // Restricciones
  if (analysis.constraints.length > 0) {
    report += `## 🔗 **RESTRICCIONES**\n\n`;
    report += `| Tipo | Nombre | Columna | Referencia |\n`;
    report += `|------|--------|---------|------------|\n`;
    
    analysis.constraints.forEach(constraint => {
      const reference = constraint.foreign_table_name ? 
        `${constraint.foreign_table_name}.${constraint.foreign_column_name}` : '-';
      
      report += `| ${constraint.constraint_type} | ${constraint.constraint_name} | ${constraint.column_name} | ${reference} |\n`;
    });
    
    report += `\n`;
  }

  // Índices
  if (analysis.indexes.length > 0) {
    report += `## 📈 **ÍNDICES**\n\n`;
    analysis.indexes.forEach(index => {
      report += `- **${index.indexname}**: \`${index.indexdef}\`\n`;
    });
    report += `\n`;
  }

  // Datos de muestra
  if (analysis.sampleData.length > 0) {
    report += `## 📄 **DATOS DE MUESTRA**\n\n`;
    report += `\`\`\`json\n`;
    report += JSON.stringify(analysis.sampleData, null, 2);
    report += `\n\`\`\`\n\n`;
  }

  // Análisis adicional
  report += `## 🔍 **ANÁLISIS ADICIONAL**\n\n`;

  // Contar columnas por tipo
  const columnTypes = {};
  analysis.structure.forEach(column => {
    columnTypes[column.data_type] = (columnTypes[column.data_type] || 0) + 1;
  });

  report += `### 📊 **Distribución de Tipos de Datos:**\n\n`;
  Object.entries(columnTypes).forEach(([type, count]) => {
    report += `- **${type}**: ${count} columnas\n`;
  });

  report += `\n`;

  // Columnas con valores por defecto
  const columnsWithDefault = analysis.structure.filter(col => col.column_default);
  if (columnsWithDefault.length > 0) {
    report += `### ⚙️ **Columnas con Valores por Defecto:**\n\n`;
    columnsWithDefault.forEach(column => {
      report += `- **${column.column_name}**: \`${column.column_default}\`\n`;
    });
    report += `\n`;
  }

  // Columnas nullable
  const nullableColumns = analysis.structure.filter(col => col.is_nullable === 'YES');
  report += `### ❓ **Columnas Nullable (${nullableColumns.length}/${analysis.structure.length}):**\n\n`;
  nullableColumns.forEach(column => {
    report += `- ${column.column_name}\n`;
  });

  report += `\n`;

  // Recomendaciones
  report += `## 💡 **RECOMENDACIONES**\n\n`;

  if (analysis.stats.total_rows > 10000) {
    report += `- ⚠️ **Tabla grande**: Considerar índices adicionales para consultas frecuentes\n`;
  }

  if (nullableColumns.length > analysis.structure.length * 0.5) {
    report += `- ⚠️ **Muchas columnas nullable**: Revisar si todas son necesarias\n`;
  }

  const foreignKeys = analysis.constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
  if (foreignKeys.length > 0) {
    report += `- ✅ **Relaciones definidas**: ${foreignKeys.length} claves foráneas encontradas\n`;
  }

  report += `- 📊 **Total de columnas**: ${analysis.structure.length}\n`;
  report += `- 🔗 **Total de restricciones**: ${analysis.constraints.length}\n`;
  report += `- 📈 **Total de índices**: ${analysis.indexes.length}\n`;

  report += `\n---\n\n*Reporte generado automáticamente por el analizador de tablas específicas*`;

  return report;
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ Uso: node analyze-specific-table.js [sede] [tabla]');
    console.log('📋 Ejemplos:');
    console.log('   node analyze-specific-table.js manizales product');
    console.log('   node analyze-specific-table.js ladorada stock');
    console.log('   node analyze-specific-table.js manizales sell');
    process.exit(1);
  }

  const [sede, tabla] = args;
  
  if (!['manizales', 'ladorada'].includes(sede)) {
    console.log('❌ Sede debe ser "manizales" o "ladorada"');
    process.exit(1);
  }

  console.log(`🚀 Analizando tabla específica...\n`);
  console.log(`📍 Sede: ${sede}`);
  console.log(`📋 Tabla: ${tabla}\n`);

  try {
    const analysis = await analyzeSpecificTable(sede, tabla);
    const report = generateReport(analysis);
    
    // Guardar reporte
    const outputPath = path.join(__dirname, `TABLE_ANALYSIS_${sede}_${tabla}.md`);
    fs.writeFileSync(outputPath, report, 'utf8');
    
    console.log(`✅ Análisis completado exitosamente!`);
    console.log(`📄 Reporte guardado en: ${outputPath}`);
    console.log(`📊 Resumen:`);
    console.log(`   - Registros: ${analysis.stats.total_rows.toLocaleString()}`);
    console.log(`   - Columnas: ${analysis.structure.length}`);
    console.log(`   - Tamaño: ${analysis.stats.table_size}`);
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  analyzeSpecificTable,
  generateReport
};
