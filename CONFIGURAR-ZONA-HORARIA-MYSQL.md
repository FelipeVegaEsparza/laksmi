# Configurar Zona Horaria de MySQL a Chile

## 🎯 Objetivo

Configurar MySQL para que guarde las fechas en hora de Chile (America/Santiago) en lugar de UTC.

## 📋 Pasos en Easypanel

### 1. Acceder a MySQL

En Easypanel:
1. Ve a tu proyecto "Laxmi"
2. Busca el servicio de MySQL
3. Haz clic en "Terminal" o "Console"

### 2. Conectarse a MySQL

Ejecuta este comando en la terminal:
```bash
mysql -u root -p
```

Ingresa la contraseña de MySQL cuando te la pida.

### 3. Verificar Zona Horaria Actual

Primero verifica la zona horaria actual:
```sql
SELECT @@global.time_zone, @@session.time_zone;
```

Probablemente verás:
```
+--------------------+---------------------+
| @@global.time_zone | @@session.time_zone |
+--------------------+---------------------+
| SYSTEM             | SYSTEM              |
+--------------------+---------------------+
```

### 4. Configurar Zona Horaria de Chile

Ejecuta estos comandos:
```sql
SET GLOBAL time_zone = 'America/Santiago';
SET SESSION time_zone = 'America/Santiago';
```

### 5. Verificar el Cambio

```sql
SELECT @@global.time_zone, @@session.time_zone;
```

Deberías ver:
```
+--------------------+---------------------+
| @@global.time_zone | @@session.time_zone |
+--------------------+---------------------+
| America/Santiago   | America/Santiago    |
+--------------------+---------------------+
```

### 6. Salir de MySQL

```sql
EXIT;
```

## 🔧 Hacer el Cambio Permanente

Para que el cambio persista después de reiniciar MySQL, necesitas agregar la configuración al archivo de MySQL.

### Opción A: Variables de Entorno en Easypanel

1. Ve al servicio MySQL en Easypanel
2. Busca la sección "Environment Variables"
3. Agrega:
   ```
   TZ=America/Santiago
   ```
4. Reinicia el servicio MySQL

### Opción B: Archivo de Configuración

Si Easypanel permite montar archivos de configuración:

1. Crea un archivo `my.cnf` con:
   ```ini
   [mysqld]
   default-time-zone='America/Santiago'
   ```

2. Monta este archivo en `/etc/mysql/conf.d/timezone.cnf`

## 🔄 Actualizar Conexión del Backend

Ahora necesitas configurar el backend para que use la zona horaria de Chile al conectarse:

### Archivo: `backend/src/config/database.ts`

Busca la configuración de Knex y agrega:

```typescript
const config: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinica_belleza',
    timezone: 'America/Santiago'  // ← AGREGAR ESTA LÍNEA
  },
  // ... resto de la configuración
};
```

## 🧪 Probar el Cambio

### 1. Crear una Cita de Prueba

Desde el dashboard, crea una cita para las 09:00 (hora Chile).

### 2. Verificar en la Base de Datos

Conéctate a MySQL y ejecuta:
```sql
USE clinica_belleza;
SELECT id, date_time, status FROM bookings ORDER BY date_time DESC LIMIT 5;
```

Ahora deberías ver:
```
date_time: 2025-12-01 09:00:00  ← Hora de Chile
```

En lugar de:
```
date_time: 2025-12-01 12:00:00  ← UTC
```

### 3. Verificar Disponibilidad

Ve al frontend público y verifica que los horarios ocupados se muestren correctamente.

## ⚠️ Consideraciones Importantes

### Horario de Verano

Chile cambia entre:
- **UTC-3** (horario de verano, octubre-abril)
- **UTC-4** (horario normal, abril-octubre)

MySQL con `America/Santiago` maneja esto automáticamente.

### Citas Existentes

Las citas que ya están en la base de datos seguirán estando en UTC. Tienes dos opciones:

#### Opción 1: Dejarlas como están (Recomendado)
- Las citas futuras se guardarán en hora Chile
- Las citas antiguas quedan en UTC
- El sistema las mostrará correctamente de todas formas

#### Opción 2: Convertir las Existentes
```sql
-- CUIDADO: Esto modifica todas las citas existentes
UPDATE bookings 
SET date_time = DATE_SUB(date_time, INTERVAL 3 HOUR)
WHERE date_time > NOW();
```

**⚠️ IMPORTANTE**: Solo ejecuta esto si estás seguro. Haz un backup primero.

## 🎯 Resultado Final

Después de esta configuración:

### Antes:
- Dashboard muestra: 09:00 (Chile)
- Base de datos guarda: 12:00 (UTC)
- Logs muestran: 12:00 (UTC)

### Después:
- Dashboard muestra: 09:00 (Chile)
- Base de datos guarda: 09:00 (Chile)
- Logs muestran: 09:00 (Chile)

## 📝 Checklist

- [ ] Conectarse a MySQL en Easypanel
- [ ] Ejecutar `SET GLOBAL time_zone = 'America/Santiago';`
- [ ] Agregar variable de entorno `TZ=America/Santiago` en MySQL
- [ ] Agregar `timezone: 'America/Santiago'` en `backend/src/config/database.ts`
- [ ] Reiniciar MySQL
- [ ] Reiniciar Backend
- [ ] Probar creando una cita
- [ ] Verificar en la base de datos
- [ ] Verificar disponibilidad en frontend

---

**Última actualización**: 01 Diciembre 2024
**Estado**: Pendiente de aplicar
