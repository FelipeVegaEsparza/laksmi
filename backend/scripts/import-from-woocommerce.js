/**
 * Script de Importación de Servicios desde WooCommerce
 * 
 * Este script importa productos de WooCommerce como servicios en Laxmi
 * - Descarga imágenes desde WordPress
 * - Sube imágenes al servidor de Laxmi
 * - Crea servicios usando la API de Laxmi
 * 
 * Uso: node backend/scripts/import-from-woocommerce.js
 */

require('dotenv').config({ path: './backend/scripts/.env.import' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  // WooCommerce
  woocommerce: {
    url: process.env.WOOCOMMERCE_URL, // ej: https://viejosite.com
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
  },
  // Laxmi API
  laxmi: {
    apiUrl: process.env.LAXMI_API_URL, // ej: https://api.laxmi.com
    authToken: process.env.LAXMI_AUTH_TOKEN, // Token de usuario admin
  },
  // Configuración de servicios
  defaults: {
    duration: 60, // minutos
    sessions: 1,
    isActive: true,
  },
  // Carpeta temporal para imágenes
  tempDir: path.join(__dirname, 'temp-images'),
};

// ============================================
// UTILIDADES
// ============================================

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  progress: (current, total) => console.log(`📊 Progreso: ${current}/${total}`),
};

// Crear carpeta temporal si no existe
function ensureTempDir() {
  if (!fs.existsSync(CONFIG.tempDir)) {
    fs.mkdirSync(CONFIG.tempDir, { recursive: true });
    log.info(`Carpeta temporal creada: ${CONFIG.tempDir}`);
  }
}

// Limpiar carpeta temporal
function cleanTempDir() {
  if (fs.existsSync(CONFIG.tempDir)) {
    fs.rmSync(CONFIG.tempDir, { recursive: true, force: true });
    log.info('Carpeta temporal limpiada');
  }
}

// Validar configuración
function validateConfig() {
  const required = [
    'WOOCOMMERCE_URL',
    'WOOCOMMERCE_CONSUMER_KEY',
    'WOOCOMMERCE_CONSUMER_SECRET',
    'LAXMI_API_URL',
    'LAXMI_AUTH_TOKEN',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log.error(`Faltan variables de entorno: ${missing.join(', ')}`);
    log.info('Revisa el archivo backend/scripts/.env.import');
    process.exit(1);
  }

  log.success('Configuración validada correctamente');
}

// ============================================
// FUNCIONES DE WOOCOMMERCE
// ============================================

async function fetchWooCommerceProducts() {
  log.info('Obteniendo productos de WooCommerce...');
  
  try {
    const response = await axios.get(
      `${CONFIG.woocommerce.url}/wp-json/wc/v3/products`,
      {
        auth: {
          username: CONFIG.woocommerce.consumerKey,
          password: CONFIG.woocommerce.consumerSecret,
        },
        params: {
          per_page: 100, // Máximo por página
          status: 'publish', // Solo productos publicados
        },
      }
    );

    log.success(`${response.data.length} productos obtenidos de WooCommerce`);
    return response.data;
  } catch (error) {
    log.error(`Error al obtener productos de WooCommerce: ${error.message}`);
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// ============================================
// FUNCIONES DE DESCARGA DE IMÁGENES
// ============================================

async function downloadImage(url, filename) {
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30000, // 30 segundos
    });

    const filepath = path.join(CONFIG.tempDir, filename);
    const writer = fs.createWriteStream(filepath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filepath));
      writer.on('error', reject);
    });
  } catch (error) {
    log.warn(`Error descargando imagen ${url}: ${error.message}`);
    return null;
  }
}

async function downloadProductImages(product) {
  const images = [];
  
  if (!product.images || product.images.length === 0) {
    log.warn(`Producto "${product.name}" no tiene imágenes`);
    return images;
  }

  log.info(`Descargando ${product.images.length} imagen(es) de "${product.name}"...`);

  for (let i = 0; i < product.images.length; i++) {
    const image = product.images[i];
    const ext = path.extname(image.src) || '.jpg';
    const filename = `product-${product.id}-${i}${ext}`;
    
    const filepath = await downloadImage(image.src, filename);
    if (filepath) {
      images.push(filepath);
    }
  }

  log.success(`${images.length} imagen(es) descargadas para "${product.name}"`);
  return images;
}

// ============================================
// FUNCIONES DE LAXMI API
// ============================================

