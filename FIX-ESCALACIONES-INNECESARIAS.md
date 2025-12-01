# Fix: Escalaciones Innecesarias

## Problema

El bot estaba escalando preguntas normales como "que tipo de depilacion tienen para hombres?" cuando debería responder con las opciones disponibles.

**Ejemplo del problema:**
```
Usuario: "cuales son las tecnologias que ustedes utilizan?"
Bot: Responde correctamente ✅

Usuario: "que tipo de depilacion tienen para hombres?"
Bot: "Lo siento, ha ocurrido un problema. Un especialista te contactará pronto." ❌
```

## Causa Raíz

El servicio de escalación (`EscalationService.ts`) estaba detectando palabras comunes como "problema" como quejas, causando escalaciones innecesarias.

Además, el umbral de confianza era demasiado alto (0.4), causando que preguntas normales se escalaran por "baja confianza".

## Solución Implementada

### 1. Palabras de Queja Más Específicas

**ANTES** (Muy sensible):
```typescript
const complaintKeywords = [
  'queja', 'problema', 'error', 'mal servicio', 'insatisfecho',
  'terrible', 'horrible', 'pésimo', 'fatal', 'desastre',
  'reembolso', 'devolver dinero', 'cancelar todo'
];
```

**DESPUÉS** (Más específico):
```typescript
const complaintKeywords = [
  'queja formal', 'mal servicio', 'muy insatisfecho', 'muy molesto',
  'terrible servicio', 'horrible servicio', 'pésimo servicio', 
  'quiero reembolso', 'devolver dinero', 'cancelar todo',
  'hablar con gerente', 'hablar con supervisor', 'quiero quejarme'
];
```

**Cambios clave:**
- ❌ Removida "problema" (muy común en respuestas normales)
- ❌ Removida "queja" sola (muy amplia)
- ❌ Removida "error" (muy común)
- ✅ Agregadas frases completas más específicas
- ✅ Solo detecta quejas REALES

### 2. Umbral de Confianza Más Bajo

**ANTES:**
```typescript
confidenceThreshold: 0.4  // Muy alto
maxFailedAttempts: 5
```

**DESPUÉS:**
```typescript
confidenceThreshold: 0.3  // Más bajo, menos sensible
maxFailedAttempts: 8      // Más intentos antes de escalar
```

### 3. Palabras de Complejidad Más Específicas

**ANTES:**
```typescript
complexityKeywords: [
  'problema', 'queja', 'error', 'mal servicio', // ❌ Muy amplio
  'reembolso', 'cancelar todo', 'gerente', 'supervisor',
  'legal', 'demanda', 'abogado', 'denuncia'
]
```

**DESPUÉS:**
```typescript
complexityKeywords: [
  'mal servicio', 'muy insatisfecho',  // ✅ Más específico
  'quiero reembolso', 'cancelar todo', 
  'hablar con gerente', 'hablar con supervisor',
  'demanda legal', 'abogado', 'denuncia formal'
]
```

## Resultado Esperado

Ahora el bot:
- ✅ Responde preguntas normales sin escalar
- ✅ Solo escala quejas REALES y explícitas
- ✅ Tiene más intentos antes de escalar por baja confianza
- ✅ No se confunde con palabras comunes como "problema"

## Ejemplos de Comportamiento

### Caso 1: Pregunta Normal (NO debe escalar)
```
Usuario: "que tipo de depilacion tienen para hombres?"
Bot: [Muestra opciones de depilación] ✅
```

### Caso 2: Pregunta sobre Tecnologías (NO debe escalar)
```
Usuario: "cuales son las tecnologias que ustedes utilizan?"
Bot: [Explica las tecnologías] ✅
```

### Caso 3: Queja Real (SÍ debe escalar)
```
Usuario: "quiero hacer una queja formal, el servicio fue pésimo"
Bot: "Te voy a conectar con un especialista..." ✅
```

### Caso 4: Solicitud de Gerente (SÍ debe escalar)
```
Usuario: "quiero hablar con el gerente"
Bot: "Te conecto con un agente humano..." ✅
```

## Commit

```
7358bd5 - Fix: Reducir escalaciones innecesarias - solo escalar quejas reales
```

## Estado

- ✅ Código subido a GitHub
- ⏳ Esperando rebuild de Easypanel
- ⏳ Backend se reiniciará automáticamente en 2-5 minutos

## Cómo Probar

Una vez que Easypanel termine el rebuild:

### Test 1: Pregunta sobre servicios (NO debe escalar)
```
Enviar: "que tipo de depilacion tienen para hombres?"
Esperar: Bot muestra opciones de depilación
```

### Test 2: Pregunta sobre tecnologías (NO debe escalar)
```
Enviar: "cuales son las tecnologias que utilizan?"
Esperar: Bot explica las tecnologías
```

### Test 3: Queja real (SÍ debe escalar)
```
Enviar: "quiero hacer una queja formal"
Esperar: Bot conecta con agente humano
```

## Notas

- Este fix reduce significativamente las escalaciones innecesarias
- El bot ahora es más tolerante con preguntas normales
- Solo escala cuando hay quejas REALES y explícitas
- Compatible con todos los cambios anteriores
