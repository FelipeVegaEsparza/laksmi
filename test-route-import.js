// Test if routes can be imported without errors
console.log('🔍 Testing route imports...\n');

try {
  console.log('1. Testing upload-simple import...');
  const uploadSimple = require('./backend/dist/routes/upload-simple.js');
  console.log('   ✅ upload-simple imported successfully');
  console.log('   Type:', typeof uploadSimple.default);
  
  console.log('\n2. Testing upload-temp import...');
  const uploadTemp = require('./backend/dist/routes/upload-temp.js');
  console.log('   ✅ upload-temp imported successfully');
  console.log('   Type:', typeof uploadTemp.default);
  
  console.log('\n3. Testing original upload import...');
  const upload = require('./backend/dist/routes/upload.js');
  console.log('   ✅ upload imported successfully');
  console.log('   Type:', typeof upload.default);
  
} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('Stack:', error.stack);
}