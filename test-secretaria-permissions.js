// Script para probar permisos de secretaria en las rutas de human-takeover

const API_URL = 'https://api.esteticalaksmi.cl';

async function testSecretariaPermissions() {
  console.log('🧪 Probando permisos de secretaria...\n');

  // Primero necesitas el token de secretaria
  console.log('📝 Para probar, necesitas:');
  console.log('1. Loguearte como secretaria en el dashboard');
  console.log('2. Abrir DevTools (F12)');
  console.log('3. En Console, ejecutar: localStorage.getItem("token")');
  console.log('4. Copiar el token y pegarlo aquí\n');

  console.log('Luego ejecuta este comando en la consola del navegador:');
  console.log(`
// Reemplaza YOUR_TOKEN con el token real
const token = 'YOUR_TOKEN';
const conversationId = 'CONVERSATION_ID'; // ID de una conversación real

// Test 1: Iniciar control humano
fetch('${API_URL}/api/v1/human-takeover/' + conversationId + '/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Start takeover:', data))
.catch(err => console.error('❌ Error:', err));

// Test 2: Finalizar control humano
fetch('${API_URL}/api/v1/human-takeover/' + conversationId + '/end', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ resolution: 'Test' })
})
.then(r => r.json())
.then(data => console.log('✅ End takeover:', data))
.catch(err => console.error('❌ Error:', err));
  `);
}

testSecretariaPermissions();
