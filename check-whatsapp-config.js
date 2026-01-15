// Script para verificar configuración de WhatsApp en company_settings
const mysql = require('mysql2/promise');

async function checkWhatsAppConfig() {
  console.log('🔍 Verificando configuración de WhatsApp...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'clinica_belleza'
  });

  try {
    // Verificar si existe la tabla
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'company_settings'"
    );

    if (tables.length === 0) {
      console.log('❌ La tabla company_settings no existe');
      return;
    }

    console.log('✅ Tabla company_settings existe\n');

    // Verificar estructura de la tabla
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM company_settings LIKE 'contact_whatsapp'"
    );

    if (columns.length === 0) {
      console.log('❌ La columna contact_whatsapp no existe');
      console.log('💡 Ejecuta la migración 015_add_whatsapp_to_company_settings.sql\n');
      return;
    }

    console.log('✅ Columna contact_whatsapp existe\n');

    // Obtener configuración actual
    const [settings] = await connection.query(
      'SELECT id, company_name, contact_whatsapp, contact_phone, contact_email FROM company_settings LIMIT 1'
    );

    if (settings.length === 0) {
      console.log('⚠️ No hay registros en company_settings');
      console.log('💡 Necesitas crear un registro inicial\n');
      
      // Ofrecer crear registro inicial
      console.log('📝 Puedes ejecutar este SQL para crear un registro inicial:');
      console.log(`
INSERT INTO company_settings (
  company_name,
  contact_whatsapp,
  contact_phone,
  contact_email,
  maintenance_mode,
  dashboard_primary_color,
  dashboard_secondary_color,
  dashboard_background_color,
  dashboard_text_color,
  frontend_primary_color,
  frontend_secondary_color,
  frontend_background_color,
  frontend_text_color
) VALUES (
  'Laxmi',
  '+56912345678',  -- CAMBIA ESTO POR TU NÚMERO REAL
  '+56912345678',
  'contacto@laxmi.cl',
  0,
  '#8B4789',
  '#D4A5D4',
  '#F5F5F5',
  '#333333',
  '#8B4789',
  '#D4A5D4',
  '#FFFFFF',
  '#333333'
);
      `);
      return;
    }

    const config = settings[0];
    console.log('📋 Configuración actual:');
    console.log('   ID:', config.id);
    console.log('   Empresa:', config.company_name);
    console.log('   Email:', config.contact_email || '(no configurado)');
    console.log('   Teléfono:', config.contact_phone || '(no configurado)');
    console.log('   WhatsApp:', config.contact_whatsapp || '(no configurado)');
    console.log('');

    if (!config.contact_whatsapp) {
      console.log('⚠️ El número de WhatsApp NO está configurado');
      console.log('💡 Actualiza el registro con este SQL:');
      console.log(`
UPDATE company_settings 
SET contact_whatsapp = '+56912345678'  -- CAMBIA ESTO POR TU NÚMERO REAL
WHERE id = '${config.id}';
      `);
      console.log('');
      console.log('📱 Formato recomendado: +56912345678 (con código de país, sin espacios)');
    } else {
      console.log('✅ Número de WhatsApp configurado correctamente');
      
      // Generar link de prueba
      const cleanNumber = config.contact_whatsapp.replace(/[^\d+]/g, '');
      const message = encodeURIComponent('Hola, vengo desde el sitio web. Necesito hablar con un humano');
      const whatsappLink = `https://wa.me/${cleanNumber}?text=${message}`;
      
      console.log('');
      console.log('🔗 Link de WhatsApp que se generará:');
      console.log(whatsappLink);
      console.log('');
      console.log('💡 Prueba este link en tu navegador para verificar que funciona');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkWhatsAppConfig().catch(console.error);
