// Force backend restart by modifying a file
const fs = require('fs');
const path = require('path');

console.log('🔄 Forzando reinicio del backend...\n');

try {
  // Read the main index.ts file
  const indexPath = path.join('backend', 'src', 'index.ts');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Add a comment with timestamp to force restart
  const timestamp = new Date().toISOString();
  const comment = `// Force restart: ${timestamp}`;
  
  // Remove old force restart comments
  content = content.replace(/\/\/ Force restart: .*/g, '');
  
  // Add new comment at the top
  content = comment + '\n' + content;
  
  // Write back
  fs.writeFileSync(indexPath, content);
  
  console.log('✅ Archivo modificado para forzar reinicio');
  console.log('📝 Agregado comentario:', comment);
  console.log('\n🔍 Verifica que nodemon se reinicie automáticamente');
  console.log('📋 Luego ejecuta: node test-final-solution.js');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}