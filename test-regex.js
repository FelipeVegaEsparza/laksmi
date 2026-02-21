// Test del regex para detectar servicios en WhatsApp

const message = `La depilación láser es un tratamiento efectivo para eliminar el vello de forma permanente. Aquí tienes algunas opciones disponibles:

1. *Depilación láser bigote (8 sesiones)* - $120,000
2. *Depilación láser axilas (8 sesiones)* - $180,000
3. *Depilación láser piernas completas (8 sesiones)* - $450,000
4. *Depilación láser brasileño (8 sesiones)* - $280,000
5. *Depilación láser brazos, manos y axilas (6 sesiones)* - $113,497
6. *Depilación láser axila y rebaje brasileño (6 sesiones)* - $125,900

¿Qué información específica necesitas sobre alguno de estos servicios? Puedes responder con el número del servicio que te interesa (1, 2, 3, etc.).`;

// Regex actual
const serviceListPattern = /(?:^|\n)\s*(\d+)\.\s*\*?([^*\n]+?)\*?(?:\s*\((\d+)\s*sesiones?\))?\*?\s*[-–—]\s*\$?\s*([\d,\.]+)/gi;
const matches = [...message.matchAll(serviceListPattern)];

console.log('Matches found:', matches.length);
console.log('\nDetailed matches:');
matches.forEach((match, i) => {
  console.log(`\nMatch ${i + 1}:`);
  console.log('  Full match:', match[0]);
  console.log('  Number:', match[1]);
  console.log('  Name:', match[2]?.trim());
  console.log('  Sessions:', match[3]);
  console.log('  Price:', match[4]);
});