async function uploadImageToLaxmi(filepath) {
  try {
    const formData = new FormData();
    formData.append('images', fs.createReadStream(filepath));

    const response = await axios.post(
      `${CONFIG.laxmi.apiUrl}/api/v1/upload/services`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${CONFIG.laxmi.authToken}`,
        },
        timeout: 60000, // 60 segundos
      }
    );

    // El endpoint devuelve un array de URLs
    const urls = response.data.data?.urls || response.data.urls || [];
    return urls[0] || null;
  } catch (error) {
    log.error(`Error subiendo imagen a Laxmi: ${error.message}`);
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

async function uploadImagesToLaxmi(localPaths) {
  const uploadedUrls = [];

  for (const filepath of localPaths) {
    log.info(`Subiendo imagen: ${path.basename(filepath)}`);
    const url = await uploadImageToLaxmi(filepath);
    
    if (url) {
      uploadedUrls.push(url);
      log.success(`Imagen subida: ${url}`);
    }
  }

  return uploadedUrls;
}

async function createServiceInLaxmi(serviceData) {
  try {
    const response = await axios.post(
      `${CONFIG.laxmi.apiUrl}/api/v1/services`,
      serviceData,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.laxmi.authToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error) {
    log.error(`Error creando servicio en Laxmi: ${error.message}`);
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// ============================================
// MAPEO DE DATOS
// ============================================

function mapWooCommerceToLaxmi(product, uploadedImages) {
  // Obtener categoría principal
  const category = product.categories && product.categories.length > 0
    ? product.categories[0].name
    : 'Sin categoría';

  // Limpiar HTML de las descripciones
  const description = product.description || '';
  const benefits = product.short_description || '';

  return {
    name: product.name,
    category: category,
    price: parseFloat(product.price) || 0,
    duration: CONFIG.defaults.duration,
    description: description,
    benefits: benefits,
    images: uploadedImages,
    requirements: [],
    isActive: CONFIG.defaults.isActive,
    sessions: CONFIG.defaults.sessions,
    tag: product.featured ? 'Popular' : '',
  };
}

// ============================================
// PROCESO PRINCIPAL
// ============================================

async function importProduct(product, index, total) {
  log.info(`\n${'='.repeat(60)}`);
  log.progress(index + 1, total);
  log.info(`Procesando: "${product.name}" (ID: ${product.id})`);
  log.info(`${'='.repeat(60)}`);

  try {
    // 1. Descargar imágenes del producto
    const localImages = await downloadProductImages(product);

    // 2. Subir imágenes a Laxmi
    let uploadedImages = [];
    if (localImages.length > 0) {
      uploadedImages = await uploadImagesToLaxmi(localImages);
    }

    // 3. Mapear datos
    const serviceData = mapWooCommerceToLaxmi(product, uploadedImages);

    // 4. Crear servicio en Laxmi
    log.info(`Creando servicio en Laxmi...`);
    const result = await createServiceInLaxmi(serviceData);

    log.success(`✨ Servicio "${product.name}" importado exitosamente!`);
    
    return {
      success: true,
      productId: product.id,
      productName: product.name,
      serviceId: result.data?.id || result.id,
    };
  } catch (error) {
    log.error(`Error importando "${product.name}": ${error.message}`);
    return {
      success: false,
      productId: product.id,
      productName: product.name,
      error: error.message,
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 IMPORTACIÓN DE SERVICIOS DESDE WOOCOMMERCE');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Validar configuración
    validateConfig();

    // 2. Preparar carpeta temporal
    ensureTempDir();

    // 3. Obtener productos de WooCommerce
    const products = await fetchWooCommerceProducts();

    if (products.length === 0) {
      log.warn('No hay productos para importar');
      return;
    }

    // 4. Importar cada producto
    const results = [];
    for (let i = 0; i < products.length; i++) {
      const result = await importProduct(products[i], i, products.length);
      results.push(result);
      
      // Pequeña pausa entre importaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 5. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    log.info(`Total procesados: ${results.length}`);
    log.success(`Exitosos: ${successful}`);
    if (failed > 0) {
      log.error(`Fallidos: ${failed}`);
      console.log('\nProductos fallidos:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.productName} (ID: ${r.productId}): ${r.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    log.success('🎉 Importación completada!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    log.error(`Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Limpiar carpeta temporal
    cleanTempDir();
  }
}

// Ejecutar script
main();
