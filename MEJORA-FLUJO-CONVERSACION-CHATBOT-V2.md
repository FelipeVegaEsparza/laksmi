# Mejora del Flujo de Conversación del Chatbot - Versión 2

## Problemas Identificados

### Problema 1: Bot saltaba directamente a un servicio específico
El chatbot estaba ofreciendo un servicio específico cuando el usuario preguntaba por una categoría general (ej: "depilación"), sin mostrar primero todas las opciones disponibles.

**Ejemplo del problema:**
- Usuario: "quiero reservar una hora para depilacion"
- Bot: "Claro, puedo ayudarte con eso. ¿Te gustaría reservar la *depilación láser bigote (8 sesiones)*?" + [link]

### Problema 2: Bot enviaba link de reserva demasiado pronto
El chatbot estaba enviando el link de reserva inmediatamente después de mostrar las opciones, incluso cuando el usuario solo estaba explorando y no había confirmado que quería agendar.

**Ejemplo del problema:**
- Usuario: "Hola, me gustaría agendar una secionde depilacion laser"
- Bot: [Muestra todas las opciones correctamente] + "📅 Para reservar tu cita, haz clic aquí: [link]"
- ❌ El usuario aún no eligió una opción específica ni confirmó que quiere reservar

## Soluciones Implementadas

### Solución 1: Mostrar todas las opciones primero (✅ Ya implementado)

**Archivo modificado**: `backend/src/services/AIService.ts`

Se mejoró el prompt del sistema para que el AI:
1. Detecte cuando el usuario pregunta por una CATEGORÍA de servicio
2. Muestre TODAS las opciones disponibles con nombre y precio
3. NO incluya descripciones ni detalles en la primera respuesta
4. Pregunte cuál opción le interesa al usuario

### Solución 2: Generar link solo con confirmación explícita (✅ Nuevo)

**Archivo modificado**: `backend/src/services/ai/MessageRouter.ts`

Se modificó la función `generateBookingLinkIfNeeded` para que:

1. **NO genere link si el usuario está explorando**:
   - Detecta palabras de exploración: "opciones", "cuáles", "información", "precio", etc.
   - Si detecta exploración, NO genera link

2. **SOLO genere link con confirmación EXPLÍCITA**:
   - Palabras de confirmación explícita: "sí quiero", "quiero reservar", "quiero ese", "confirmo", etc.
   - Removidas palabras ambiguas como "quiero", "agendar" (que se usan en consultas iniciales)

## Flujo de Conversación Mejorado

```
PASO 1 - Usuario pregunta por categoría
Usuario: "quiero depilación"
↓
Bot: Muestra TODAS las opciones con nombre y precio
Bot: "¿De cuál de estos te gustaría conocer más detalles?"
🚫 NO envía link todavía

PASO 2 - Usuario elige una opción
Usuario: "quiero saber más del bigote"
↓
Bot: Proporciona detalles completos (descripción, beneficios, duración, sesiones)
🚫 NO envía link todavía

PASO 3 - Usuario confirma que quiere agendar
Usuario: "sí quiero reservar ese" o "quiero agendar"
↓
Bot: Confirma y envía link de reserva
✅ Ahora SÍ envía el link
```

## Cambios Técnicos

### AIService.ts
```typescript
// Agregado en el prompt del sistema:
⚠️ REGLA OBLIGATORIA: Cuando el usuario pregunte por un TIPO o CATEGORÍA de tratamiento,
SIEMPRE debes:
1. Da UNA SOLA línea de explicación general
2. Lista TODAS las variantes con SOLO nombre y precio
3. NO incluyas descripciones, beneficios, duración, sesiones
4. NO envíes links de reserva todavía
5. SIEMPRE termina preguntando: "¿De cuál de estos te gustaría conocer más detalles?"
```

### MessageRouter.ts
```typescript
// Modificado en generateBookingLinkIfNeeded:

// ANTES: Detectaba "quiero", "agendar", "reservar" como confirmación
const confirmationKeywords = [
  'sí', 'si', 'claro', 'quiero', 'agendar', 'reservar' // ❌ Muy amplio
];

// DESPUÉS: Solo detecta confirmación EXPLÍCITA
const explorationKeywords = [
  'opciones', 'cuáles', 'información', 'precio' // 🚫 Bloquea link
];

const confirmationKeywords = [
  'sí quiero', 'quiero reservar', 'quiero ese', 'confirmo' // ✅ Más específico
];
```

## Cómo Probar

### Test 1: Consulta inicial (NO debe enviar link)
```
Usuario: "quiero depilación"
Esperado: 
- ✅ Muestra todas las opciones
- ✅ Pregunta cuál le interesa
- ✅ NO envía link
```

### Test 2: Pedir más información (NO debe enviar link)
```
Usuario: "quiero saber más del bigote"
Esperado:
- ✅ Da detalles completos
- ✅ NO envía link todavía
```

### Test 3: Confirmación explícita (SÍ debe enviar link)
```
Usuario: "sí quiero reservar ese"
Esperado:
- ✅ Confirma la reserva
- ✅ Envía link de reserva
```

## Archivos Modificados

1. `backend/src/services/AIService.ts` - Prompt mejorado (ya desplegado)
2. `backend/src/services/ai/MessageRouter.ts` - Lógica de generación de link mejorada (nuevo)

## Próximos Pasos

1. Hacer commit de los cambios en MessageRouter.ts
2. Push a GitHub
3. Easypanel hará rebuild automático
4. Probar en producción

## Notas Importantes

- ⚠️ Los cambios son compatibles con el flujo anterior
- ⚠️ No se modificó la base de datos
- ⚠️ No se requieren migraciones
- ⚠️ El cambio es automático una vez que se reinicia el backend
