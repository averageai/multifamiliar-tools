#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 EJECUTANDO SCRIPTS DE VALIDACIÓN DE BASES DE DATOS');
console.log('=' .repeat(70));

// Función para ejecutar un script
function runScript(scriptName, description) {
  console.log(`\n📋 ${description}`);
  console.log('-'.repeat(50));
  
  try {
    const scriptPath = path.join(__dirname, scriptName);
    const output = execSync(`node "${scriptPath}"`, { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    console.log(output);
  } catch (error) {
    console.error(`❌ Error ejecutando ${scriptName}:`, error.message);
    if (error.stdout) {
      console.log('Salida del script:');
      console.log(error.stdout);
    }
  }
}

// Función principal
async function main() {
  console.log('Este script ejecutará ambos scripts de validación en secuencia.\n');
  
  // Ejecutar exploración completa
  runScript('explore-database.js', 'EXPLORACIÓN COMPLETA DE BASES DE DATOS');
  
  // Ejecutar pruebas específicas
  runScript('test-queries.js', 'PRUEBAS ESPECÍFICAS DE CONSULTAS');
  
  console.log('\n🎯 VALIDACIÓN COMPLETADA');
  console.log('=' .repeat(40));
  console.log('Revisa los resultados arriba para:');
  console.log('✅ Identificar la estructura correcta de las tablas');
  console.log('✅ Encontrar la columna correcta para precios');
  console.log('✅ Validar que las consultas funcionen');
  console.log('✅ Preparar las correcciones necesarias en las APIs');
}

// Ejecutar el script
main().catch(console.error);
