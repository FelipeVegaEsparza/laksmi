# Guía de Zonas Horarias - Sistema Laxmi

## 🌍 Cómo Funciona

El sistema usa **UTC (Coordinated Universal Time)** como estándar para almacenar todas las fechas en la base de datos. Esto es una **buena práctica** porque:

1. ✅ Evita problemas con cambios de horario de verano
2. ✅ Permite que el sistema funcione en cualquier zona horaria
3. ✅ Facilita la sincronización entre frontend, backend y base de datos

## 🇨🇱 Chile y UTC

**Chile está en UTC-3** (o UTC-4 en horario de verano)

Esto significa:
- **12:00 UTC** = **09:00 Chile** (UTC-3)
- **15:00 UTC** = **12:00 Chile** (UTC-3)
- **18:00 UTC** = **15:00 Chile** (UTC-3)

## 📊 Ejemplo Real

### Lo que ves en el Dashboard:
```
Cita: 1 de diciembre, 2025 a las 09:00
```

### Lo que está en la base de datos:
```sql
date_time: 2025-12-01 12:00:00 UTC
```

### Lo que ve el sistema de disponibilidad:
```
Cita ocupa: 12:00 UTC a 13:00 UTC (60 minutos)
Bloquea slots: 10:30, 11:00, 11:30, 12:00, 12:30 (en UTC)
```

### Lo que ve el usuario en el frontend:
```
Horarios NO disponibles: 07:30, 08:00, 08:30, 09:00, 09:30 (en hora Chile)
```

## ✅ El Sistema Funciona Correctamente

Cuando creaste la cita a las "09:00" en el dashboard:
1. El dashboard convierte 09:00 Chile → 12:00 UTC
2. Se guarda 12:00 UTC en la base de datos
3. El sistema de disponibilidad verifica conflictos en UTC
4. El frontend muestra los horarios en hora local de Chile

**Todo está funcionando como debe.**

## 🔧 Cómo Crear Citas Correctamente

### Desde el Dashboard:

1. Selecciona la fecha y hora en **hora local de Chile**
2. El sistema automáticamente convierte a UTC
3. Se guarda correctamente en la base de datos

**Ejemplo:**
- Quieres una cita a las 09:00 (Chile)
- Seleccionas: `01-12-2025 09:00`
- Se guarda como: `2025-12-01 12:00:00 UTC`
- ✅ Correcto

### Desde el Frontend Público:

1. El usuario ve horarios en **hora local de Chile**
2. Selecciona un horario (ej: 09:00)
3. El sistema convierte a UTC automáticamente
4. Se guarda correctamente

## 🐛 Problema que Encontramos

**Lo que pensábamos:**
- "La cita está a las 09:00 pero el sistema muestra 09:00 como disponible"

**La realidad:**
- La cita está a las 12:00 UTC (09:00 Chile)
- El sistema correctamente bloquea 12:00 UTC
- El frontend muestra 09:00 Chile como NO disponible
- ✅ Todo funciona correctamente

## 📝 Verificación

Para verificar que una cita está guardada correctamente:

### En el Dashboard:
```
Fecha mostrada: 1 de diciembre, 2025 a las 09:00
```

### En los logs del backend:
```
date_time: 2025-12-01T12:00:00.000Z  ← Esto es UTC
```

### Conversión:
```
12:00 UTC - 3 horas = 09:00 Chile ✅
```

## 🎯 Conclusión

**NO necesitas cambiar nada.** El sistema está funcionando perfectamente.

La confusión era porque:
- El dashboard muestra en hora Chile
- La base de datos guarda en UTC
- Los logs muestran en UTC

Pero todo está sincronizado correctamente.

## 📚 Recursos

- [UTC en Wikipedia](https://es.wikipedia.org/wiki/Tiempo_universal_coordinado)
- [Zonas horarias de Chile](https://es.wikipedia.org/wiki/Huso_horario_de_Chile)
- [Best Practices for Timezones](https://stackoverflow.com/questions/2532729/daylight-saving-time-and-time-zone-best-practices)

---

**Última actualización**: 01 Diciembre 2024
**Estado**: ✅ Sistema funcionando correctamente
