// Debug específico para "Datos de entrada inválidos"
const http = require('http');

console.log('🔍 Debuggeando error de validación de datos...');

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
      
      // Probar diferentes combinaciones de datos para encontrar el problema
      testMinimalService(token);
      testMinimalProduct(token);
      
    } else {
      console.log('❌ Login falló');
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function testMinimalService(token) {
  console.log('🧪 Probando servicio con datos mínimos...');
  
  // Datos mínimos requeridos
  const serviceData = JSON.stringify({
    name: `Test Service ${Date.now()}`,
    category: 'Facial',
    price: 50,
    duration: 60,
    description: 'Test description'
  });
  
  console.log('📤 Enviando datos:', serviceData);
  
  const options = {
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
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 Service Status:', res.statusCode);
      console.log('📊 Service Response:', data);
      
      if (res.statusCode === 400) {
        try {
          const errorResponse = JSON.parse(data);
          console.log('🔍 Error details:', JSON.stringify(errorResponse, null, 2));
          
          if (errorResponse.details) {
            console.log('🔍 Validation details:', errorResponse.details);
          }
        } catch (e) {
          console.log('🔍 Raw error:', data);
        }
      }
    });
  });
  
  req.write(serviceData);
  req.end();
}

function testMinimalProduct(token) {
  console.log('🧪 Probando producto con datos mínimos...');
  
  // Datos mínimos requeridos para producto
  const productData = JSON.stringify({
    name: `Test Product ${Date.now()}`,
    category: 'Cremas',
    price: 25,
    stock: 10,
    minStock: 5,
    description: 'Test product description'
  });
  
  console.log('📤 Enviando datos:', productData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/products',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(productData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 Product Status:', res.statusCode);
      console.log('📊 Product Response:', data);
      
      if (res.statusCode === 400) {
        try {
          const errorResponse = JSON.parse(data);
          console.log('🔍 Error details:', JSON.stringify(errorResponse, null, 2));
          
          if (errorResponse.details) {
            console.log('🔍 Validation details:', errorResponse.details);
          }
        } catch (e) {
          console.log('🔍 Raw error:', data);
        }
      }
    });
  });
  
  req.write(productData);
  req.end();
}