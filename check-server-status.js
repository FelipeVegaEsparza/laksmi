// Check if server is running
async function checkServerStatus() {
  console.log('🔍 Verificando estado del servidor...\n');
  
  for (let i = 1; i <= 10; i++) {
    try {
      console.log(`Intento ${i}/10...`);
      
      const response = await fetch('http://localhost:3000/health', {
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      if (response.ok) {
        console.log('✅ Servidor está corriendo!');
        
        // Now check endpoints
        const apiResponse = await fetch('http://localhost:3000/api/v1/');
        const apiData = await apiResponse.json();
        
        console.log('\n📋 Endpoints disponibles:');
        Object.keys(apiData.endpoints).forEach(key => {
          console.log(`   - ${key}: ${apiData.endpoints[key]}`);
        });
        
        if (apiData.endpoints['upload-working']) {
          console.log('\n🎉 ¡upload-working está registrado!');
          return true;
        } else {
          console.log('\n❌ upload-working aún no está registrado');
        }
        
        return false;
      }
      
    } catch (error) {
      console.log(`   ❌ No responde: ${error.message}`);
    }
    
    // Wait 2 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n❌ Servidor no responde después de 10 intentos');
  return false;
}

// Use node-fetch if available
if (typeof fetch === 'undefined') {
  try {
    const { default: fetch } = require('node-fetch');
    global.fetch = fetch;
  } catch (e) {
    console.log('Usando fetch nativo');
  }
}

checkServerStatus();