// Advanced debugging of backend routes
async function debugBackendRoutes() {
  console.log('🔍 AUDITORÍA COMPLETA DEL BACKEND\n');
  
  try {
    // Test 1: Basic connectivity
    console.log('1. 🌐 Verificando conectividad básica...');
    const healthResponse = await fetch('http://localhost:3000/health');
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.status !== 200) {
      console.log('   ❌ Backend no responde correctamente');
      return;
    }
    console.log('   ✅ Backend responde correctamente');
    
    // Test 2: API base endpoint
    console.log('\n2. 📋 Verificando endpoint base de API...');
    const apiResponse = await fetch('http://localhost:3000/api/v1/');
    const apiData = await apiResponse.json();
    
    console.log('   Endpoints registrados:');
    Object.keys(apiData.endpoints).forEach(key => {
      console.log(`   - ${key}: ${apiData.endpoints[key]}`);
    });
    
    // Test 3: Direct route testing
    console.log('\n3. 🔍 Probando rutas de upload directamente...');
    
    const uploadRoutes = [
      '/api/v1/upload/services',
      '/api/v1/upload-temp/services', 
      '/api/v1/upload-simple/services'
    ];
    
    for (const route of uploadRoutes) {
      try {
        console.log(`\n   Probando: ${route}`);
        const response = await fetch(`http://localhost:3000${route}`);
        const text = await response.text();
        
        console.log(`   Status: ${response.status}`);
        
        // Check if it's the catch-all response
        if (text.includes('API del Sistema de Gestión')) {
          console.log('   ❌ Devuelve respuesta catch-all (ruta no registrada)');
        } else if (response.status === 401) {
          console.log('   ⚠️  Requiere autenticación (ruta registrada)');
        } else if (response.status === 400) {
          console.log('   ⚠️  Bad request (ruta registrada, pero sin archivos)');
        } else {
          console.log('   ✅ Ruta registrada correctamente');
          console.log(`   Response: ${text.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Test 4: Check for specific errors
    console.log('\n4. 🔍 Verificando errores específicos...');
    
    // Test if multer is working
    try {
      const formData = new FormData();
      formData.append('test', 'value');
      
      const testResponse = await fetch('http://localhost:3000/api/v1/upload-simple/services', {
        method: 'POST',
        body: formData
      });
      
      console.log(`   Multer test status: ${testResponse.status}`);
      const testText = await testResponse.text();
      
      if (testText.includes('API del Sistema')) {
        console.log('   ❌ PROBLEMA CRÍTICO: upload-simple NO está registrado');
      } else {
        console.log('   ✅ upload-simple está registrado');
      }
      
    } catch (error) {
      console.log(`   ❌ Error en test de multer: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error en auditoría:', error.message);
  }
}

// Use node-fetch if available
if (typeof fetch === 'undefined') {
  try {
    const { default: fetch, FormData } = require('node-fetch');
    global.fetch = fetch;
    global.FormData = FormData;
  } catch (e) {
    console.log('Usando fetch nativo');
  }
}

debugBackendRoutes();