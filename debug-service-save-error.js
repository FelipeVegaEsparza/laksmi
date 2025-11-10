// Debug específico para el error 400 al guardar servicios
const http = require('http');

console.log('🔍 Debuggeando error 400 al guardar servicios...');

// Primero hacer login para obtener token
const loginData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

console.log('🔐 Obteniendo token...');

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        const token = response.data.accessToken;
        console.log('✅ Token obtenido');
        
        // Ahora probar crear un servicio
        testCreateService(token);
        
        // También probar obtener servicios existentes
        testGetServices(token);
        
      } catch (error) {
        console.log('❌ Error parsing login:', error.message);
      }
    } else {
      console.log('❌ Login falló:', res.statusCode, data);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Error en login:', error.message);
});

loginReq.write(loginData);
loginReq.end();

function testGetServices(token) {
  console.log('📋 Probando GET /api/v1/services...');
  
  const getOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/services',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const getReq = http.request(getOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 GET Services Status:', res.statusCode);
      if (res.statusCode !== 200) {
        console.log('❌ GET Services Error:', data);
      } else {
        console.log('✅ GET Services OK');
      }
    });
  });
  
  getReq.on('error', (error) => {
    console.error('❌ Error en GET services:', error.message);
  });
  
  getReq.end();
}

function testCreateService(token) {
  console.log('🧪 Probando POST /api/v1/services...');
  
  // Datos de prueba para crear servicio
  const serviceData = JSON.stringify({
    name: 'Servicio de Prueba',
    description: 'Descripción de prueba',
    category: 'Facial',
    price: 50.00,
    duration: 60,
    images: []
  });
  
  const postOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/services',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(serviceData)
    }
  };
  
  const postReq = http.request(postOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 POST Services Status:', res.statusCode);
      console.log('📊 Response:', data);
      
      if (res.statusCode === 400) {
        console.log('❌ Error 400 confirmado - problema de validación');
        try {
          const errorResponse = JSON.parse(data);
          console.log('🔍 Detalles del error:', JSON.stringify(errorResponse, null, 2));
        } catch (e) {
          console.log('🔍 Raw error response:', data);
        }
      } else if (res.statusCode === 201) {
        console.log('✅ Servicio creado exitosamente');
      } else {
        console.log('⚠️ Status inesperado:', res.statusCode);
      }
    });
  });
  
  postReq.on('error', (error) => {
    console.error('❌ Error en POST services:', error.message);
  });
  
  postReq.write(serviceData);
  postReq.end();
}