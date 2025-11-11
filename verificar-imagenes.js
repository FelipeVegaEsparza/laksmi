const axios = require('axios');

async function verificarImagenes() {
  console.log('🔍 Verificando configuración de imágenes...\n');

  try {
    // 1. Verificar que el backend esté funcionando
    console.log('1️⃣ Verificando backend...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('   ✅ Backend funcionando:', healthResponse.data.status);

    // 2. Obtener un servicio de ejemplo
    console.log('\n2️⃣ Obteniendo servicios...');
    const servicesResponse = await axios.get('http://localhost:3000/api/v1/services/public');
    const services = servicesResponse.data.data?.services || servicesResponse.data.data || [];
    
    if (services.length === 0) {
      console.log('   ⚠️  No hay servicios en la base de datos');
      return;
    }

    const firstService = services[0];
    console.log('   ✅ Servicios obtenidos:', services.length);
    console.log('   📋 Primer servicio:', firstService.name);

    // 3. Verificar formato de URLs de imágenes
    console.log('\n3️⃣ Verificando formato de URLs...');
    if (firstService.images && firstService.images.length > 0) {
      const imageUrl = firstService.images[0];
      console.log('   📸 URL de imagen:', imageUrl);

      // Verificar si tiene entidades HTML escapadas
      if (imageUrl.includes('&#x2F;') || imageUrl.includes('&amp;')) {
        console.log('   ❌ ERROR: La URL tiene entidades HTML escapadas');
        console.log('   🔧 Necesitas reiniciar el backend o limpiar la BD');
      } else {
        console.log('   ✅ URL correctamente formateada');
      }

      // 4. Intentar acceder a la imagen
      console.log('\n4️⃣ Verificando acceso a la imagen...');
      try {
        // Extraer la ruta relativa
        const urlObj = new URL(imageUrl);
        const imagePath = urlObj.pathname;
        const imageFullUrl = `http://localhost:3000${imagePath}`;
        
        console.log('   🔗 Intentando acceder a:', imageFullUrl);
        
        const imageResponse = await axios.get(imageFullUrl, {
          responseType: 'arraybuffer',
          timeout: 5000
        });
        
        console.log('   ✅ Imagen accesible');
        console.log('   📊 Tamaño:', (imageResponse.data.length / 1024).toFixed(2), 'KB');
        console.log('   📄 Tipo:', imageResponse.headers['content-type']);
      } catch (imageError) {
        if (imageError.response) {
          console.log('   ❌ Error al acceder a la imagen:', imageError.response.status);
          console.log('   💡 La imagen no existe en el servidor');
        } else {
          console.log('   ❌ Error de red:', imageError.message);
        }
      }
    } else {
      console.log('   ⚠️  El servicio no tiene imágenes');
    }

    // 5. Verificar productos
    console.log('\n5️⃣ Verificando productos...');
    try {
      const productsResponse = await axios.get('http://localhost:3000/api/v1/products/public');
      const products = productsResponse.data.data?.products || productsResponse.data.data || [];
      console.log('   ✅ Productos obtenidos:', products.length);
      
      if (products.length > 0 && products[0].images && products[0].images.length > 0) {
        const productImageUrl = products[0].images[0];
        console.log('   📸 URL de imagen de producto:', productImageUrl);
        
        if (productImageUrl.includes('&#x2F;') || productImageUrl.includes('&amp;')) {
          console.log('   ❌ ERROR: La URL tiene entidades HTML escapadas');
        } else {
          console.log('   ✅ URL correctamente formateada');
        }
      }
    } catch (error) {
      console.log('   ⚠️  No se pudieron obtener productos');
    }

    // Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN');
    console.log('='.repeat(50));
    console.log('✅ Backend: Funcionando');
    console.log('✅ API: Respondiendo');
    console.log('✅ Servicios:', services.length, 'encontrados');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Abre http://localhost:3001/servicios en tu navegador');
    console.log('2. Abre DevTools (F12) y ve a la pestaña Console');
    console.log('3. Busca mensajes de ServiceImage para ver si las imágenes cargan');
    console.log('4. Si ves errores 404, las imágenes no existen en el servidor');
    console.log('5. Sube nuevas imágenes desde el dashboard para probar');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 El backend no está respondiendo.');
      console.log('   Verifica que Docker esté corriendo:');
      console.log('   docker-compose ps');
    }
  }
}

verificarImagenes();
