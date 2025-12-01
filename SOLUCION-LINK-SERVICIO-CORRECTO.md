# Solución: Link de Servicio Correcto

## Problema

El bot no estaba enviando el link del servicio específico que recomendó. Enviaba un link genérico sin el ID del servicio.

**Ejemplo del problema:**
```
Bot: "La depilación láser de cejas es un tratamiento eficaz... [detalles]"
Usuario: "si, quiero agendar"
Bot: Link genérico → https://esteticala ksmi.cl/reservar?service=8ddda4c9-c358-11f0-84d2-02420a000390
     (ID incorrecto o genérico)
```

## Causa Raíz

El sistema intentaba detectar el servicio del texto del mensaje del AI, pero:
- Los nombres de servicios en la BD no siempre coinciden exactamente con lo que el AI dice
- El algoritmo de coincidencia parcial no era lo suficientemente preciso
- Había ambigüedad cuando múltiples servicios tenían palabras similares

## Solución Implementada

Implementé un sistema donde el **AI incluye el ID del servicio directamente** en su respuesta usando un formato especial que el usuario no ve.

### Cómo Funciona

1. **AI incluye marcador especial**: Cuando el AI da detalles de un servicio específico, incluye `[SERVICE_ID:abc123]` al final de su respuesta

2. **Sistema extrae el ID**: El MessageRouter busca este marcador en los mensajes recientes del AI

3. **Sistema limpia el marcador**: Antes de enviar el mensaje al usuario, se elimina el marcador `[SERVICE_ID:xxx]`

4. **Sistema genera link correcto**: Usa el ID extraído para generar el link con el servicio específico

### Cambios Técnicos

#### AIService.ts - Prompt del Sistema

```typescript
FORMATO ESPECIAL PARA SERVICIOS:
Cuando des detalles de UN servicio específico, incluye su ID en este formato al final de tu respuesta:
[SERVICE_ID:ID_DEL_SERVICIO]

Ejemplo:
"La depilación láser de cejas es un tratamiento eficaz... [detalles]... [SERVICE_ID:abc123]"
```

#### MessageRouter.ts - Extracción del ID

```typescript
// PRIORIDAD 0: Buscar ID de servicio en formato especial [SERVICE_ID:xxx]
const recentAIMessages = context.lastMessages
  .filter((msg: any) => msg.senderType === 'ai')
  .slice(-3)
  .reverse();

for (const aiMsg of recentAIMessages) {
  const serviceIdMatch = aiMsg.content.match(/\[SERVICE_ID:([^\]]+)\]/);
  if (serviceIdMatch) {
    const extractedId = serviceIdMatch[1];
    const matchingService = services.find((s: any) => s.id === extractedId);
    
    if (matchingService) {
      serviceId = matchingService.id;
      serviceName = matchingService.name;
      logger.info('✅ SERVICE_ID found in AI message:', { serviceId, serviceName });
      break;
    }
  }
}
```

#### MessageRouter.ts - Limpieza del Marcador

```typescript
// Limpiar marcadores especiales [SERVICE_ID:xxx] del mensaje antes de enviarlo
let finalMessage = aiResult.message.replace(/\[SERVICE_ID:[^\]]+\]/g, '').trim();
```

## Flujo Completo

```
PASO 1: Usuario pregunta por opciones
Usuario: "depilacion de cejas"
↓
Bot: Muestra todas las opciones

PASO 2: Usuario elige una opción
Usuario: "quiero saber más de las cejas"
↓
Bot: "La depilación láser de cejas es un tratamiento eficaz...
      Precio: $60,500
      Duración: 60 minutos
      Sesiones recomendadas: 8
      [SERVICE_ID:abc123-def456-ghi789]"
      
(El usuario NO ve el [SERVICE_ID:...])

PASO 3: Usuario confirma
Usuario: "si, quiero agendar"
↓
Sistema: 
1. Busca [SERVICE_ID:abc123-def456-ghi789] en mensajes del AI
2. Encuentra el servicio correcto
3. Genera link: https://esteticala ksmi.cl/reservar?service=abc123-def456-ghi789
4. Limpia el marcador del mensaje
5. Envía mensaje limpio + link correcto
↓
Bot: "¡Perfecto! Te enviaré el enlace...
      
      📅 Para reservar tu cita, haz clic aquí:
      https://esteticala ksmi.cl/reservar?service=abc123-def456-ghi789"
```

## Ventajas de Esta Solución

✅ **100% preciso**: El AI sabe exactamente qué servicio está recomendando
✅ **Sin ambigüedad**: No depende de coincidencias de texto
✅ **Invisible para el usuario**: El marcador se elimina antes de enviar
✅ **Fallback inteligente**: Si no encuentra el marcador, usa el algoritmo anterior
✅ **Fácil de debuggear**: Los logs muestran claramente qué ID se encontró

## Commit

```
ecf9b32 - Fix: AI incluye SERVICE_ID en respuesta para link correcto
```

## Estado

- ✅ Código subido a GitHub
- ⏳ Esperando rebuild de Easypanel
- ⏳ Backend se reiniciará automáticamente en 2-5 minutos

## Cómo Probar

Una vez que Easypanel termine el rebuild:

### Test Completo
```
1. Enviar: "depilacion de cejas"
   Esperar: Bot muestra opciones

2. Enviar: "quiero saber más de las cejas"
   Esperar: Bot da detalles (sin ver [SERVICE_ID:...])

3. Enviar: "si, quiero agendar"
   Esperar: Bot envía link CON el ID correcto del servicio de cejas
```

### Verificar en el Link
El link debe ser algo como:
```
https://esteticala ksmi.cl/reservar?service=[ID-CORRECTO-DE-CEJAS]
```

NO debe ser un ID genérico o de otro servicio.

## Notas

- El marcador `[SERVICE_ID:xxx]` es invisible para el usuario
- El AI aprenderá a incluir este marcador en sus respuestas
- Si el AI olvida incluirlo, el sistema usa el algoritmo de detección anterior como fallback
- Esta solución es mucho más confiable que intentar detectar el servicio del texto
