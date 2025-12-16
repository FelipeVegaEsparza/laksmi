// Script para diagnosticar el problema de disponibilidad
// Ejecutar desde la raíz del proyecto con: node debug-availability-issue.js

const path = require('path');
const knex = require('knex');

async function diagnose() {
  // Usar la misma configuración que el backend
  const connection = knex({
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'laxmi_db',
      timezone: 'Z' // UTC
    }
  });

  console.log('🔍 Diagnóstico de Disponibilidad\n');
  console.log('='.repeat(60));

  // 1. Ver la reserva del 18 de diciembre a las 13:00
  console.log('\n📅 Reservas para el 18 de diciembre de 2025:');
  const [bookings] = await connection.execute(`
    SELECT 
      id,
      date_time,
      DATE_FORMAT(date_time, '%Y-%m-%d %H:%i:%s') as formatted_date,
      CONVERT_TZ(date_time, '+00:00', '-03:00') as chile_time,
      duration,
      status,
      service_id
    FROM bookings
    WHERE DATE(date_time) = '2025-12-18'
    ORDER BY date_time
  `);

  console.table(bookings);

  // 2. Simular la consulta de disponibilidad para ese día
  console.log('\n🔍 Simulando consulta de disponibilidad para 18-12-2025 a las 13:00:');
  
  // La fecha que llega desde el frontend (en hora de Chile)
  const requestedDateTime = new Date('2025-12-18T13:00:00-03:00'); // 13:00 Chile
  console.log('Fecha solicitada (Chile):', requestedDateTime.toLocaleString('es-CL', { timeZone: 'America/Santiago' }));
  console.log('Fecha solicitada (UTC):', requestedDateTime.toISOString());
  console.log('Fecha solicitada (timestamp):', requestedDateTime.getTime());

  // 3. Verificar si hay conflictos
  const duration = 120; // minutos
  const endTime = new Date(requestedDateTime.getTime() + duration * 60000);
  
  console.log('\n⏰ Rango de tiempo a verificar:');
  console.log('Inicio:', requestedDateTime.toISOString());
  console.log('Fin:', endTime.toISOString());

  const [conflicts] = await connection.execute(`
    SELECT 
      id,
      date_time,
      DATE_FORMAT(date_time, '%Y-%m-%d %H:%i:%s') as formatted_date,
      CONVERT_TZ(date_time, '+00:00', '-03:00') as chile_time,
      duration,
      status,
      DATE_ADD(date_time, INTERVAL duration MINUTE) as end_time
    FROM bookings
    WHERE status IN ('confirmed', 'pending_payment')
    AND (
      (date_time <= ? AND DATE_ADD(date_time, INTERVAL duration MINUTE) > ?)
      OR (date_time < ? AND DATE_ADD(date_time, INTERVAL duration MINUTE) >= ?)
      OR (date_time >= ? AND date_time < ?)
    )
  `, [
    requestedDateTime,
    requestedDateTime,
    endTime,
    endTime,
    requestedDateTime,
    endTime
  ]);

  console.log('\n⚠️ Conflictos encontrados:');
  if (conflicts.length > 0) {
    console.table(conflicts);
  } else {
    console.log('✅ No se encontraron conflictos (por eso aparece como disponible)');
  }

  // 4. Verificar la zona horaria de MySQL
  const [tzResult] = await connection.execute('SELECT @@global.time_zone, @@session.time_zone');
  console.log('\n🌍 Zona horaria de MySQL:');
  console.table(tzResult);

  await connection.end();
}

diagnose().catch(console.error);
