// Debug específico para el error de validación al editar servicios
const http = require('http');

console.log('🔍 Debuggeando error de validación en PUT /services...');

// Primero hacer login
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

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      const token = response.data.accessToken;
      console.log('✅ Token obtenido');
      
      // Probar PUT con los mismos datos que está enviando el frontend
      testPutService(token);
      
    } else {
      console.log('❌ Login falló:', res.statusCode, data);
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function testPutService(token) {
  console.log('🧪 Probando PUT /services con datos del frontend...');
  
  // Datos exactos que está enviando el frontend según los logs
  const serviceData = JSON.stringify({
    name: 'Servicio de prueba',
    category: 'Corporal',
    price: 10,
    duration: 60,
    description: 'bla bla bla bla bla bl',
    images: ['/uploads/services/images-1760840060283-456103291.png'], // Con imagen subida
    requirements: [],
    isActive: true
  });
  
  console.log('📤 Enviando datos exactos del frontend:');
  console.log(serviceData);
  
  const serviceId = 'c7be75ac-ac49-11f0-934e-0045e287f432';
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/services/${serviceId}`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(serviceData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 PUT Status:', res.statusCode);
      console.log('📊 PUT Response:', data);
      
      if (res.statusCode === 400) {
        try {
          const errorResponse = JSON.parse(data);
          console.log('\n🔍 DETALLES DEL ERROR 400:');
          console.log(JSON.stringify(errorResponse, null, 2));
          
          if (errorResponse.details) {
            console.log('\n🔍 DETALLES DE VALIDACIÓN:');
            console.log(JSON.stringify(errorResponse.details, null, 2));
          }
          
          // Intentar con datos más simples
          console.log('\n🧪 Probando con datos mínimos...');
          testPutServiceMinimal(token, serviceId);
          
        } catch (e) {
          console.log('🔍 Raw error response:', data);
        }
      } else if (res.statusCode === 200) {
        console.log('✅ PUT exitoso');
      } else {
        console.log('⚠️ Status inesperado:', res.statusCode);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error en PUT:', error.message);
  });
  
  req.write(serviceData);
  req.end();
}

function testPutServiceMinimal(token, serviceId) {
  // Datos mínimos para ver qué campo específico está causando el problema
  const minimalData = JSON.stringify({
    name: 'Servicio Test Minimal',
    category: 'Facial',
    price: 50,
    duration: 60,
    description: 'Test minimal'
  });
  
  console.log('📤 Enviando datos mínimos:');
  console.log(minimalData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/services/${serviceId}`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(minimalData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 PUT Minimal Status:', res.statusCode);
      console.log('📊 PUT Minimal Response:', data);
      
      if (res.statusCode === 400) {
        console.log('❌ Incluso datos mínimos fallan - problema en validación del backend');
      } else if (res.statusCode === 200) {
        console.log('✅ Datos mínimos funcionan - problema en campos específicos del frontend');
      }
    });
  });
  
  req.write(minimalData);
  req.end();
}