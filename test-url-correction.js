// Test para verificar que las URLs se convierten correctamente
const http = require('http');

console.log('🧪 Probando corrección de URLs...');

// Simular lo que hace el uploadService
function getImageUrl(path) {
    if (path.startsWith('http')) {
        return path;
    }

    if (path.startsWith('data:')) {
        return path;
    }

    if (path.includes('mock-') || path.includes('emergency-') || path.includes('local-')) {
        return 'https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Imagen+Subida';
    }

    const baseUrl = 'http://localhost:3000';
    const fullUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    return fullUrl;
}

// Test de conversión de URLs
console.log('🔍 Probando conversión de URLs:');

const testUrls = [
    '/uploads/services/images-1760840060283-456103291.png',
    'uploads/services/test.jpg',
    'http://localhost:3000/uploads/services/full.png',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
];

testUrls.forEach(url => {
    const converted = getImageUrl(url);
    console.log(`  ${url} → ${converted}`);
});

// Ahora probar con datos reales del backend
testWithRealData();

function testWithRealData() {
    console.log('\n🧪 Probando con datos reales del backend...');

    // Primero hacer login
    const loginData = JSON.stringify({
        username: 'admin',
        password: 'admin123'
    });

    const loginReq = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                const response = JSON.parse(data);
                const token = response.data.accessToken;

                // Probar PUT con URLs corregidas
                testPutWithCorrectUrls(token);
            } else {
                console.log('❌ Login falló');
            }
        });
    });

    loginReq.write(loginData);
    loginReq.end();
}

function testPutWithCorrectUrls(token) {
    console.log('🧪 Probando PUT con URLs completas...');

    // URLs corregidas (completas)
    const serviceData = JSON.stringify({
        name: 'Servicio de prueba',
        category: 'Corporal',
        price: 10,
        duration: 60,
        description: 'bla bla bla bla bla bl',
        images: ['http://localhost:3000/uploads/services/images-1760840060283-456103291.png'], // URL COMPLETA
        requirements: [],
        isActive: true
    });

    console.log('📤 Enviando con URLs completas:');
    console.log(serviceData);

    const serviceId = 'c7be75ac-ac49-11f0-934e-0045e287f432';

    const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: `/api/v1/services/${serviceId}`,
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(serviceData)
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('📊 PUT Status:', res.statusCode);

            if (res.statusCode === 200) {
                console.log('✅ PUT exitoso con URLs completas!');
            } else {
                console.log('❌ PUT falló:', data);
            }
        });
    });

    req.write(serviceData);
    req.end();
}