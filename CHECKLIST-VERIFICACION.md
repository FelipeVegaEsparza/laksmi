# ✅ Checklist de Verificación

## 🐳 Verificación Docker

### 1. Contenedores Corriendo
```bash
docker-compose ps
```

Deberías ver 5 contenedores con estado "Up":
- [ ] clinica-belleza-mysql (healthy)
- [ ] clinica-belleza-redis (healthy)
- [ ] clinica-belleza-backend
- [ ] clinica-belleza-dashboard
- [ ] clinica-belleza-frontend

### 2. Servicios Accesibles
- [ ] Backend: http://localhost:3000 responde
- [ ] Dashboard: http://localhost:5173 carga
- [ ] Frontend: http://localhost:3001 carga

### 3. Base de Datos
```bash
docker-compose exec mysql mysql -u clinica_user -pclinica_pass -e "SHOW DATABASES;"
```
- [ ] Base de datos `clinica_belleza` existe

### 4. Login Dashboard
- [ ] Puedes hacer login con username: admin / password: admin123
- [ ] El dashboard muestra datos

### 5. Logs Sin Errores
```bash
docker-compose logs backend | grep -i error
```
- [ ] No hay errores críticos

---

## 💻 Verificación Sin Docker

### 1. Servicios Corriendo
- [ ] MySQL está corriendo (puerto 3306)
- [ ] Redis está corriendo (puerto 6379) - opcional
- [ ] Backend está corriendo (puerto 3000)
- [ ] Dashboard está corriendo (puerto 5173)
- [ ] Frontend está corriendo (puerto 3001)

### 2. Base de Datos
```bash
mysql -u root -p -e "SHOW DATABASES;"
```
- [ ] Base de datos `clinica_belleza` existe
- [ ] Tablas creadas (users, clients, services, etc.)

### 3. Backend
```bash
curl http://localhost:3000/api/v1/health
```
- [ ] Responde con `{"status":"ok"}`

### 4. Dashboard y Frontend
- [ ] Dashboard carga en http://localhost:5173
- [ ] Frontend carga en http://localhost:3001
- [ ] Puedes hacer login en el dashboard

---

## 🔍 Verificación Completa

### Backend API
- [ ] GET /api/v1/health responde
- [ ] POST /api/v1/auth/login funciona
- [ ] GET /api/v1/services/public lista servicios

### Dashboard
- [ ] Login funciona
- [ ] Muestra estadísticas
- [ ] Puede listar servicios
- [ ] Puede listar productos
- [ ] Puede listar citas

### Frontend
- [ ] Página principal carga
- [ ] Muestra servicios
- [ ] Chat funciona (si OpenAI está configurado)

---

## 🐛 Si algo falla

### Docker
```bash
# Ver logs
docker-compose logs -f nombre_servicio

# Reiniciar
docker-compose restart nombre_servicio

# Limpiar y reiniciar
docker-clean.bat  # o .sh
docker-init.bat   # o .sh
```

### Sin Docker
```bash
# Verificar procesos
netstat -ano | findstr :3000
netstat -ano | findstr :3306

# Reiniciar servicios
# Ctrl+C en cada terminal y volver a ejecutar npm run dev
```

---

¡Todo verificado! ✅
