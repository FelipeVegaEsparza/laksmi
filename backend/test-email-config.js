/**
 * Script para probar la configuración de email
 * Uso: node test-email-config.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('\n🔍 Verificando configuración de email...\n');
  
  // Verificar variables de entorno
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM
  };
  
  console.log('📋 Configuración actual:');
  console.log('  Host:', config.host);
  console.log('  Port:', config.port);
  console.log('  User:', config.user ? '✅ Configurado' : '❌ NO configurado');
  console.log('  Pass:', config.pass ? '✅ Configurado' : '❌ NO configurado');
  console.log('  From:', config.from || `"Clínica de Belleza" <${config.user}>`);
  console.log('');
  
  if (!config.user || !config.pass) {
    console.error('❌ ERROR: SMTP_USER y SMTP_PASS deben estar configurados');
    console.log('\n💡 Configura las variables de entorno en .env:');
    console.log('   SMTP_HOST=smtp.resend.com');
    console.log('   SMTP_PORT=587');
    console.log('   SMTP_USER=resend');
    console.log('   SMTP_PASS=re_tu_api_key_aqui');
    process.exit(1);
  }
  
  // Crear transporter
  console.log('🔧 Creando transporter...');
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      minVersion: 'TLSv1'
    },
    pool: false,
    maxConnections: 1,
    maxMessages: 1,
    debug: true,
    logger: true
  });
  
  // Verificar conexión
  console.log('🔌 Verificando conexión al servidor SMTP...');
  console.log('⏳ Esto puede tomar hasta 60 segundos...\n');
  
  try {
    await transporter.verify();
    console.log('✅ ¡Conexión exitosa! El servidor SMTP está listo para enviar emails\n');
    
    // Preguntar si quiere enviar un email de prueba
    console.log('📧 ¿Quieres enviar un email de prueba?');
    console.log('   Edita este script y cambia TEST_EMAIL a tu email\n');
    
    const TEST_EMAIL = process.env.TEST_EMAIL || 'contacto@esteticalaksmi.cl';
    
    if (process.argv.includes('--send')) {
      console.log(`📤 Enviando email de prueba a ${TEST_EMAIL}...`);
      
      const info = await transporter.sendMail({
        from: config.from || `"Clínica de Belleza" <${config.user}>`,
        to: TEST_EMAIL,
        subject: '✅ Prueba de Email - Sistema Funcionando',
        html: `
          <h1>✅ ¡Email funcionando correctamente!</h1>
          <p>Este es un email de prueba del sistema de Clínica de Belleza.</p>
          <p><strong>Configuración:</strong></p>
          <ul>
            <li>Host: ${config.host}</li>
            <li>Port: ${config.port}</li>
            <li>Fecha: ${new Date().toLocaleString('es-ES')}</li>
          </ul>
          <p>Si recibes este email, significa que la configuración SMTP está funcionando correctamente.</p>
        `,
        text: '✅ Email funcionando correctamente! Este es un email de prueba del sistema.'
      });
      
      console.log('✅ Email enviado exitosamente!');
      console.log('   Message ID:', info.messageId);
      console.log('   Response:', info.response);
    } else {
      console.log('💡 Para enviar un email de prueba, ejecuta:');
      console.log('   node test-email-config.js --send');
    }
    
  } catch (error) {
    console.error('❌ Error al conectar con el servidor SMTP:\n');
    console.error('Código:', error.code);
    console.error('Comando:', error.command);
    console.error('Mensaje:', error.message);
    console.error('');
    
    // Diagnóstico según el error
    if (error.code === 'ETIMEDOUT') {
      console.error('⚠️  TIMEOUT DE CONEXIÓN');
      console.error('');
      console.error('Posibles causas:');
      console.error('  1. Firewall bloqueando conexiones SMTP salientes');
      console.error('  2. El servidor SMTP no es accesible desde tu red');
      console.error('  3. Host o puerto incorrectos');
      console.error('  4. Restricciones de red en Docker/Easypanel');
      console.error('');
      console.error('💡 Soluciones recomendadas:');
      console.error('  1. Usa Resend (smtp.resend.com) - Funciona en Docker');
      console.error('  2. Usa SendGrid (smtp.sendgrid.net)');
      console.error('  3. Usa Mailgun (smtp.mailgun.org)');
      console.error('');
      console.error('📖 Ver SOLUCION-EMAIL-PRODUCCION.md para más detalles');
      
    } else if (error.code === 'EAUTH') {
      console.error('⚠️  ERROR DE AUTENTICACIÓN');
      console.error('');
      console.error('Las credenciales SMTP son incorrectas.');
      console.error('Verifica:');
      console.error('  - SMTP_USER está correcto');
      console.error('  - SMTP_PASS está correcto');
      console.error('  - Si usas Gmail, necesitas un "App Password"');
      
    } else if (error.code === 'ECONNECTION' || error.code === 'ECONNREFUSED') {
      console.error('⚠️  ERROR DE CONEXIÓN');
      console.error('');
      console.error('No se puede conectar al servidor SMTP.');
      console.error('Verifica:');
      console.error('  - SMTP_HOST está correcto');
      console.error('  - SMTP_PORT está correcto');
      console.error('  - El servidor está en línea');
      
    } else {
      console.error('⚠️  ERROR DESCONOCIDO');
      console.error('');
      console.error('Revisa la documentación de tu proveedor SMTP');
    }
    
    process.exit(1);
  }
  
  console.log('\n✅ Prueba completada\n');
}

// Ejecutar
testEmailConfig().catch(error => {
  console.error('❌ Error inesperado:', error);
  process.exit(1);
});
