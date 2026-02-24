# Fix: Dashboard se recarga por error de date-fns

## 🐛 Problema Identificado

El dashboard se recargaba completamente cuando se escalaba una conversación debido a un error de `date-fns`:

```
RangeError: Invalid time value
Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. 
Please use `parseISO` to parse strings.
```

## 🔍 Causa Raíz

El código estaba intentando formatear fechas que venían como strings desde el backend usando `format(new Date(dateString))`, pero `date-fns` v2+ requiere que uses `parseISO()` para convertir strings ISO a objetos Date.

Cuando llegaba una notificación de escalación y el dashboard intentaba renderizar las conversaciones, encontraba fechas en formato string y lanzaba un error que causaba que React recargara la aplicación.

## ✅ Solución Aplicada

### 1. Importar `parseISO`

```typescript
import { format, isToday, isYesterday, parseISO } from 'date-fns'
```

### 2. Modificar `formatMessageTime` para manejar strings

```typescript
const formatMessageTime = (date: Date | string) => {
  // Si es string, parsearlo primero
  const messageDate = typeof date === 'string' ? parseISO(date) : new Date(date)
  
  // Validar que la fecha es válida
  if (isNaN(messageDate.getTime())) {
    return 'Fecha inválida'
  }
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm', { locale: es })
  } else if (isYesterday(messageDate)) {
    return 'Ayer'
  } else {
    return format(messageDate, 'dd/MM/yyyy', { locale: es })
  }
}
```

### 3. Proteger el formateo de timestamps en mensajes

```typescript
{(() => {
  try {
    const timestamp = typeof message.timestamp === 'string' 
      ? parseISO(message.timestamp) 
      : new Date(message.timestamp)
    return format(timestamp, 'HH:mm', { locale: es })
  } catch (error) {
    return '--:--'
  }
})()}
```

## 📁 Archivo Modificado

- `dashboard/src/pages/ConversationsPage.tsx`
  - Importado `parseISO` de `date-fns`
  - Modificado `formatMessageTime` para manejar strings y validar fechas
  - Agregado try-catch al formateo de timestamps de mensajes

## 🎯 Beneficios

1. **No más crashes:** El dashboard ya no se recarga cuando hay fechas inválidas
2. **Mejor manejo de errores:** Si una fecha es inválida, muestra un texto alternativo en lugar de crashear
3. **Compatibilidad:** Funciona tanto con objetos Date como con strings ISO
4. **Validación:** Verifica que las fechas sean válidas antes de formatearlas

## 🧪 Prueba

1. Escalar una conversación desde el chatbot
2. El dashboard debería:
   - Recibir la notificación
   - Actualizar la lista de conversaciones
   - NO recargarse
   - Mostrar las fechas correctamente

## 📊 Impacto

- **Antes:** Dashboard se recargaba completamente al escalar conversaciones
- **Después:** Dashboard se actualiza suavemente sin recargar
- **Experiencia:** Mucho mejor para el usuario, no pierde el estado ni la posición

## 🚀 Despliegue

```bash
git add dashboard/src/pages/ConversationsPage.tsx FIX-DASHBOARD-RELOAD-DATE-FNS.md
git commit -m "Fix: Prevenir reload del dashboard por error de date-fns al escalar conversaciones"
git push
```

Easypanel hará rebuild automático (2-3 minutos).

---

**Fecha:** 2026-02-24
**Autor:** Kiro AI
**Estado:** Listo para desplegar
**Prioridad:** Alta - Fix crítico
