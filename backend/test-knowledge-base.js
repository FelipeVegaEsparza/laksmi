/**
 * Script de prueba para verificar la base de conocimientos
 * Ejecutar con: node test-knowledge-base.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testKnowledgeBase() {
  console.log('🔍 Verificando Base de Conocimientos...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laxmi_db',
  });

  try {
    // 1. Verificar categorías
    console.log('📁 Categorías:');
    const [categories] = await connection.execute(
      'SELECT id, name, description FROM knowledge_categories WHERE is_active = 1'
    );
    console.log(`   ✅ ${categories.length} categorías encontradas`);
    categories.forEach(cat => {
      console.log(`      - ${cat.name}: ${cat.description}`);
    });
    console.log('');

    // 2. Verificar FAQs
    console.log('❓ FAQs:');
    const [faqs] = await connection.execute(
      'SELECT id, question, answer FROM knowledge_faqs WHERE is_active = 1'
    );
    console.log(`   ✅ ${faqs.length} FAQs encontradas`);
    faqs.forEach((faq, index) => {
      console.log(`      ${index + 1}. ${faq.question}`);
      console.log(`         ${faq.answer.substring(0, 80)}...`);
    });
    console.log('');

    // 3. Verificar artículos
    console.log('📄 Artículos:');
    const [articles] = await connection.execute(
      'SELECT id, title, summary FROM knowledge_articles WHERE is_published = 1'
    );
    console.log(`   ${articles.length > 0 ? '✅' : '⚠️'} ${articles.length} artículos encontrados`);
    if (articles.length === 0) {
      console.log('      ℹ️  No hay artículos publicados aún');
    } else {
      articles.forEach((article, index) => {
        console.log(`      ${index + 1}. ${article.title}`);
      });
    }
    console.log('');

    // 4. Verificar tecnologías
    console.log('⚙️  Tecnologías:');
    const [technologies] = await connection.execute(
      'SELECT id, name, description FROM knowledge_technologies WHERE is_active = 1'
    );
    console.log(`   ${technologies.length > 0 ? '✅' : '⚠️'} ${technologies.length} tecnologías encontradas`);
    if (technologies.length === 0) {
      console.log('      ℹ️  No hay tecnologías registradas aún');
    }
    console.log('');

    // 5. Verificar ingredientes
    console.log('🧪 Ingredientes:');
    const [ingredients] = await connection.execute(
      'SELECT id, name, description FROM knowledge_ingredients WHERE is_active = 1'
    );
    console.log(`   ${ingredients.length > 0 ? '✅' : '⚠️'} ${ingredients.length} ingredientes encontrados`);
    if (ingredients.length === 0) {
      console.log('      ℹ️  No hay ingredientes registrados aún');
    }
    console.log('');

    // 6. Probar búsqueda FULLTEXT
    console.log('🔎 Prueba de búsqueda FULLTEXT:');
    const testQueries = [
      'tratamiento facial',
      'manicure',
      'cancelación',
      'productos',
      'depilación'
    ];

    for (const query of testQueries) {
      const [results] = await connection.execute(
        `SELECT question, answer 
         FROM knowledge_faqs 
         WHERE is_active = 1 
         AND MATCH(question, answer, keywords) AGAINST(? IN NATURAL LANGUAGE MODE)
         LIMIT 3`,
        [query]
      );
      
      console.log(`   Query: "${query}"`);
      if (results.length > 0) {
        console.log(`   ✅ ${results.length} resultado(s) encontrado(s)`);
        results.forEach((result, index) => {
          console.log(`      ${index + 1}. ${result.question}`);
        });
      } else {
        console.log(`   ⚠️  No se encontraron resultados`);
      }
      console.log('');
    }

    // 7. Verificar servicios (para contexto de IA)
    console.log('💆 Servicios (para contexto de IA):');
    const [services] = await connection.execute(
      'SELECT id, name, price, duration FROM services WHERE is_active = 1 LIMIT 10'
    );
    console.log(`   ✅ ${services.length} servicios activos encontrados`);
    services.forEach((service, index) => {
      console.log(`      ${index + 1}. ${service.name} - $${service.price} (${service.duration} min)`);
    });
    console.log('');

    // 8. Resumen
    console.log('📊 RESUMEN:');
    console.log(`   Categorías: ${categories.length}`);
    console.log(`   FAQs: ${faqs.length}`);
    console.log(`   Artículos: ${articles.length}`);
    console.log(`   Tecnologías: ${technologies.length}`);
    console.log(`   Ingredientes: ${ingredients.length}`);
    console.log(`   Servicios: ${services.length}`);
    console.log('');

    // 9. Recomendaciones
    console.log('💡 RECOMENDACIONES:');
    if (articles.length === 0) {
      console.log('   ⚠️  Considera agregar artículos sobre tratamientos comunes');
    }
    if (technologies.length === 0) {
      console.log('   ⚠️  Considera agregar información sobre tecnologías usadas');
    }
    if (ingredients.length === 0) {
      console.log('   ⚠️  Considera agregar información sobre ingredientes clave');
    }
    if (faqs.length < 10) {
      console.log('   ℹ️  Considera agregar más FAQs basadas en preguntas frecuentes');
    }
    
    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar
testKnowledgeBase().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
