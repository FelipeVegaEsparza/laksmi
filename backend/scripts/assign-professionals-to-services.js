const db = require('../dist/config/database').default;

async function assignProfessionalsToServices() {
  try {
    console.log('🔧 Asignando profesionales a servicios...\n');

    // Obtener todos los servicios activos
    const services = await db('services')
      .where('is_active', true)
      .select('id', 'name', 'category');

    console.log(`📋 Servicios encontrados: ${services.length}\n`);

    // Obtener todos los profesionales activos
    const professionals = await db('professionals')
      .where('is_active', true)
      .select('id', 'name', 'specialties');

    console.log(`👥 Profesionales activos: ${professionals.length}\n`);

    if (professionals.length === 0) {
      console.log('❌ No hay profesionales activos');
      return;
    }

    // Para cada servicio, asignar al menos un profesional
    for (const service of services) {
      // Buscar profesionales que ya tienen este servicio
      const professionalsWithService = professionals.filter(p => 
        p.specialties && p.specialties.includes(service.id)
      );

      if (professionalsWithService.length > 0) {
        console.log(`✅ ${service.name} - Ya tiene ${professionalsWithService.length} profesional(es)`);
        continue;
      }

      // Si no tiene profesionales, asignar al primero disponible
      const professional = professionals[0];
      const currentSpecialties = professional.specialties || [];
      
      if (!currentSpecialties.includes(service.id)) {
        currentSpecialties.push(service.id);
        
        await db('professionals')
          .where('id', professional.id)
          .update({
            specialties: JSON.stringify(currentSpecialties),
            updated_at: new Date()
          });

        console.log(`➕ ${service.name} - Asignado a ${professional.name}`);
        
        // Actualizar el objeto en memoria
        professional.specialties = currentSpecialties;
      }
    }

    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignProfessionalsToServices();
