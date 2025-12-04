// Script para verificar citas en la base de datos
const mysql = require('mysql2/promise');

async function checkBookings() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'laxmi'
    });
    
    console.log('✅ Conectado a la base de datos\n');
    
    // 1. Ver todas las citas del 3 de diciembre
    console.log('📅 Citas del 3 de diciembre 2025:\n');
    const [bookings] = await connection.execute(`
      SELECT 
        id,
        DATE_FORMAT(date_time, '%Y-%m-%d %H:%i') as fecha_hora,
        duration,
        status,
        client_id,
        service_id
      FROM bookings
      WHERE DATE(date_time) = '2025-12-03'
      ORDER BY date_time
    `);
    
    if (bookings.length === 0) {
      console.log('❌ No hay citas para el 3 de diciembre');
    } else {
      console.table(bookings);
    }
    
    // 2. Verificar específicamente la cita de las 10:00
    console.log('\n🔍 Verificando cita de las 10:00:\n');
    const [booking10am] = await connection.execute(`
      SELECT 
        id,
        DATE_FORMAT(date_time, '%Y-%m-%d %H:%i:%s') as fecha_hora_completa,
        duration,
        status,
        client_id,
        service_id,
        created_at
      FROM bookings
      WHERE DATE(date_time) = '2025-12-03'
        AND HOUR(date_time) = 10
        AND MINUTE(date_time) = 0
    `);
    
    if (booking10am.length === 0) {
      console.log('❌ No hay cita a las 10:00');
    } else {
      console.log('✅ Cita encontrada:');
      console.table(booking10am);
      
      const booking = booking10am[0];
      if (booking.status === 'confirmed' || booking.status === 'pending_payment') {
        console.log('\n✅ Esta cita DEBERÍA bloquear el horario 10:00');
        console.log(`   Status: ${booking.status}`);
        console.log(`   Duración: ${booking.duration} minutos`);
        console.log(`   Fin estimado: ${new Date(new Date(booking.fecha_hora_completa).getTime() + booking.duration * 60000).toLocaleTimeString('es-CL')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkBookings();
