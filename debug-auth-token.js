// Debug para verificar el token de autenticación
console.log('🔍 Verificando autenticación...');

// Simular una request con token (necesitamos obtener un token válido primero)
const http = require('http');

// Primero intentar login para obtener un token
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

console.log('🔐 Intentando login...');

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📊 Login Status:', res.statusCode);
    
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        if (response.data && response.data.accessToken) {
          console.log('✅ Token obtenido exitosamente');
          console.log('🔑 Token:', response.data.accessToken.substring(0, 50) + '...');
          
          // Ahora probar el endpoint de servicios con el token
          testServiceWithToken(response.data.accessToken);
        } else {
          console.log('❌ No se recibió token en la respuesta');
          console.log('Respuesta:', data);
        }
      } catch (error) {
        console.log('❌ Error parsing login response:', error.message);
        console.log('Raw response:', data);
      }
    } else {
      console.log('❌ Login falló:', data);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Error en login:', error.message);
});

loginReq.write(loginData);
loginReq.end();

function testServiceWithToken(token) {
  console.log('🧪 Probando endpoint de servicios con token...');
  
  const serviceOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/services',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const serviceReq = http.request(serviceOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 Services Status:', res.statusCode);
      
      if (res.statusCode === 200) {
        console.log('✅ Endpoint de servicios funciona con autenticación');
        try {
          const services = JSON.parse(data);
          console.log('📋 Servicios encontrados:', services.length || 'N/A');
        } catch (e) {
          console.log('Respuesta:', data.substring(0, 200) + '...');
        }
      } else {
        console.log('❌ Endpoint de servicios aún falla:', data);
      }
    });
  });
  
  serviceReq.on('error', (error) => {
    console.error('❌ Error en services:', error.message);
  });
  
  serviceReq.end();
}