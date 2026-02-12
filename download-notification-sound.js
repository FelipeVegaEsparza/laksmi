// Script para descargar un sonido de notificación sutil
// Este sonido es de dominio público de Pixabay

const https = require('https');
const fs = require('fs');
const path = require('path');

const soundUrl = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=notification-sound-7062.mp3';
const outputPath = path.join(__dirname, 'dashboard', 'public', 'notification.mp3');

console.log('📥 Descargando sonido de notificación...');

https.get(soundUrl, (response) => {
  if (response.statusCode === 200) {
    const file = fs.createWriteStream(outputPath);
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log('✅ Sonido descargado exitosamente en:', outputPath);
      console.log('🔊 Puedes probar el sonido abriendo el archivo');
    });
  } else if (response.statusCode === 302 || response.statusCode === 301) {
    // Seguir redirección
    https.get(response.headers.location, (redirectResponse) => {
      const file = fs.createWriteStream(outputPath);
      redirectResponse.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('✅ Sonido descargado exitosamente en:', outputPath);
      });
    });
  } else {
    console.error('❌ Error al descargar:', response.statusCode);
  }
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
  console.log('\n💡 Alternativa: Puedes descargar manualmente un sonido de notificación de:');
  console.log('   - https://pixabay.com/sound-effects/search/notification/');
  console.log('   - https://freesound.org/');
  console.log('   Y guardarlo como: dashboard/public/notification.mp3');
});
