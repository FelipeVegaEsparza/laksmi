// Script para corregir el canal de conversaciones de WhatsApp
require('dotenv').config();
const db = require('./dist/config/database').default;

async function fixWhatsAppConversations() {
  console.log('🔧 Corrigiendo canales de conversaciones de WhatsApp...\n');
  
  try {
    // 1. Buscar conversaciones sin canal o con canal 'web' que tienen clientes con teléfono
    console.log('1️⃣ Buscando conversaciones que deberían ser de WhatsApp...');
    
    const conversationsToFix = await db('conversations as c')
      .join('clients as cl', 'c.client_id', 'cl.id')
      .select('c.id', 'c.channel', 'cl.name', 'cl.phone')
      .where(function() {
        this.whereNull('c.channel').orWhere('c.channel', '!=', 'whatsapp');
      })
      .whereNotNull('cl.phone')
      .where('cl.phone', 'like', '+56%'); // Números chilenos
    
    console.log(`   Encontradas: ${conversationsToFix.length} conversaciones\n`);
    
    if (conversationsToFix.length === 0) {
      console.log('✅ No hay conversaciones para corregir\n');
      return;
    }
    
    // 2. Mostrar las conversaciones que se van a actualizar
    console.log('📋 Conversaciones a actualizar:');
    conversationsToFix.slice(0, 10).forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.name} (${conv.phone})`);
      console.log(`      - ID: ${conv.id.substring(0, 8)}...`);
      console.log(`      - Canal actual: ${conv.channel || 'NULL'}`);
    });
    
    if (conversationsToFix.length > 10) {
      console.log(`   ... y ${conversationsToFix.length - 10} más`);
    }
    
    // 3. Actualizar las conversaciones
    console.log('\n2️⃣ Actualizando conversaciones...');
    
    const conversationIds = conversationsToFix.map(c => c.id);
    const updated = await db('conversations')
      .whereIn('id', conversationIds)
      .update({
        channel: 'whatsapp',
        updated_at: new Date()
      });
    
    console.log(`   ✅ Actualizadas: ${updated} conversaciones\n`);
    
    // 4. Verificar el resultado
    console.log('3️⃣ Verificando resultado...');
    const verification = await db('conversations')
      .select('channel')
      .count('* as count')
      .groupBy('channel');
    
    console.log('\n📊 Conversaciones por canal (después de la corrección):');
    verification.forEach(row => {
      console.log(`   - ${row.channel || 'NULL'}: ${row.count}`);
    });
    
    console.log('\n✅ Corrección completada exitosamente\n');
    console.log('💡 Ahora cuando respondas desde el Dashboard, los mensajes se enviarán por WhatsApp\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

fixWhatsAppConversations();
