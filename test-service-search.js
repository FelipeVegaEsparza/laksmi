/**
 * Script de prueba para verificar que el sistema busca en la lista de servicios
 */

require('dotenv').config({ path: './backend/.env' });

async function testServiceSearch() {
  console.log('🔍 Probando búsqueda de servicios en el contexto del AI...\n');
  
  try {
    // Importar KnowledgeService
    const { KnowledgeService } = require('./backend/dist/services/KnowledgeService');
    
    // Probar con diferentes consultas
    const queries = [
      'depilación láser',
      'tratamiento facial',
      'masaje',
      'precio de limpieza facial',
      'cuánto cuesta el botox'
    ];
    
    for (const query of queries) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📝 Consulta: "${query}"`);
      console.log('='.repeat(60));
      
      const context = await KnowledgeService.getContextForAI(query);
      
      if (context) {
        // Verificar si incluye servicios
        const hasServices = context.includes('SERVICIOS DISPONIBLES');
        const hasProducts = context.includes('PRODUCTOS DISPONIBLES');
        const hasKnowledge = context.includes('INFORMACIÓN DE LA BASE DE CONOCIMIENTOS');
        
        console.log('\n✅ Contexto generado:');
        console.log(`   - Incluye servicios: ${hasServices ? '✓' : '✗'}`);
        console.log(`   - Incluye productos: ${hasProducts ? '✓' : '✗'}`);
        console.log(`   - Incluye base de conocimientos: ${hasKnowledge ? '✓' : '✗'}`);
        
        // Contar cuántos servicios se encontraron
        const serviceMatches = context.match(/\d+\.\s+[A-ZÁÉÍÓÚÑ\s]+\n\s+Categoría:/g);
        if (serviceMatches) {
          console.log(`   - Servicios encontrados: ${serviceMatches.length}`);
        }
        
        // Mostrar un extracto del contexto (primeros 500 caracteres)
        console.log('\n📄 Extracto del contexto:');
        console.log(context.substring(0, 500) + '...\n');
        
      } else {
        console.log('❌ No se generó contexto');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Prueba completada');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    console.error(error.stack);
  }
  
  process.exit(0);
}

testServiceSearch();
