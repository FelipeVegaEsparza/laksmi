# ✅ Checklist de Corrección Easypanel

## 📋 Antes de Empezar

- [ ] Tengo acceso a Easypanel
- [ ] Tengo acceso a la base de datos MySQL
- [ ] Tengo el archivo `easypanel-fix-complete.sql` listo
- [ ] He hecho backup de la base de datos (recomendado)

---

## 🗄️ PARTE 1: Base de Datos (5 minutos)

### Paso 1.1: Acceder a MySQL
- [ ] Abrir Easypanel
- [ ] Ir al servicio MySQL
- [ ] Abrir cliente SQL (phpMyAdmin, Adminer, o CLI)
- [ ] Seleccionar base de datos `clinica_belleza`

### Paso 1.2: Ejecutar Script SQL
- [ ] Abrir archivo `easypanel-fix-complete.sql`
- [ ] Copiar TODO el contenido
- [ ] Pegar en el editor SQL
- [ ] Ejecutar el script completo
- [ ] Esperar a que termine (debería tomar menos de 1 minuto)

### Paso 1.3: Verificar Ejecución
- [ ] Ver mensaje: `✅ Script ejecutado correctamente`
- [ ] Verificar que aparecen 4 tablas en los resultados
- [ ] Verificar que `company_settings` tiene 1 registro
- [ ] Verificar que `banners` tiene al menos 1 registro
- [ ] Verificar que `featured_images` tiene 3 registros

**Si algo falla aquí, NO continúes. Revisa los errores SQL primero.**

---

## 💻 PARTE 2: Backend (5 minutos)

### Paso 2.1: Verificar Cambios en el Código
- [ ] Archivo `backend/src/middleware/security.ts` tiene los cambios
- [ ] Los 3 rate limiters tienen `validate: { trustProxy: false }`
- [ ] El código compila sin errores (`npm run build` exitoso)

### Paso 2.2: Commit y Push
```bash
git status
git add .
git commit -m "Fix: Rate limiter trust proxy y tablas faltantes en producción"
git push origin main
```

- [ ] Cambios commiteados
- [ ] Push exitoso a GitHub/GitLab

### Paso 2.3: Redesplegar en Easypanel
- [ ] Ir a Easypanel → Servicio Backend
- [ ] Click en **Rebuild** (o **Redeploy**)
- [ ] Esperar a que termine el build (2-3 minutos)
- [ ] Ver que el estado cambia a "Running"

---

## 🔍 PARTE 3: Verificación (5 minutos)

### Paso 3.1: Revisar Logs del Backend
- [ ] Ir a Easypanel → Backend → Logs
- [ ] Ver línea: `🚀 Iniciando backend en modo producción...`
- [ ] Ver línea: `✅ Base de datos lista`
- [ ] Ver línea: `🚀 Iniciando servidor...`
- [ ] **NO** ver error: `ValidationError: trust proxy`
- [ ] **NO** ver error: `Unknown column 'price'`
- [ ] **NO** ver error: `Table doesn't exist`

### Paso 3.2: Probar el Frontend
- [ ] Abrir URL del frontend en el navegador
- [ ] La página carga sin errores
- [ ] Abrir DevTools → Console
- [ ] **NO** hay errores 404 o 500
- [ ] Las imágenes cargan (o muestran placeholders)

### Paso 3.3: Probar el Dashboard
- [ ] Abrir URL del dashboard
- [ ] Login funciona correctamente
- [ ] Dashboard muestra métricas (aunque sean 0)
- [ ] **NO** hay errores en la consola
- [ ] Las secciones cargan correctamente

### Paso 3.4: Verificar APIs
Puedes probar con curl o Postman:

```bash
# Health check
curl https://tu-backend.easypanel.host/health

# Company settings
curl https://tu-backend.easypanel.host/api/v1/company-settings

# Banners
curl https://tu-backend.easypanel.host/api/v1/banners
```

- [ ] `/health` responde con status: "OK"
- [ ] `/api/v1/company-settings` responde con datos
- [ ] `/api/v1/banners` responde con array (aunque vacío)

---

## 🎯 PARTE 4: Verificación Final

### Checklist de Éxito
- [ ] Backend corriendo sin errores en logs
- [ ] Frontend carga correctamente
- [ ] Dashboard accesible y funcional
- [ ] No hay errores de "table doesn't exist"
- [ ] No hay errores de "unknown column"
- [ ] No hay errores de "trust proxy"
- [ ] Las métricas del dashboard se muestran (aunque sean 0)

