// Debug app loading to find syntax errors
console.log('🔍 Debugging app loading...\n');

try {
  console.log('1. Testing basic Node.js modules...');
  const express = require('express');
  console.log('   ✅ Express loaded');
  
  console.log('\n2. Testing if backend files can be loaded...');
  
  // Try to load the compiled app.js
  try {
    console.log('   Loading compiled app.js...');
    const app = require('./backend/dist/app.js');
    console.log('   ✅ Compiled app.js loaded successfully');
    console.log('   Type:', typeof app.default);
  } catch (appError) {
    console.log('   ❌ Error loading compiled app.js:', appError.message);
    
    // Try to check if dist folder exists
    const fs = require('fs');
    const path = require('path');
    
    const distPath = path.join('backend', 'dist');
    if (fs.existsSync(distPath)) {
      console.log('   📁 dist folder exists');
      const files = fs.readdirSync(distPath);
      console.log('   📋 Files in dist:', files.slice(0, 10));
    } else {
      console.log('   ❌ dist folder does not exist - compilation failed');
    }
  }
  
  console.log('\n3. Testing individual route files...');
  
  const routeFiles = [
    './backend/dist/routes/upload.js',
    './backend/dist/routes/upload-temp.js', 
    './backend/dist/routes/upload-simple.js',
    './backend/dist/routes/upload-direct.js',
    './backend/dist/routes/upload-working.js'
  ];
  
  for (const routeFile of routeFiles) {
    try {
      const route = require(routeFile);
      console.log(`   ✅ ${routeFile.split('/').pop()} loaded`);
    } catch (routeError) {
      console.log(`   ❌ ${routeFile.split('/').pop()} failed:`, routeError.message);
    }
  }
  
} catch (error) {
  console.error('❌ Critical error:', error.message);
  console.error('Stack:', error.stack);
}