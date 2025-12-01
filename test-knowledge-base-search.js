// Script para probar la búsqueda en la base de conocimientos
const http = require('http');

console.log('🔍 Probando búsqueda en base de conocimientos...\n');

// 1. Login
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
      console.log('✅ Login exitoso\n');
      
      // 2. Listar todas las FAQs
      listAllFAQs(token);
      
      // 3. Buscar en la base de conocimientos
      setTimeout(() => searchKnowledge(token, 'facial'), 1000);
      setTimeout(() => searchKnowledge(token, 'manicure'), 2000);
      setTimeout(() => searchKnowledge(token, 'cancelación'), 3000);
      
    } else {
      console.log('❌ Login falló:', res.statusCode);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Error en login:', error.message);
});

loginReq.write(loginData);
loginReq.end();

function listAllFAQs(token) {
  console.log('📋 Listando todas las FAQs...\n');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/knowledge/faqs',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          const faqs = response.data || response;
          
          console.log(`📊 Total de FAQs: ${faqs.length}\n`);
          
          if (faqs.length > 0) {
            console.log('FAQs disponibles:');
            faqs.forEach((faq, index) => {
              console.log(`\n${index + 1}. ${faq.question}`);
              console.log(`   Respuesta: ${faq.answer.substring(0, 100)}...`);
              console.log(`   Activa: ${faq.isActive}`);
            });
          } else {
            console.log('⚠️  No hay FAQs en la base de datos');
          }
          
          console.log('\n' + '='.repeat(60) + '\n');
        } catch (error) {
          console.log('❌ Error parsing FAQs:', error.message);
          console.log('Raw response:', data);
        }
      } else {
        console.log('❌ Error obteniendo FAQs:', res.statusCode);
        console.log('Response:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error en request:', error.message);
  });
  
  req.end();
}

function searchKnowledge(token, query) {
  console.log(`🔎 Buscando: "${query}"...\n`);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/knowledge/search?query=${encodeURIComponent(query)}&limit=5`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          const results = response.data?.results || response.results || [];
          
          console.log(`📊 Resultados para "${query}": ${results.length}\n`);
          
          if (results.length > 0) {
            results.forEach((result, index) => {
              console.log(`${index + 1}. [${result.type}] ${result.title}`);
              console.log(`   ${result.content.substring(0, 100)}...`);
              console.log(`   Relevancia: ${result.relevance}`);
            });
          } else {
            console.log(`⚠️  No se encontraron resultados para "${query}"`);
          }
          
          console.log('\n' + '='.repeat(60) + '\n');
        } catch (error) {
          console.log('❌ Error parsing search results:', error.message);
          console.log('Raw response:', data);
        }
      } else {
        console.log('❌ Error en búsqueda:', res.statusCode);
        console.log('Response:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error en request:', error.message);
  });
  
  req.end();
}
