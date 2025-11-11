# 📦 Configurar Volumen Persistente en Easypanel

## 🎯 Objetivo

Hacer que las imágenes que subes persistan entre despliegues del backend.

**Problema actual**:
```
Subes imagen → Redespliegas → ❌ Imagen desaparece
```

**Con volumen persistente**:
```
Subes imagen → Redespliegas → ✅ Imagen persiste
```

---

## 📋 Pasos en Easypanel

### Paso 1: Acceder al Servicio Backend

1. Abrir Easypanel
2. Ir a tu proyecto
3. Click en el servicio **backend**

### Paso 2: Configurar Volumen

1. En el menú lateral, click en **Volumes** o **Almacenamiento**
2. Click en **Add Volume** o **Agregar Volumen**
3. Configurar:

```
Name: uploads-data
Mount Path: /app/uploads
Size: 5GB (o lo que necesites)
```

4. Click en **Save** o **Guardar**

### Paso 3: Redesplegar

1. Click en **Rebuild** o **Redesplegar**
2. Esperar a que termine
3. ✅ Listo

---

## 🔍 Verificación

### Probar que Funciona:

```
1. Subir una imagen desde el dashboard
   ├─ Ir a Servicios → Editar → Subir imagen
   └─ Guardar

2. Verificar que se ve
   ├─ Abrir frontend
   └─ Ver que la imagen carga

3. Redesplegar backend
   ├─ Easypanel → Backend → Rebuild
   └─ Esperar

4. Verificar que persiste
   ├─ Abrir frontend de nuevo
   └─ ✅ La imagen sigue ahí
```

---

## 📊 Configuración Detallada

### Opción A: Interfaz Gráfica (Recomendado)

```
Easypanel Dashboard
└─ Tu Proyecto
   └─ Backend Service
      └─ Volumes
         └─ Add Volume
            ├─ Name: uploads-data
            ├─ Mount Path: /app/uploads
            ├─ Size: 5GB
            └─ Save
```

### Opción B: Docker Compose (Si usas)

```yaml
# En tu docker-compose.yml de Easypanel
services:
  backend:
    image: tu-imagen
    volumes:
      - uploads-data:/app/uploads
    # ... resto de configuración

volumes:
  uploads-data:
    driver: local
```

### Opción C: Dockerfile (Ya está configurado)

```dockerfile
# Ya está en tu Dockerfile.production
RUN mkdir -p uploads
# Easypanel monta el volumen aquí automáticamente
```

---

## 🗂️ Estructura de Uploads

```
/app/uploads/                    ← Volumen persistente
├── services/                    ← Imágenes de servicios
│   ├── uuid-1.jpg
│   ├── uuid-2.jpg
│   └── ...
├── products/                    ← Imágenes de productos
│   ├── uuid-3.jpg
│   └── ...
├── banners/                     ← Banners del frontend
│   ├── uuid-4.jpg
│   └── ...
├── featured/                    ← Imágenes destacadas
│   ├── uuid-5.jpg
│   └── ...
└── company/                     ← Logo de la empresa
    └── logo.png
```

---

## ⚙️ Configuración Avanzada

### Aumentar Tamaño del Volumen

Si necesitas más espacio:

```
1. Easypanel → Backend → Volumes
2. Click en el volumen "uploads-data"
3. Cambiar Size: 10GB (o lo que necesites)
4. Save
5. Rebuild (opcional, depende de Easypanel)
```

### Backup del Volumen

```bash
# Desde Easypanel terminal o SSH
tar -czf uploads-backup.tar.gz /app/uploads

# Descargar el archivo
# O moverlo a otro lugar seguro
```

### Restaurar Backup

```bash
# Subir archivo al servidor
# Luego extraer:
tar -xzf uploads-backup.tar.gz -C /app/
```

---

## 🔧 Solución de Problemas

### Problema: Volumen no se crea

**Síntomas**: Error al crear volumen

**Solución**:
1. Verificar que tienes espacio en el servidor
2. Verificar permisos
3. Contactar soporte de Easypanel

### Problema: Imágenes no persisten

**Síntomas**: Después de redesplegar, imágenes desaparecen

