// Verificar servicios existentes y limpiar si es necesario
const http = require('http');

console.log('🔍 Verificando servicios existentes...');

// Login
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
      
      // Obtener todos los servicios
      getAllServices(token);
      
    } else {
      console.log('❌ Login falló');
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function getAllServices(token) {
  console.log('📋 Obteniendo TODOS los servicios...');
  
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
          let services = [];
          
          // El response puede tener diferentes estructuras
          if (response.data && Array.isArray(response.data)) {
            services = response.data;
          } else if (response.data && response.data.services) {
            services = response.data.services;
          } else if (Array.isArray(response)) {
            services = response;
          }
          
          console.log('📊 Total de servicios encontrados:', services.length);
          
          if (services.length > 0) {
            console.log('📋 Lista de servicios:');
            services.forEach((service, index) => {
              console.log(`  ${index + 1}. ID: ${service.id}`);
              console.log(`     Nombre: "${service.name}"`);
              console.log(`     Categoría: ${service.category}`);
              console.log(`     Activo: ${service.isActive}`);
              console.log('     ---');
            });
            
            // Verificar si hay duplicados
            const names = services.map(s => s.name.toLowerCase());
            const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
            
            if (duplicates.length > 0) {
              console.log('⚠️ DUPLICADOS ENCONTRADOS:', [...new Set(duplicates)]);
            } else {
              console.log('✅ No hay nombres duplicados');
            }
            
          } else {
            console.log('📭 No hay servicios en la base de datos');
          }
          
        } catch (error) {
          console.log('❌ Error parsing services:', error.message);
          console.log('Raw response:', data);
        }
      } else {
        console.log('❌ Error obteniendo servicios:', res.statusCode);
        console.log('Response:', data);
      }
    });
  });
  
  getReq.end();
}