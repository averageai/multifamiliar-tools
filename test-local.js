const http = require('http');
const fs = require('fs');
const path = require('path');

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Función para leer un archivo
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

console.log('🔍 VERIFICANDO CONFIGURACIÓN LOCAL');
console.log('=' .repeat(50));

// Verificar archivos críticos
const criticalFiles = [
  'index.html',
  'cierre-caja.html',
  'surtido-diario.html',
  'surtido-compras.html',
  'next.config.js',
  'vercel.json',
  'package.json',
  'src/pages/index.js'
];

console.log('\n📋 Verificando archivos críticos:');
criticalFiles.forEach(file => {
  const exists = fileExists(file);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  
  if (exists && file.endsWith('.html')) {
    const content = readFile(file);
    const hasContent = content && content.length > 0;
    console.log(`     ${hasContent ? '✅' : '❌'} Contenido válido`);
  }
});

// Verificar configuración de Next.js
console.log('\n⚙️ Verificando configuración de Next.js:');
const nextConfig = readFile('next.config.js');
if (nextConfig) {
  const hasRewrites = nextConfig.includes('rewrites');
  const hasHeaders = nextConfig.includes('headers');
  console.log(`  ${hasRewrites ? '✅' : '❌'} Configuración de rewrites`);
  console.log(`  ${hasHeaders ? '✅' : '❌'} Configuración de headers`);
} else {
  console.log('  ❌ No se pudo leer next.config.js');
}

// Verificar configuración de Vercel
console.log('\n🚀 Verificando configuración de Vercel:');
const vercelConfig = readFile('vercel.json');
if (vercelConfig) {
  const hasBuilds = vercelConfig.includes('"builds"');
  const hasHeaders = vercelConfig.includes('"headers"');
  const hasNoRewrites = !vercelConfig.includes('"rewrites"');
  console.log(`  ${hasBuilds ? '✅' : '❌'} Configuración de builds`);
  console.log(`  ${hasHeaders ? '✅' : '❌'} Configuración de headers`);
  console.log(`  ${hasNoRewrites ? '✅' : '❌'} Sin rewrites conflictivos`);
} else {
  console.log('  ❌ No se pudo leer vercel.json');
}

// Verificar estructura de directorios
console.log('\n📁 Verificando estructura de directorios:');
const directories = [
  'src',
  'src/pages',
  'src/pages/api',
  'public'
];

directories.forEach(dir => {
  const exists = fileExists(dir);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}/`);
});

// Verificar APIs
console.log('\n🔌 Verificando APIs:');
const apiFiles = [
  'src/pages/api/ventas-dia.js',
  'src/pages/api/compras-recientes.js',
  'src/pages/api/proveedores.js',
  'src/pages/api/generar-json-compras.js'
];

apiFiles.forEach(api => {
  const exists = fileExists(api);
  console.log(`  ${exists ? '✅' : '❌'} ${api}`);
});

console.log('\n🎯 RESUMEN DE VERIFICACIÓN');
console.log('=' .repeat(30));
console.log('Si todos los archivos críticos están marcados con ✅,');
console.log('la configuración debería funcionar correctamente.');
console.log('\nPara probar localmente:');
console.log('1. npm run dev');
console.log('2. Abrir http://localhost:3000');
console.log('3. Verificar que index.html se carga correctamente');
