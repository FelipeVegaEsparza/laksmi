const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Limpiar tabla existente
  await knex('scheduled_notifications').del();

  // Obtener algunos clientes y citas para crear notificaciones de ejemplo
  const clients = await knex('clients').select('id').limit(3);
  const bookings = await knex('bookings').select('id', 'client_id', 'date_time').limit(5);
  
  if (clients.length === 0) {
    console.log('No hay clientes, saltando creación de notificaciones');
    return;
  }

  const notifications = [];
  const now = new Date();

  // Notificaciones de recordatorio para citas futuras
  for (const booking of bookings) {
    const bookingDate = new Date(booking.date_time);
    
    // Solo crear recordatorios para citas futuras
    if (bookingDate > now) {
      const reminderTime = new Date(bookingDate);
      reminderTime.setHours(reminderTime.getHours() - 24);
      
      // Solo si el recordatorio es en el futuro
      if (reminderTime > now) {
        notifications.push({
          id: uuidv4(),
          client_id: booking.client_id,
          booking_id: booking.id,
          type: 'appointment_reminder',
          channel: 'whatsapp',
          scheduled_for: reminderTime,
          status: 'pending',
          template_name: 'appointment_reminder',
          template_data: JSON.stringify({
            bookingId: booking.id,
            clientName: 'Cliente de prueba',
            serviceName: 'Servicio de prueba',
            appointmentDate: bookingDate.toLocaleDateString('es-ES'),
            appointmentTime: bookingDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            professionalName: 'Profesional de prueba'
          }),
          retry_count: 0
        });
      }
    }
  }

  // Notificación de confirmación enviada
  if (bookings.length > 0) {
    const sentTime = new Date(now);
    sentTime.setHours(sentTime.getHours() - 2); // Hace 2 horas

    notifications.push({
      id: uuidv4(),
      client_id: bookings[0].client_id,
      booking_id: bookings[0].id,
      type: 'appointment_confirmation',
      channel: 'whatsapp',
      scheduled_for: sentTime,
      status: 'sent',
      template_name: 'appointment_confirmation',
      template_data: JSON.stringify({
        bookingId: bookings[0].id,
        clientName: 'Cliente de prueba',
        serviceName: 'Limpieza Facial',
        appointmentDate: new Date(bookings[0].date_time).toLocaleDateString('es-ES'),
        appointmentTime: new Date(bookings[0].date_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        professionalName: 'María González',
        servicePrice: '45.00'
      }),
      sent_at: sentTime,
      retry_count: 0
    });
  }

  // Notificación fallida
  if (clients.length > 1) {
    const failedTime = new Date(now);
    failedTime.setMinutes(failedTime.getMinutes() - 30); // Hace 30 minutos

    notifications.push({
      id: uuidv4(),
      client_id: clients[1].id,
      booking_id: null,
      type: 'promotion',
      channel: 'whatsapp',
      scheduled_for: failedTime,
      status: 'failed',
      template_name: 'promotion',
      template_data: JSON.stringify({
        clientName: 'Ana Martínez',
        promotionTitle: 'Descuento especial',
        discountPercent: '20',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')
      }),
      error_message: 'Error de conexión con Twilio',
      retry_count: 2
    });
  }

  // Notificación programada para el futuro
  if (clients.length > 2) {
    const futureTime = new Date(now);
    futureTime.setHours(futureTime.getHours() + 2); // En 2 horas

    notifications.push({
      id: uuidv4(),
      client_id: clients[2].id,
      booking_id: null,
      type: 'birthday_greeting',
      channel: 'whatsapp',
      scheduled_for: futureTime,
      status: 'pending',
      template_name: 'birthday_greeting',
      template_data: JSON.stringify({
        clientName: 'Carmen Rodríguez',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')
      }),
      retry_count: 0
    });
  }

  // Insertar notificaciones
  if (notifications.length > 0) {
    await knex('scheduled_notifications').insert(notifications);
    console.log(`Inserted ${notifications.length} notifications`);
  } else {
    console.log('No notifications created - no suitable data found');
  }
};