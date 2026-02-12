// Script para verificar los canales de las conversaciones
require('dotenv').config();
const db = require('./dist/config/database').default;

async function checkConversationChannels() {
  console.log('🔍 Verificando canales de conversaciones...\n');
  
  try {
    // Obtener todas las conversaciones
    const conversations = await db('conversations')
      .select('id', 'client_id', 'channel', 'status', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(20);
    
    console.log(`📊 Total de conversaciones (últimas 20): ${conversations.length}\n`);
    
    // Agrupar por canal
    const byChannel = {};
    conversations.forEach(conv => {
      const channel = conv.channel || 'NULL';
      byChannel[channel] = (byChannel[channel] || 0) + 1;
    });
    
    console.log('📈 Conversaciones por canal:');
    Object.entries(byChannel).forEach(([channel, count]) => {
      console.log(`   - ${channel}: ${count}`);
    });
    
    console.log('\n📋 Últimas 10 conversaciones:');
    conversations.slice(0, 10).forEach((conv, index) => {
      console.log(`\n${index + 1}. Conversación: ${conv.id.substring(0, 8)}...`);
      console.log(`   - Cliente: ${conv.client_id.substring(0, 8)}...`);
      console.log(`   - Canal: ${conv.channel || 'NULL'}`);
      console.log(`   - Estado: ${conv.status}`);
      console.log(`   - Creada: ${conv.created_at}`);
    });
    
    // Verificar si hay conversaciones sin canal
    const withoutChannel = conversations.filter(c => !c.channel);
    if (withoutChannel.length > 0) {
      console.log(`\n⚠️  PROBLEMA ENCONTRADO: ${withoutChannel.length} conversaciones sin canal definido`);
      console.log('   Estas conversaciones NO enviarán mensajes por WhatsApp cuando el agente responda.');
    }
    
    // Verificar clientes
    console.log('\n\n🔍 Verificando clientes...');
    const clients = await db('clients')
      .select('id', 'name', 'phone', 'email')
      .limit(10);
    
    console.log(`\n📊 Total de clientes (primeros 10): ${clients.length}`);
    clients.forEach((client, index) => {
      console.log(`\n${index + 1}. Cliente: ${client.name}`);
      console.log(`   - ID: ${client.id.substring(0, 8)}...`);
      console.log(`   - Teléfono: ${client.phone || 'NULL'}`);
      console.log(`   - Email: ${client.email || 'NULL'}`);
    });
    
    console.log('\n✅ Verificación completada\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

checkConversationChannels();
