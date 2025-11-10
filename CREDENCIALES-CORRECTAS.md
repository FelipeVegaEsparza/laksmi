# 🔑 Credenciales del Sistema

## ✅ Credenciales Correctas

### Dashboard Admin
```
Username: admin
Password: admin123
```

### Acceso
- **URL Dashboard:** http://localhost:5173
- **URL Frontend:** http://localhost:3001
- **URL API:** http://localhost:3000

---

## 🔄 Resetear Contraseña del Admin

Si olvidaste la contraseña o necesitas resetearla:

```powershell
# Ejecutar desde la raíz del proyecto
docker-compose exec backend node create-admin.js
```

Esto eliminará el usuario admin existente y creará uno nuevo con:
- **Username:** admin
- **Password:** admin123

---

## 📝 Notas Importantes

1. **El login usa USERNAME, no email**
   - ✅ Correcto: `username: "admin"`
   - ❌ Incorrecto: `email: "admin@clinica.com"`

2. **La contraseña es simple para desarrollo**
   - En producción, cámbiala por una más segura

3. **Si el login falla:**
   - Verifica que estés usando `admin` (username) no el email
   - Verifica que la contraseña sea `admin123` (todo minúsculas)
   - Resetea el admin con el comando de arriba

---

## 🔐 Cambiar Contraseña en Producción

Para cambiar la contraseña del admin:

1. Edita `backend/create-admin.js`
2. Cambia la línea:
   ```javascript
   const passwordHash = await bcrypt.hash('admin123', 12);
   ```
   Por:
   ```javascript
   const passwordHash = await bcrypt.hash('TU_NUEVA_CONTRASEÑA', 12);
   ```
3. Ejecuta:
   ```powershell
   docker-compose exec backend node create-admin.js
   ```

---

¡Listo! Ahora puedes hacer login con las credenciales correctas. 🎉
