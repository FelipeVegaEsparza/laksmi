const db = require('../dist/config/database').default;

async function setDefaultBusinessHours() {
  try {
    console.log('🕐 Configurando horarios por defecto del local...\n');

    const defaultBusinessHours = {
      monday: {
        isOpen: true,
        openTime: '09:00',
        closeTime: '20:00',
        lunchStart: '13:00',
        lunchEnd: '14:00'
      },
      tuesday: {
        isOpen: true,
        openTime: '09:00',
        closeTime: '20:00',
        lunchStart: '13:00',
        lunchEnd: '14:00'
      },
      wednesday: {
        isOpen: true,
        openTime: '09:00',
        closeTime: '20:00',
        lunchStart: '13:00',
        lunchEnd: '14:00'
      },
      thursday: {
        isOpen: true,
        openTime: '09:00',
        closeTime: '20:00',
        lunchStart: '13:00',
        lunchEnd: '14:00'
      },
      friday: {
        isOpen: true,
        openTime: '09:00',
        closeTime: '20:00',
        lunchStart: '13:00',
        lunchEnd: '14:00'
      },
      saturday: {
        isOpen: true,
        openTime: '09:00',
        closeTime: '14:00',
        lunchStart: '',
        lunchEnd: ''
      },
      sunday: {
        isOpen: false,
        openTime: '',
        closeTime: '',
        lunchStart: '',
        lunchEnd: ''
      }
    };

    await db('company_settings')
      .update({
        business_hours: JSON.stringify(defaultBusinessHours),
        updated_at: new Date()
      });

    console.log('✅ Horarios configurados exitosamente');
    console.log(JSON.stringify(defaultBusinessHours, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setDefaultBusinessHours();