**Verificar**:
```bash
# En terminal de Easypanel
ls -la /app/uploads
# Debe mostrar las imágenes

# Verificar que el volumen está montado
df -h | grep uploads
```

**Solución**:
1. Verificar que el Mount Path es correcto: `/app/uploads`
2. Verificar que el volumen está activo
3. Redesplegar de nuevo

### Problema: Permisos denegados

**Síntomas**: Error al subir imágenes

**Solución**:
```bash
# En terminal de Easypanel
chown -R nodejs:nodejs /app/uploads
chmod -R 755 /app/uploads
```

### Problema: Volumen lleno

**Síntomas**: No se pueden subir más imágenes

**Verificar**:
```bash
du -sh /app/uploads
# Muestra cuánto espacio usa
```

**Solución**:
1. Aumentar tamaño del volumen
2. O limpiar imágenes viejas/no usadas

---

## 📈 Monitoreo

### Ver Uso del Volumen

```bash
# Espacio total usado
du -sh /app/uploads

# Espacio por carpeta
du -sh /app/uploads/*

# Archivos más grandes
du -ah /app/uploads | sort -rh | head -20
```

### Listar Imágenes

```bash
# Todas las imágenes
find /app/uploads -type f -name "*.jpg" -o -name "*.png"

# Contar imágenes
find /app/uploads -type f \( -name "*.jpg" -o -name "*.png" \) | wc -l

# Imágenes recientes
find /app/uploads -type f -mtime -7
```

---

## 🎯 Mejores Prácticas

### 1. Tamaño Inicial Adecuado

```
Pequeño proyecto: 5GB
Mediano proyecto: 10GB
Grande proyecto: 20GB+
```

### 2. Limpieza Periódica

```bash
# Eliminar imágenes huérfanas (no referenciadas en BD)
# Crear script para esto
```

### 3. Backup Regular

```bash
# Automatizar backup semanal
# Guardar en otro servidor o S3
```

### 4. Optimización de Imágenes

```typescript
// Ya está implementado en tu backend
// Sharp optimiza automáticamente al subir
```

---

## 🚀 Alternativa Futura: Cloudflare R2

Si en el futuro quieres migrar a almacenamiento en la nube:

### Ventajas de R2:
```
✅ Gratis hasta 10GB
✅ Imágenes accesibles desde cualquier lugar
✅ CDN incluido (más rápido)
✅ No depende del servidor
✅ Backups automáticos
```

### Cuándo Migrar:
```
- Cuando tengas muchas imágenes (>5GB)
- Cuando necesites CDN
- Cuando escales a múltiples servidores
```

### Costo Estimado:
```
10GB: Gratis
50GB: ~$0.75/mes
100GB: ~$1.50/mes
```

---

## ✅ Checklist de Configuración

- [ ] Acceder a Easypanel
- [ ] Ir al servicio Backend
- [ ] Crear volumen "uploads-data"
- [ ] Mount Path: /app/uploads
- [ ] Size: 5GB (o más)
- [ ] Guardar configuración
- [ ] Redesplegar backend
- [ ] Probar subiendo una imagen
- [ ] Redesplegar de nuevo
- [ ] Verificar que la imagen persiste
- [ ] ✅ Configuración completa

---

## 📞 Comandos de Referencia

```bash
# Ver volúmenes montados
df -h

# Ver contenido de uploads
ls -lah /app/uploads

# Ver espacio usado
du -sh /app/uploads

# Verificar permisos
ls -la /app | grep uploads

# Cambiar permisos (si es necesario)
chown -R nodejs:nodejs /app/uploads
chmod -R 755 /app/uploads
```

---

## 🎉 Resultado Final

```
ANTES:
Subir imagen → Redesplegar → ❌ Perdida

AHORA:
Subir imagen → Redesplegar → ✅ Persiste
```

**Tiempo de configuración**: 5 minutos
**Beneficio**: Imágenes permanentes
**Costo**: Incluido en Easypanel

---

**Estado**: 📝 Pendiente de configurar
**Siguiente**: Probar flujo completo de desarrollo a producción
