const axios = require('axios');

const API_URL = 'https://api.esteticalaksmi.cl/api/v1';

async function testPollingEndpoint() {
  try {
    console.log('🧪 Testing polling endpoint...\n');
    
    // Primero, necesitamos un conversationId real
    // Vamos a buscar conversaciones activas
    console.log('📋 Step 1: Getting active conversations...');
    
    // Como el endpoint de conversaciones requiere auth, vamos a probar directamente con un ID
    // Primero intentemos crear una conversación enviando un mensaje
    
    console.log('\n📨 Step 2: Sending a test message to create conversation...');
    const messageResponse = await axios.post(`${API_URL}/ai/message`, {
      content: 'Hola, quiero información sobre servicios',
      clientId: 'test-client-' + Date.now(),
      channel: 'web'
    });
    
    console.log('✅ Message sent successfully');
    console.log('Response:', JSON.stringify(messageResponse.data, null, 2));
    
    const conversationId = messageResponse.data.data?.conversationId || messageResponse.data.conversationId;
    console.log('\n💬 Conversation ID:', conversationId);
    
    if (!conversationId) {
      console.error('❌ No conversation ID in response!');
      return;
    }
    
    // Ahora probemos el endpoint de polling
    console.log('\n📡 Step 3: Testing polling endpoint...');
    const pollResponse = await axios.get(`${API_URL}/ai/messages/${conversationId}`);
    
    console.log('✅ Polling endpoint works!');
    console.log('Response structure:', JSON.stringify(pollResponse.data, null, 2));
    
    // Probar con timestamp
    console.log('\n⏰ Step 4: Testing polling with timestamp filter...');
    const now = new Date().toISOString();
    const pollWithTimestamp = await axios.get(`${API_URL}/ai/messages/${conversationId}?since=${encodeURIComponent(now)}`);
    
    console.log('✅ Polling with timestamp works!');
    console.log('Filtered messages:', pollWithTimestamp.data.data?.messages?.length || 0);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testPollingEndpoint();
