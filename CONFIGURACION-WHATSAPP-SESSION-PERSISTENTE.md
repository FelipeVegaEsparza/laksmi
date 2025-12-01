# ✅ Configuración de Sesión Persistente de WhatsApp

## 🎯 Problema Resuelto

La sesión de WhatsApp ahora persiste entre reinicios del backend. **NO necesitarás escanear el QR cada vez**.

---

## 📋 Cambios Realizados

### 1. **docker-compose.yml** (Desarrollo)
```yaml
volumes:
  - ./backend/whatsapp-session:/app/whatsapp-session  # ✅ AGREGADO
```

### 2. **docker-compose.production.yml** (Producción)
```yaml
volumes:
  - backend_whatsapp_session:/app/whatsapp-session  # ✅ AGREGADO

# Y en la sección de volumes:
volumes:
  backend_whatsapp_session:
    driver: local  # ✅ AGREGADO
```

---

## 🔄 Cómo Funciona

### Primera Conexión:
1. Inicias el backend
2. Llamas al endpoint `/api/v1/whatsapp/connect`
3. Escaneas el QR con tu WhatsApp
4. La sesión se guarda en `whatsapp-session/`

### Reinicios Posteriores:
1. Reinicias el backend (`docker-compose restart backend`)
2. WhatsApp detecta la sesión guardada
3. Se conecta automáticamente **sin necesidad de QR** ✅
4. Listo para recibir y enviar mensajes

---

## 📁 Estructura de Archivos

```
backend/
├── whatsapp-session/          # ← Carpeta persistente
│   └── session/               # Datos de sesión de WhatsApp
│       ├── Default/
│       └── ...
├── uploads/                   # ← Ya persistente
└── logs/                      # ← Ya persistente
```

---

## 🚀 Para Aplicar los Cambios

### En Desarrollo (Local):

```bash
# 1. Detener los contenedores
docker-compose down

# 2. Reiniciar con la nueva configuración
docker-compose up -d

# 3. Si ya tenías una sesión activa, se mantendrá
# Si no, escanea el QR una vez y listo
```

### En Producción (Easypanel):

```bash
# 1. Hacer commit de los cambios
git add docker-compose.production.yml
git commit -m "feat: agregar persistencia de sesión WhatsApp"
git push

# 2. En Easypanel, hacer rebuild del backend
# La sesión se guardará en un volumen persistente

# 3. Primera vez: escanear QR
# Siguientes reinicios: conexión automática ✅
```

---

## ⚠️ Cuándo SÍ Necesitarás Escanear el QR de Nuevo

1. **Cierras sesión desde tu teléfono**
   - WhatsApp → Dispositivos vinculados → Cerrar sesión

2. **Eliminas manualmente la carpeta de sesión**
   ```bash
   rm -rf backend/whatsapp-session
   ```

3. **Usas el endpoint de disconnect**
   - `POST /api/v1/whatsapp/disconnect`
   - Este endpoint borra la sesión intencionalmente

4. **Cambias de número de WhatsApp**
   - Necesitas desconectar y reconectar con el nuevo número

---

## 🔍 Verificar que la Sesión Persiste

### Método 1: Verificar archivos
```bash
# En desarrollo
ls -la backend/whatsapp-session/session/

# En producción (dentro del contenedor)
docker exec clinica-backend ls -la /app/whatsapp-session/session/
```

### Método 2: Probar reinicio
```bash
# 1. Conectar WhatsApp y escanear QR
curl -X POST http://localhost:3000/api/v1/whatsapp/connect \
  -H "Authorization: Bearer TU_TOKEN"

# 2. Esperar a que conecte (status: connected)
curl http://localhost:3000/api/v1/whatsapp/status \
  -H "Authorization: Bearer TU_TOKEN"

# 3. Reiniciar backend
docker-compose restart backend

# 4. Esperar 30 segundos y verificar status
# Debería conectarse automáticamente sin QR ✅
curl http://localhost:3000/api/v1/whatsapp/status \
  -H "Authorization: Bearer TU_TOKEN"
```

---

## 📊 Estados de Conexión

| Estado | Descripción | Acción Requerida |
|--------|-------------|------------------|
| `disconnected` | Sin conexión | Llamar `/connect` |
| `qr` | QR generado | Escanear con WhatsApp |
| `connected` | Conectado y listo | Ninguna ✅ |
| `error` | Error de conexión | Revisar logs |

---

## 🐛 Troubleshooting

### Problema: "La sesión no persiste después de reiniciar"

**Solución 1**: Verificar que los volúmenes estén configurados
```bash
docker-compose config | grep whatsapp-session
```

**Solución 2**: Verificar permisos de la carpeta
```bash
ls -la backend/ | grep whatsapp-session
# Debe tener permisos de escritura
```

**Solución 3**: En Easypanel, verificar volúmenes persistentes
- Panel de Easypanel → Tu app → Volumes
- Debe existir: `backend_whatsapp_session` → `/app/whatsapp-session`

### Problema: "Error al inicializar WhatsApp"

**Causa común**: Chromium no instalado en producción

**Solución**: Ya está resuelto en `Dockerfile.production`:
```dockerfile
RUN apk add --no-cache chromium nss freetype harfbuzz
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

---

## 📝 Notas Importantes

1. **Seguridad**: La carpeta `whatsapp-session` contiene datos sensibles
   - Ya está en `.gitignore`
   - No commitear nunca esta carpeta

2. **Backups**: Considera hacer backup de la sesión
   ```bash
   # Backup
   tar -czf whatsapp-session-backup.tar.gz backend/whatsapp-session/
   
   # Restore
   tar -xzf whatsapp-session-backup.tar.gz
   ```

3. **Múltiples instancias**: 
   - No puedes tener el mismo número conectado en múltiples contenedores
   - WhatsApp solo permite una sesión activa por número

---

## ✅ Checklist de Verificación

- [x] Volumen agregado en `docker-compose.yml`
- [x] Volumen agregado en `docker-compose.production.yml`
- [x] Directorio creado en `Dockerfile.production`
- [x] Permisos correctos (777 para escritura)
- [x] `.gitignore` incluye `whatsapp-session/`
- [x] `LocalAuth` configurado en el código

---

## 🎉 Resultado Final

**Antes**: 
- ❌ Escanear QR cada vez que reiniciabas
- ❌ Sesión se perdía con cada deploy
- ❌ Interrupciones en el servicio

**Ahora**:
- ✅ Escaneas QR solo una vez
- ✅ Sesión persiste entre reinicios
- ✅ Servicio continuo sin interrupciones
- ✅ Reconexión automática

---

**Última actualización**: 2024-12-01
**Estado**: ✅ Configurado y funcionando