### Si TODO está ✅
**¡Felicidades! La corrección fue exitosa.**

Puedes proceder a:
1. Configurar los datos de la empresa en el dashboard
2. Subir imágenes para banners
3. Personalizar colores
4. Agregar contenido

---

## 🚨 Troubleshooting

### ❌ Problema: Backend sigue crasheando

**Síntoma**: Logs muestran error de trust proxy

**Solución**:
1. Verificar que el código se desplegó correctamente
2. Hacer un **rebuild completo** (no solo redeploy)
3. Verificar que `backend/dist/middleware/security.js` tiene los cambios
4. Revisar que la variable `NODE_ENV` está en "production"

**Comandos de verificación**:
```bash
# En Easypanel, ejecutar en el contenedor del backend
cat /app/dist/middleware/security.js | grep "trustProxy"
# Debería mostrar: trustProxy: false
```

---

### ❌ Problema: Error "Unknown column 'price'"

**Síntoma**: Dashboard no carga, error en logs sobre columna price

**Solución**:
1. Conectar a MySQL
2. Ejecutar manualmente:
```sql
-- Verificar si la columna existe
DESCRIBE bookings;

-- Si no existe, agregarla
ALTER TABLE bookings 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00 AFTER service_id;

-- Actualizar precios
UPDATE bookings b
INNER JOIN services s ON b.service_id = s.id
SET b.price = s.price
WHERE b.price = 0 OR b.price IS NULL;
```

---

### ❌ Problema: Tablas no existen

**Síntoma**: Error "Table 'clinica_belleza.company_settings' doesn't exist"

**Solución**:
1. Verificar que estás en la base de datos correcta:
```sql
SELECT DATABASE();
```

2. Ver qué tablas existen:
```sql
SHOW TABLES;
```

3. Si faltan tablas, ejecutar el script SQL de nuevo
4. O crear manualmente cada tabla del archivo `easypanel-fix-complete.sql`

---

### ❌ Problema: Frontend no carga datos

**Síntoma**: Frontend carga pero sin contenido, errores 404 en console

**Solución**:
1. Verificar que el backend está corriendo:
```bash
curl https://tu-backend.easypanel.host/health
```

2. Verificar CORS en el backend:
```bash
# Ver logs del backend
# Buscar línea: "📡 CORS configurado para: ..."
```

3. Verificar variable de entorno en el frontend:
```bash
# En Easypanel → Frontend → Environment
VITE_API_URL=https://tu-backend.easypanel.host
```

---

### ❌ Problema: Dashboard vacío (sin métricas)

**Síntoma**: Dashboard carga pero muestra 0 en todo

**Solución**: Esto es NORMAL si:
- No hay clientes registrados
- No hay citas creadas
- No hay conversaciones activas

**Para verificar que funciona**:
```sql
-- Ver si hay datos
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM bookings;
SELECT COUNT(*) FROM conversations;

-- Si todo es 0, el dashboard está funcionando correctamente
-- Solo necesitas agregar datos
```

---

## 📊 Comandos de Diagnóstico

### Verificar Estado de Tablas
```sql
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'clinica_belleza'
ORDER BY TABLE_NAME;
```

### Verificar Columnas de Bookings
```sql
SHOW COLUMNS FROM bookings;
```

### Verificar Datos Iniciales
```sql
SELECT 'company_settings' as tabla, COUNT(*) as registros FROM company_settings
UNION ALL
SELECT 'banners', COUNT(*) FROM banners
UNION ALL
SELECT 'featured_images', COUNT(*) FROM featured_images
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings;
```

---

## 📞 Contacto y Soporte

Si después de seguir todos estos pasos sigues teniendo problemas:

1. **Revisa los logs** completos del backend
2. **Copia el error exacto** que aparece
3. **Verifica** que seguiste todos los pasos en orden
4. **Comprueba** que la base de datos es la correcta

---

## 🎉 Éxito Confirmado

Si llegaste aquí y todos los checkboxes están marcados:

**✅ ¡FELICIDADES! Tu aplicación está funcionando correctamente en Easypanel.**

Ahora puedes:
- Configurar los datos de tu empresa
- Subir imágenes y logos
- Personalizar colores
- Agregar servicios y productos
- Invitar a tu equipo

---

**Tiempo total estimado**: 15-20 minutos
**Dificultad**: Media
**Requisitos**: Acceso a Easypanel y MySQL
