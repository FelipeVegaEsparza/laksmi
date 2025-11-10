/**
 * Script para generar secrets seguros para producción
 * Uso: node generate-production-secrets.js
 */

const crypto = require('crypto');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

function generateHex(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generatePassword(length = 24) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

log('\n' + '='.repeat(70), 'cyan');
log('🔐 GENERADOR DE SECRETS PARA PRODUCCIÓN', 'bright');
log('='.repeat(70) + '\n', 'cyan');

log('📋 Copia estos valores en tu archivo .env de producción en Easypanel\n', 'yellow');

// Database Passwords
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('🗄️  BASE DE DATOS', 'bright');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

const mysqlRootPassword = generatePassword(32);
const mysqlPassword = generatePassword(32);
const redisPassword = generatePassword(32);

log('MYSQL_ROOT_PASSWORD=' + mysqlRootPassword, 'green');
log('MYSQL_PASSWORD=' + mysqlPassword, 'green');
log('REDIS_PASSWORD=' + redisPassword + '\n', 'green');

// JWT Secrets
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('🔑 JWT SECRETS', 'bright');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

const jwtSecret = generateSecret(32);
const jwtRefreshSecret = generateSecret(32);

log('JWT_SECRET=' + jwtSecret, 'green');
log('JWT_REFRESH_SECRET=' + jwtRefreshSecret + '\n', 'green');

// Encryption Key
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('🔐 ENCRYPTION KEY', 'bright');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

const encryptionKey = generateHex(32);

log('ENCRYPTION_KEY=' + encryptionKey + '\n', 'green');

// Resumen
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log('📝 ARCHIVO .env COMPLETO PARA EASYPANEL', 'bright');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

const envContent = `# ============================================
# CONFIGURACIÓN DE PRODUCCIÓN - EASYPANEL
# Generado: ${new Date().toISOString()}
# ============================================

# Dominio principal (CAMBIAR)
DOMAIN=tu-dominio.com

# ============================================
# BASE DE DATOS MYSQL
# ============================================
MYSQL_ROOT_PASSWORD=${mysqlRootPassword}
MYSQL_DATABASE=clinica_belleza
MYSQL_USER=clinica_user
MYSQL_PASSWORD=${mysqlPassword}

# ============================================
# REDIS CACHE
# ============================================
REDIS_PASSWORD=${redisPassword}

# ============================================
# JWT SECRETS
# ============================================
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# TWILIO WHATSAPP (CONFIGURAR DESPUÉS)
# ============================================
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
TWILIO_WEBHOOK_URL=

# ============================================
# OPENAI (CONFIGURAR)
# ============================================
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4

# ============================================
# URLs DE LA APLICACIÓN (CAMBIAR DOMINIO)
# ============================================
FRONTEND_URL=https://tu-dominio.com
DASHBOARD_URL=https://dashboard.tu-dominio.com
CORS_ORIGINS=https://tu-dominio.com,https://dashboard.tu-dominio.com,https://www.tu-dominio.com

# ============================================
# SEGURIDAD
# ============================================
ENCRYPTION_KEY=${encryptionKey}
BCRYPT_ROUNDS=12

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# UPLOADS
# ============================================
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
`;

log(envContent, 'green');

log('\n' + '━'.repeat(70), 'cyan');
log('⚠️  IMPORTANTE', 'yellow');
log('━'.repeat(70) + '\n', 'cyan');

log('1. GUARDA estos valores en un lugar SEGURO', 'yellow');
log('2. NO los subas a GitHub ni los compartas', 'yellow');
log('3. Cambia "tu-dominio.com" por tu dominio real', 'yellow');
log('4. Configura TWILIO_* y OPENAI_API_KEY después', 'yellow');
log('5. Usa estos valores en Easypanel → Environment Variables\n', 'yellow');

log('━'.repeat(70), 'cyan');
log('✅ Secrets generados exitosamente', 'green');
log('━'.repeat(70) + '\n', 'cyan');

log('📚 Siguiente paso:', 'blue');
log('   1. Copia el contenido de arriba', 'blue');
log('   2. Ve a Easypanel → Tu Proyecto → Environment Variables', 'blue');
log('   3. Pega las variables', 'blue');
log('   4. Cambia el DOMAIN por tu dominio real', 'blue');
log('   5. Agrega tus credenciales de Twilio y OpenAI', 'blue');
log('   6. Guarda y despliega\n', 'blue');

log('🎉 ¡Listo para desplegar!\n', 'green');
