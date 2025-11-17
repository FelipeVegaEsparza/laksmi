/**
 * Script auxiliar para obtener token de autenticación
 * 
 * Este script te ayuda a obtener el token de autenticación
 * necesario para ejecutar la importación.
 * 
 * Uso: node backend/scripts/get-auth-token.js
 */

const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔑 OBTENER TOKEN DE AUTENTICACIÓN');
  console.log('='.repeat(60) + '\n');

  try {
    // Solicitar datos
    const apiUrl = await question('URL de tu API de Laxmi (ej: https://api.laxmi.com): ');
    const username = await question('Username de usuario admin: ');
    const password = await question('Contraseña: ');

    console.log('\n⏳ Obteniendo token...\n');

    // Hacer login
    const response = await axios.post(
      `${apiUrl.replace(/\/$/, '')}/api/v1/auth/login`,
      {
        username: username.trim(),
        password: password
      }
    );

    const token = response.data.data?.accessToken || response.data.accessToken || response.data.token || response.data.data?.token;

    if (!token) {
      console.log('❌ No se pudo obtener el token');
      console.log('Respuesta:', JSON.stringify(response.data, null, 2));
      process.exit(1);
    }

    console.log('✅ Token obtenido exitosamente!\n');
    console.log('='.repeat(60));
    console.log('Copia este token en tu archivo .env.import:');
    console.log('='.repeat(60));
    console.log(`\nLAXMI_AUTH_TOKEN=${token}\n`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.log('\n❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
