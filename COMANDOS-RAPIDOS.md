# ⚡ Comandos Rápidos - Referencia

## 🚀 Desarrollo Local

### Iniciar Backend
```bash
cd backend
npm run dev
```

### Compilar Backend
```bash
cd backend
npm run build
```

### Ver Migraciones
```bash
ls backend/migrations/
```

---

## 📝 Crear Nueva Migración

### 1. Crear Archivo
```bash
# Formato: XXX_descripcion.sql
touch backend/migrations/005_add_new_column.sql
```

### 2. Escribir SQL
```sql
-- backend/migrations/005_add_new_column.sql
ALTER TABLE services 
ADD COLUMN new_column VARCHAR(255);
```

### 3. Probar Localmente
```bash
# Reiniciar backend (ejecuta migración automáticamente)
cd backend
npm run dev
```

### 4. Commit y Push
```bash
git add backend/migrations/005_add_new_column.sql
git commit -m "feat: agregar nueva columna"
git push
```

---

## 🗄️ MySQL - Verificación

### Ver Migraciones Ejecutadas
```sql
SELECT * FROM schema_migrations ORDER BY id;
```

### Ver Última Migración
```sql
SELECT * FROM schema_migrations ORDER BY id DESC LIMIT 1;
```

### Contar Migraciones
```sql
SELECT COUNT(*) as total FROM schema_migrations;
```

### Ver Estructura de Tabla
```sql
DESCRIBE bookings;
DESCRIBE services;
DESCRIBE company_settings;
```

### Ver Datos
```sql
SELECT * FROM company_settings;
SELECT * FROM banners;
SELECT * FROM featured_images;
```

---

## 🐳 Docker

### Build Local
```bash
docker-compose build
```

### Iniciar Servicios
```bash
docker-compose up
```

### Ver Logs
```bash
docker-compose logs -f backend
```

### Detener
```bash
docker-compose down
```

---

## 📦 Easypanel

### Rebuild Manual
```
Easypanel → Tu Proyecto → Backend → Rebuild
```

### Ver Logs
```
Easypanel → Tu Proyecto → Backend → Logs
```

### Configurar Volumen
```
Easypanel → Tu Proyecto → Backend → Volumes → Add Volume
Name: uploads-data
Mount Path: /app/uploads
Size: 5GB
```

---

## 🔍 Debugging

### Ver Logs del Backend
```bash
# Local
cd backend
npm run dev
# Ver output en consola

# Producción
# Ver en Easypanel → Logs
```

### Verificar Compilación
```bash
cd backend
npm run build
# Si no hay errores, está bien
```

### Verificar Migraciones Pendientes
```sql
-- Ver todas las migraciones
SELECT filename FROM schema_migrations;

-- Comparar con archivos en disco
-- Las que no están en la tabla son pendientes
```

### Forzar Re-ejecución de Migración
```sql
-- CUIDADO: Solo si sabes lo que haces
DELETE FROM schema_migrations 
WHERE filename = '005_problema.sql';

-- Luego reiniciar backend
```

---

## 🔧 Solución Rápida de Problemas

### Backend no inicia
```bash
# 1. Ver logs
cd backend
npm run dev

# 2. Verificar MySQL
# ¿Está corriendo?

# 3. Verificar .env
cat backend/.env
```

### Migración falla
```sql
-- 1. Ver cuál falló
SELECT * FROM schema_migrations ORDER BY id DESC LIMIT 1;

-- 2. Ver el error en logs del backend

-- 3. Corregir el archivo .sql

-- 4. Eliminar registro (para reintentar)
DELETE FROM schema_migrations WHERE filename = 'XXX.sql';

-- 5. Reiniciar backend
```

### Imágenes no persisten
```bash
# 1. Verificar volumen en Easypanel
# Volumes → uploads-data debe existir

# 2. Verificar mount path
# Debe ser: /app/uploads

# 3. Rebuild backend
```

---

## 📊 Monitoreo

### Espacio en Uploads
```bash
# En servidor/Easypanel terminal
du -sh /app/uploads
```

### Contar Imágenes
```bash
find /app/uploads -type f | wc -l
```

### Ver Archivos Recientes
```bash
ls -lht /app/uploads/**/* | head -20
```

---

## 🎯 Flujo Completo

### Feature Sin Cambios BD
```bash
# 1. Desarrollar
# ... modificar código ...

# 2. Probar
npm run dev

# 3. Commit
git add .
git commit -m "feat: nueva feature"
git push

# 4. Esperar rebuild en Easypanel
# ✅ Listo
```

### Feature Con Cambios BD
```bash
# 1. Crear migración
touch backend/migrations/005_nueva_columna.sql

# 2. Escribir SQL
# ... editar archivo ...

# 3. Desarrollar código
# ... modificar código ...

# 4. Probar localmente
npm run dev
# Migración se ejecuta automáticamente

# 5. Commit todo
git add .
git add backend/migrations/005_nueva_columna.sql
git commit -m "feat: nueva feature con BD"
git push

# 6. Esperar rebuild en Easypanel
# Migración se ejecuta automáticamente
# ✅ Listo
```

---

## 📚 Documentación Rápida

### ¿Cómo funciona el sistema?
```
Leer: SISTEMA-MIGRACIONES.md
```

### ¿Cómo trabajo día a día?
```
Leer: FLUJO-TRABAJO-COMPLETO.md
```

### ¿Cómo configuro volumen?
```
Leer: CONFIGURAR-VOLUMEN-EASYPANEL.md
```

### ¿Qué se implementó?
```
Leer: RESUMEN-IMPLEMENTACION-MIGRACIONES.md
```

---

## 🆘 Ayuda Rápida

### Error de compilación
```bash
cd backend
rm -rf node_modules
npm install
npm run build
```

### Error de migraciones
```
1. Ver logs del backend
2. Buscar línea con "❌"
3. Revisar archivo .sql mencionado
4. Corregir y redesplegar
```

### Error de conexión BD
```bash
# Verificar .env
cat backend/.env

# Verificar que MySQL está corriendo
# En Easypanel: MySQL service debe estar "Running"
```

---

## ✅ Checklist Rápido

### Antes de Commit:
- [ ] Código funciona localmente
- [ ] Migraciones creadas (si hay cambios BD)
- [ ] Backend compila sin errores
- [ ] Mensaje de commit descriptivo

### Antes de Desplegar:
- [ ] git push exitoso
- [ ] Easypanel detectó cambios
- [ ] Esperando rebuild

### Después de Desplegar:
- [ ] Backend sin errores en logs
- [ ] Frontend carga
- [ ] Feature funciona
- [ ] ✅ Despliegue exitoso

---

## 🎯 Atajos de Teclado (VS Code)

```
Ctrl + ` : Abrir terminal
Ctrl + Shift + ` : Nueva terminal
Ctrl + P : Buscar archivo
Ctrl + Shift + F : Buscar en proyecto
```

---

## 💡 Tips

### Nombrar Migraciones
```
✅ 005_add_discount_to_services.sql
✅ 006_create_reviews_table.sql
❌ 005_update.sql
❌ migration.sql
```

### Mensajes de Commit
```
✅ feat: agregar sistema de descuentos
✅ fix: corregir cálculo de precios
✅ refactor: mejorar estructura de servicios
❌ update
❌ cambios
```

### Probar Antes de Push
```
Siempre:
1. Reiniciar backend local
2. Probar feature
3. Verificar que funciona
4. Luego commit y push
```

---

**Guarda este archivo como referencia rápida** 📌
