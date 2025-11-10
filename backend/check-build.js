#!/usr/bin/env node

/**
 * Script para verificar que el backend compile correctamente
 * y mostrar información de diagnóstico
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del backend...\n');

// 1. Verificar que existe package.json
console.log('1️⃣ Verificando package.json...');
if (!fs.existsSync('package.json')) {
  console.error('❌ No se encontró package.json');
  process.exit(1);
}
console.log('✅ package.json encontrado\n');

// 2. Verificar que existe tsconfig.json
console.log('2️⃣ Verificando tsconfig.json...');
if (!fs.existsSync('tsconfig.json')) {
  console.error('❌ No se encontró tsconfig.json');
  process.exit(1);
}
console.log('✅ tsconfig.json encontrado\n');

// 3. Verificar que existe .env
console.log('3️⃣ Verificando archivo .env...');
if (!fs.existsSync('.env')) {
  console.warn('⚠️  No se encontró .env, usando valores por defecto');
} else {
  console.log('✅ .env encontrado');
  const envContent = fs.readFileSync('.env', 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  console.log(`   Variables configuradas: ${lines.length}`);
}
console.log('');

// 4. Verificar estructura de directorios
console.log('4️⃣ Verificando estructura de directorios...');
const requiredDirs = ['src', 'src/config', 'src/controllers', 'src/routes', 'src/services'];
let allDirsExist = true;
for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directorio faltante: ${dir}`);
    allDirsExist = false;
  }
}
if (allDirsExist) {
  console.log('✅ Todos los directorios necesarios existen\n');
}

// 5. Verificar archivos principales
console.log('5️⃣ Verificando archivos principales...');
const requiredFiles = [
  'src/index.ts',
  'src/app.ts',
  'src/config/index.ts',
  'src/config/database.ts'
];
let allFilesExist = true;
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Archivo faltante: ${file}`);
    allFilesExist = false;
  }
}
if (allFilesExist) {
  console.log('✅ Todos los archivos principales existen\n');
}

// 6. Intentar compilar TypeScript
console.log('6️⃣ Compilando TypeScript...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Compilación exitosa\n');
} catch (error) {
  console.error('❌ Error en la compilación de TypeScript');
  console.error('   Revisa los errores arriba para más detalles\n');
  process.exit(1);
}

// 7. Verificar node_modules
console.log('7️⃣ Verificando dependencias...');
if (!fs.existsSync('node_modules')) {
  console.error('❌ node_modules no encontrado');
  console.log('   Ejecuta: npm install');
  process.exit(1);
}
console.log('✅ node_modules encontrado\n');

console.log('🎉 ¡Todas las verificaciones pasaron exitosamente!');
console.log('\n📋 Próximos pasos:');
console.log('   1. Asegúrate de que la base de datos esté corriendo');
console.log('   2. Verifica las variables de entorno en .env');
console.log('   3. Ejecuta: npm run dev');
console.log('   4. El servidor debería iniciar en el puerto configurado\n');
