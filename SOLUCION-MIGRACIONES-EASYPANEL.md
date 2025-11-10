# 🎯 Solución: Ejecutar Migraciones en Easypanel

## ❌ Problema Identificado

El backend en Easypanel no puede iniciar porque **la base de datos está vacía** (sin tablas).

MySQL está funcionando correctamente, pero las migraciones nunca se ejecutaron.

## ✅ Solución Implementada

He modificado el Dockerfile de producción para que:
1. **Ejecute las migraciones** automáticamente al iniciar
2. **Cargue los datos iniciales** (seeds) con usuario admin y datos de ejemplo
3. **Inicie el servidor** solo después de que la BD esté lista

### Archivos Modificados:

1. **`backend/start-production.sh`** (NUEVO)
   - Script que ejecuta migraciones, seeds y luego inicia el servidor

2. **`backend/Dockerfile.production`**
   - Ahora copia el knexfile.js y las migraciones
   - Instala knex en producción
   - Usa el script de inicio en lugar de node directo

3. **`backend/package.json`**
   - Agregado script `start:prod` para producción

## 🚀 Pasos para Desplegar en Easypanel

### Opción A: Usando el Dockerfile Actualizado (RECOMENDADA)

1. **Hacer commit y push de los cambios**:
   ```bash
   git add .
   git commit -m "feat: Agregar ejecución automática de migraciones en producción"
   git push origin main
   ```

2. **En Easypanel**:
   - Ve a tu servicio backend
   - En "Build Settings":
     - **Dockerfile Path**: `backend/Dockerfile.production`
   - Haz clic en "Rebuild"

3. **Espera y revisa los logs**:
   Deberías ver:
   ```
   🚀 Iniciando backend en modo producción...
   ⏳ Esperando a que MySQL esté listo...
   🗄️  Ejecutando migraciones de base de datos...
   🌱 Cargando datos iniciales (seeds)...
   ✅ Base de datos lista
   🚀 Iniciando servidor...
   === ✅ SERVIDOR INICIADO EXITOSAMENTE ===
   ```

### Opción B: Ejecutar Migraciones Manualmente (Si la Opción A no funciona)

Si Easypanel no te permite usar el Dockerfile personalizado:

1. **Conectarte al contenedor del backend** (si Easypanel lo permite)

2. **Ejecutar manualmente**:
   ```bash
   NODE_ENV=production npx knex migrate:latest
   NODE_ENV=production npx knex seed:run
   ```

3. **Reiniciar el servicio**

### Opción C: Usar el Start Command en Easypanel

En la configuración del servicio backend en Easypanel:

**Start Command**:
```bash
sh start-production.sh
```

O si no funciona:
```bash
npx knex migrate:latest && npx knex seed:run && node dist/index.js
```

## 📋 Verificación

Después del despliegue, verifica:

### 1. Logs del Backend
Deberías ver:
```
🗄️  Ejecutando migraciones de base de datos...
Batch 1 run: 15 migrations
🌱 Cargando datos iniciales (seeds)...
Ran 8 seed files
✅ Base de datos lista
🚀 Iniciando servidor...
=== ✅ SERVIDOR INICIADO EXITOSAMENTE ===
```

### 2. Health Check
```bash
curl https://laksmi-backend.0ieu13.easypanel.host/health
```

Debería responder:
```json
{
  "status": "OK",
  "timestamp": "2025-11-10T...",
  "version": "v1",
  "environment": "production"
}
```

### 3. Login de Prueba
```bash
curl -X POST https://laksmi-backend.0ieu13.easypanel.host/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Debería responder con un token JWT.

## 🗄️ Datos Iniciales Creados

Los seeds crearán automáticamente:

- ✅ **Usuario admin**: username: `admin`, password: `admin123`
- ✅ **10 servicios** de ejemplo (manicure, pedicure, etc.)
- ✅ **5 clientes** de ejemplo
- ✅ **10 productos** de ejemplo
- ✅ **Profesionales** de ejemplo
- ✅ **Reservas** de ejemplo
- ✅ **Categorías** de servicios y productos

## ⚠️ Notas Importantes

### Variables de Entorno Necesarias

Asegúrate de que estas variables estén configuradas en Easypanel:

```bash
NODE_ENV=production
PORT=3000
DB_HOST=mysql
DB_PORT=3306
DB_NAME=clinica_belleza
DB_USER=clinica_user
DB_PASSWORD=3517707aaAA@@
JWT_SECRET=qtal1wmpgWXLTIhdYbDrDc24zcha4w+vJ
JWT_REFRESH_SECRET=iwrmatUS4l7SXVZPTR2k+lwqZrf4seKB
API_VERSION=v1
```

### Si las Migraciones Fallan

Si ves errores como "Table already exists":
1. Las migraciones ya se ejecutaron antes
2. Esto es normal, el servidor debería iniciar de todas formas

Si ves errores de conexión a MySQL:
1. Verifica que MySQL esté en la misma red
2. Verifica las credenciales
3. Verifica que el hostname sea correcto (`mysql`)

## 🎉 Resultado Esperado

Después de aplicar esta solución:

1. ✅ El backend iniciará correctamente
2. ✅ Todas las tablas estarán creadas
3. ✅ Los datos iniciales estarán cargados
4. ✅ Podrás hacer login con admin/admin123
5. ✅ El dashboard podrá conectarse y mostrar datos

## 📞 Próximos Pasos

1. **Hacer commit y push** de los cambios
2. **Rebuild** del servicio en Easypanel
3. **Revisar logs** para confirmar que las migraciones se ejecutaron
4. **Probar el health check** y login
5. **Configurar el dashboard** para que apunte al backend
