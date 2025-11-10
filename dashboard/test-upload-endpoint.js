// Test script to verify upload endpoint
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUploadEndpoint() {
  try {
    // First, let's test if we can reach the API
    console.log('Testing API connection...');
    
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('Health check:', healthResponse.data);
    
    // Test authentication endpoint
    console.log('\nTesting authentication...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Login successful, token received');
    
    // Test upload endpoint structure
    console.log('\nTesting upload endpoint availability...');
    
    // Create a simple test image buffer
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('images', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    try {
      const uploadResponse = await axios.post(
        'http://localhost:3000/api/v1/upload/products',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Upload successful:', uploadResponse.data);
    } catch (uploadError) {
      console.log('Upload endpoint error:');
      console.log('Status:', uploadError.response?.status);
      console.log('Data:', uploadError.response?.data);
      
      // Try to check if the endpoint exists at all
      try {
        const optionsResponse = await axios.options('http://localhost:3000/api/v1/upload/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('OPTIONS response:', optionsResponse.status);
      } catch (optionsError) {
        console.log('OPTIONS error:', optionsError.response?.status);
      }
    }
    
  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
  }
}

testUploadEndpoint();