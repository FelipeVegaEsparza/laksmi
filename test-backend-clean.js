// Test para verificar que el backend limpio funciona correctamente
const http = require('http');

console.log('🧪 Probando backend limpio y estabilizado...');

async function testBackendClean() {
  console.log('\n1️⃣ Probando health check...');
  await testHealthCheck();
  
  console.log('\n2️⃣ Probando autenticación...');
  const token = await testLogin();
  
  if (token) {
    console.log('\n3️⃣ Probando endpoint de upload limpio...');
    await testUploadEndpoint();
    
    console.log('\n4️⃣ Probando creación de servicio...');
    await testCreateService(token);
  }
  
  console.log('\n✅ RESUMEN DE PRUEBAS COMPLETADO');
}

function testHealthCheck() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const health = JSON.parse(data);
          console.log('✅ Health check OK:', health.status, health.environment);
        } else {
          console.log('❌ Health check failed:', res.statusCode);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Health check error:', error.message);
      resolve();
    });
    
    req.end();
  });
}

function testLogin() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('✅ Login exitoso');
            resolve(response.data.accessToken);
          } catch (error) {
            console.log('❌ Login response parse error');
            resolve(null);
          }
        } else {
          console.log('❌ Login failed:', res.statusCode, data);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Login error:', error.message);
      resolve(null);
    });
    
    req.write(loginData);
    req.end();
  });
}

function testUploadEndpoint() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/upload/services',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Upload endpoint limpio disponible');
        } else {
          console.log('❌ Upload endpoint error:', res.statusCode);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Upload endpoint error:', error.message);
      resolve();
    });
    
    req.end();
  });
}

function testCreateService(token) {
  return new Promise((resolve) => {
    const serviceData = JSON.stringify({
      name: `Servicio Test Limpio ${Date.now()}`,
      category: 'Facial',
      price: 60,
      duration: 45,
      description: 'Servicio de prueba con backend limpio',
      images: [],
      requirements: [],
      isActive: true
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/services',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(serviceData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log('✅ Creación de servicio exitosa');
        } else {
          console.log('❌ Creación de servicio falló:', res.statusCode, data);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Service creation error:', error.message);
      resolve();
    });
    
    req.write(serviceData);
    req.end();
  });
}

// Ejecutar tests
testBackendClean().catch(console.error);