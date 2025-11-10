# 🛠️ PLAN DE CORRECCIÓN DEL BACKEND

## 🎯 OBJETIVO
Estabilizar el backend eliminando duplicaciones, conflictos y código temporal acumulado.

## 📋 FASE 1: LIMPIEZA INMEDIATA (30 min)

### 1.1 Eliminar archivos de debug acumulados
```bash
# En backend/
rm debug-*.js
rm test-*.js  
rm fix-*.js
rm check-*.js
rm verify-*.js
rm restart-*.js
rm reset-*.js
rm diagnose-*.js
rm disable-*.js
rm compare-*.js
rm create-*.js
```

### 1.2 Eliminar rutas de upload duplicadas
**Mantener solo**: `upload-working.ts` (funciona correctamente)
**Eliminar**:
- `upload.ts`
- `upload-temp.ts` 
- `upload-simple.ts`
- `upload-direct.ts`
- `upload-final.ts`

### 1.3 Limpiar app.ts de código temporal
**Eliminar de app.ts**:
- Middleware CORS global agresivo (líneas 45-55)
- Endpoints de emergencia (líneas 60-70)
- Upload direct bypass (líneas 180-210)

## 📋 FASE 2: ESTABILIZACIÓN (60 min)

### 2.1 Configurar CORS limpio
```typescript
// Una sola configuración CORS
const corsConfig = {
  origin: config.nodeEnv === 'development' 
    ? ['http://localhost:5173', 'http://localhost:3001']
    : config.frontend.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsConfig));
```

### 2.2 Rate limiting apropiado para desarrollo
```typescript
// En middleware/security.ts
export const apiRateLimit = rateLimit({
  windowMs: config.nodeEnv === 'development' ? 60 * 1000 : 15 * 60 * 1000,
  max: config.nodeEnv === 'development' ? 1000 : 100,
  message: {
    error: 'Too many requests',
    retryAfter: config.nodeEnv === 'development' ? '1 minute' : '15 minutes'
  }
});
```

### 2.3 Manejo de errores mejorado
```typescript
// Error handler detallado
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error details:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });

  // Respuestas específicas por tipo de error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: config.nodeEnv === 'development' ? err.details : undefined
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'Archivo demasiado grande',
      maxSize: '5MB'
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    error: config.nodeEnv === 'production' 
      ? 'Error interno del servidor' 
      : err.message
  });
});
```

## 📋 FASE 3: OPTIMIZACIÓN (45 min)

### 3.1 Renombrar upload-working a upload
```bash
# Renombrar archivo
mv src/routes/upload-working.ts src/routes/upload.ts

# Actualizar import en app.ts
import uploadRoutes from './routes/upload';
app.use(`/api/${config.apiVersion}/upload`, uploadRoutes);
```

### 3.2 Configuración por ambiente
```typescript
// config/index.ts - Sección mejorada
const environmentConfig = {
  development: {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3001'],
      credentials: true
    },
    rateLimit: {
      windowMs: 60 * 1000, // 1 minuto
      max: 1000 // 1000 requests por minuto
    },
    logging: {
      level: 'debug',
      format: 'dev'
    }
  },
  production: {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || [],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // 100 requests por 15 minutos
    },
    logging: {
      level: 'error',
      format: 'combined'
    }
  }
};

const config = {
  // ... configuración existente
  ...environmentConfig[process.env.NODE_ENV || 'development']
};
```

### 3.3 Middleware ordenado correctamente
```typescript
// app.ts - Orden correcto de middleware
const app = express();

// 1. Seguridad básica
app.use(helmet());

// 2. CORS (una sola vez)
app.use(cors(config.cors));

// 3. Rate limiting
app.use(apiRateLimit);

// 4. Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 5. Logging
app.use(morgan(config.logging.format));

// 6. Archivos estáticos
app.use('/uploads', express.static('uploads'));

// 7. Rutas de API
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
// ... resto de rutas

// 8. Error handling (al final)
app.use(errorHandler);
app.use(notFoundHandler);
```

## 🧪 TESTING DESPUÉS DE CADA FASE

### Test Fase 1 (Limpieza)
```bash
# Verificar que el servidor inicia
npm run dev
# Debería iniciar sin errores
```

### Test Fase 2 (Estabilización)  
```bash
# Test de endpoints básicos
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/upload-working/services
```

### Test Fase 3 (Optimización)
```bash
# Test completo del sistema
node test-complete-system.js
```

## 📊 CHECKLIST DE VERIFICACIÓN

### ✅ Después de Fase 1:
- [ ] Servidor inicia sin errores
- [ ] No hay archivos debug-*.js en root
- [ ] Solo existe upload-working.ts

### ✅ Después de Fase 2:
- [ ] CORS funciona desde frontend
- [ ] Rate limiting no bloquea desarrollo
- [ ] Errores son claros y específicos

### ✅ Después de Fase 3:
- [ ] Upload funciona con ruta /upload
- [ ] Configuración por ambiente activa
- [ ] Middleware en orden correcto

## 🚨 ROLLBACK PLAN

Si algo falla:
```bash
# 1. Hacer backup antes de empezar
cp -r backend backend-backup-$(date +%Y%m%d)

# 2. Si hay problemas, restaurar
rm -rf backend
mv backend-backup-YYYYMMDD backend
```

---

**Tiempo estimado total**: 2.5 horas  
**Riesgo**: 🟡 Medio (con backup)  
**Beneficio**: 🟢 Alto (estabilidad completa)