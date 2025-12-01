# Mejora del Flujo de Conversación del Chatbot

## Problema Identificado

El chatbot estaba saltando directamente a ofrecer un servicio específico cuando el usuario preguntaba por una categoría de tratamiento (ej: "depilación"), sin mostrar primero todas las opciones disponibles.

### Ejemplo del problema:
**Usuario**: "quiero reservar una hora para depilacion"

**Respuesta incorrecta del bot**:
```
Claro, puedo ayudarte con eso. ¿Te gustaría reservar la *depilación láser bigote (8 sesiones)*? 
[incluye link de reserva]
```

**Respuesta correcta esperada**:
```
La depilación láser es un tratamiento para eliminar el vello de forma permanente. Tenemos estas opciones:

• Depilación láser bigote (8 sesiones) - $120,000
• Depilación láser axilas (8 sesiones) - $180,000
• Depilación láser piernas completas (8 sesiones) - $450,000
• Depilación láser brasileño (8 sesiones) - $280,000

¿De cuál de estos te gustaría conocer más detalles?
```

## Solución Implementada

Se modificó el prompt del sistema en `backend/src/services/AIService.ts` para hacer más explícitas y enfáticas las instrucciones sobre cómo manejar consultas de servicios.

### Cambios realizados:

1. **Reforzamiento de la regla en "CÓMO MANEJAR PREGUNTAS"**:
   - Se agregó una línea específica que indica que cuando se pregunta por una CATEGORÍA de servicios, SIEMPRE se deben mostrar TODAS las opciones disponibles primero.

2. **Mejora del "FORMATO DE RESPUESTA PARA CONSULTAS DE SERVICIOS"**:
   - Se cambió el título a "CRÍTICO - DEBES SEGUIR ESTO SIEMPRE" para mayor énfasis
   - Se agregó una "REGLA OBLIGATORIA" con emoji de advertencia (⚠️)
   - Se incluyó un ejemplo INCORRECTO para mostrar explícitamente qué NO hacer
   - Se enfatizó que NO se deben enviar links de reserva en la primera respuesta
   - Se agregó una nota importante al final sobre no asumir servicios específicos

### Flujo de conversación mejorado:

```
PASO 1 - Usuario pregunta por categoría
↓
Bot muestra TODAS las opciones con nombre y precio
↓
Bot pregunta: "¿De cuál de estos te gustaría conocer más detalles?"
↓
PASO 2 - Usuario elige una opción específica
↓
Bot proporciona detalles completos (descripción, beneficios, duración, sesiones)
↓
PASO 3 - Usuario confirma que quiere agendar
↓
Bot envía link de reserva
```

## Cómo probar

1. Reiniciar el backend para que los cambios surtan efecto:
   ```bash
   docker-compose restart backend
   ```

2. Enviar un mensaje de WhatsApp con una consulta genérica:
   - "quiero depilación"
   - "información sobre masajes"
   - "cuánto cuesta la criolipólisis"

3. Verificar que el bot:
   - Muestre TODAS las opciones disponibles
   - NO ofrezca un servicio específico directamente
   - Pregunte cuál opción le interesa al usuario
   - Solo después de que el usuario elija, proporcione detalles completos

## Archivos modificados

- `backend/src/services/AIService.ts` - Prompt del sistema mejorado

## Próximos pasos (opcional)

Si el problema persiste, se podría:

1. Crear un sistema de detección de intención más robusto que identifique cuando el usuario está preguntando por una categoría vs un servicio específico
2. Implementar un sistema de diálogo multi-paso que fuerce el flujo de conversación
3. Agregar ejemplos de entrenamiento específicos para este caso en el prompt
4. Considerar usar function calling de OpenAI para estructurar mejor las respuestas

## Notas

- Los cambios son inmediatos una vez que se reinicia el backend
- No se requieren cambios en la base de datos
- No afecta otras funcionalidades del chatbot
- El prompt sigue siendo compatible con todas las demás consultas (productos, políticas, etc.)
