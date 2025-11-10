// Debug para verificar si el problema es editar vs crear
const http = require('http');

console.log('🔍 Debuggeando diferencia entre crear y editar servicios...');

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
      
      // Primero obtener servicios existentes
      getExistingServices(token);
      
    } else {
      console.log('❌ Login falló:', res.statusCode, data);
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function getExistingServices(token) {
  console.log('📋 Obteniendo servicios existentes...');
  
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
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          const services = response.data || response;
          
          console.log('📊 Servicios encontrados:', services.length || 'N/A');
          
          if (services.length > 0) {
            const firstService = services[0];
            console.log('🔍 Primer servicio:', {
              id: firstService.id,
              name: firstService.name,
              category: firstService.category
            });
            
            // Probar editar este servicio
            testEditService(token, firstService);
          } else {
            console.log('📭 No hay servicios para editar, probando crear uno nuevo...');
            testCreateUniqueService(token);
          }
        } catch (error) {
          console.log('❌ Error parsing services:', error.message);
        }
      } else {
        console.log('❌ Error obteniendo servicios:', res.statusCode, data);
      }
    });
  });
  
  getReq.end();
}

function testEditService(token, service) {
  console.log('✏️ Probando editar servicio existente...');
  
  // Datos para editar (cambiar solo la descripción)
  const editData = JSON.stringify({
    name: service.name, // Mismo nombre
    category: service.category,
    price: service.price,
    duration: service.duration || 60,
    description: (service.description || '') + ' - EDITADO',
    images: service.images || [],
    requirements: service.requirements || [],
    isActive: service.isActive !== false
  });
  
  const putOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/services/${service.id}`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(editData)
    }
  };
  
  const putReq = http.request(putOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 PUT Service Status:', res.statusCode);
      console.log('📊 PUT Response:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Edición exitosa');
      } else {
        console.log('❌ Error en edición');
      }
    });
  });
  
  putReq.write(editData);
  putReq.end();
}

function testCreateUniqueService(token) {
  console.log('➕ Probando crear servicio con nombre único...');
  
  const uniqueName = `Servicio Test ${Date.now()}`;
  const serviceData = JSON.stringify({
    name: uniqueName,
    description: 'Servicio de prueba con nombre único',
    category: 'Facial',
    price: 75.00,
    duration: 45,
    images: [],
    requirements: [],
    isActive: true
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
      console.log('📊 POST Unique Service Status:', res.statusCode);
      console.log('📊 POST Response:', data);
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ Creación exitosa con nombre único');
      } else {
        console.log('❌ Error en creación con nombre único');
      }
    });
  });
  
  postReq.write(serviceData);
  postReq.end();
}