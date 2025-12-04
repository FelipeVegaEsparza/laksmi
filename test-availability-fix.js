// Script para probar la disponibilidad después del fix
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

async function testAvailability() {
  try {
    console.log('🔍 Probando disponibilidad...\n');
    
    // 1. Obtener servicios
    console.log('1️⃣ Obteniendo servicios...');
    const servicesRes = await axios.get(`${API_URL}/services`);
    const service = servicesRes.data.services[0];
    console.log(`✅ Servicio: ${service.name} (${service.id})`);
    console.log(`   Duración: ${service.duration} minutos\n`);
    
    // 2. Obtener citas existentes para el 3 de diciembre
    console.log('2️⃣ Obteniendo citas existentes...');
    const bookingsRes = await axios.get(`${API_URL}/bookings`, {
      params: {
        dateFrom: '2025-12-03',
        dateTo: '2025-12-03'
      }
    });
    console.log(`✅ Citas encontradas: ${bookingsRes.data.bookings.length}`);
    bookingsRes.data.bookings.forEach(booking => {
      const dateTime = new Date(booking.dateTime);
      console.log(`   - ${dateTime.toLocaleString('es-CL')} - ${booking.status} - ${booking.client?.name}`);
    });
    console.log('');
    
    // 3. Consultar disponibilidad para el 3 de diciembre
    console.log('3️⃣ Consultando disponibilidad...');
    const availabilityRes = await axios.get(`${API_URL}/bookings/availability`, {
      params: {
        serviceId: service.id,
        dateFrom: '2025-12-03T00:00:00.000Z',
        dateTo: '2025-12-03T23:59:59.999Z'
      }
    });
    
    const slots = availabilityRes.data.slots;
    console.log(`✅ Slots generados: ${slots.length}`);
    
    // Filtrar solo slots disponibles
    const availableSlots = slots.filter(s => s.available);
    const unavailableSlots = slots.filter(s => !s.available);
    
    console.log(`   Disponibles: ${availableSlots.length}`);
    console.log(`   No disponibles: ${unavailableSlots.length}\n`);
    
    // 4. Verificar si 10:00 está disponible
    console.log('4️⃣ Verificando horario 10:00...');
    const slot10am = slots.find(s => {
      const slotTime = new Date(s.dateTime);
      return slotTime.getHours() === 10 && slotTime.getMinutes() === 0;
    });
    
    if (slot10am) {
      console.log(`   Hora: 10:00`);
      console.log(`   Estado: ${slot10am.available ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}`);
      console.log(`   Duración: ${slot10am.duration} minutos\n`);
      
      if (slot10am.available) {
        console.log('⚠️  ERROR: El horario 10:00 debería estar NO DISPONIBLE');
        console.log('   Hay una cita confirmada a esa hora.');
      } else {
        console.log('✅ CORRECTO: El horario 10:00 está marcado como no disponible');
      }
    } else {
      console.log('   ❌ No se encontró slot para las 10:00');
    }
    
    // 5. Mostrar todos los slots disponibles
    console.log('\n5️⃣ Horarios disponibles:');
    availableSlots.forEach(slot => {
      const slotTime = new Date(slot.dateTime);
      console.log(`   - ${slotTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAvailability();
