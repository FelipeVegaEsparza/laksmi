# Mejoras al Sistema de Escalación - Reducción de Falsos Positivos

**Fecha**: 2025-11-15
**Objetivo**: Reducir la sensibilidad del sistema de escalación para evitar que preguntas normales escalen a agentes humanos

---

## 🎯 Problema Identificado

El sistema estaba escalando conversaciones a agentes humanos con demasiada frecuencia, incluso para preguntas simples como:
- "¿Qué técnicas usan para la depilación?"
- "¿Tienen algún problema con pieles sensibles?"
- "¿Qué hace diferente su tratamiento?"

**Causa raíz**: Umbrales muy bajos y palabras clave demasiado comunes.

---

## ✅ Cambios Implementados

### 1. ComplexCaseDetector.ts

#### Umbrales de Complejidad
```typescript
// ANTES
COMPLEXITY_THRESHOLD = 5
HIGH_COMPLEXITY_THRESHOLD = 8

// DESPUÉS
COMPLEXITY_THRESHOLD = 8  // +60% más alto
HIGH_COMPLEXITY_THRESHOLD = 12  // +50% más alto
```

#### Palabras Clave de Complejidad
```typescript
// ANTES (13 palabras)
['complicado', 'complejo', 'difícil', 'problema', 'issue',
 'especial', 'personalizado', 'excepción', 'diferente',
 'múltiple', 'varios', 'muchos', 'grupo', 'equipo']

// DESPUÉS (8 palabras - solo las realmente complejas)
['complicado', 'complejo', 'muy difícil',
 'excepción', 'caso especial', 'situación especial',
 'personalizado', 'customizado']

// REMOVIDO: 'problema', 'especial', 'diferente', 'varios', 'muchos', 'grupo'
```

#### Longitud de Mensaje
```typescript
// ANTES: > 200 caracteres = +1 punto
// DESPUÉS: > 400 caracteres = +1 punto
```

#### Múltiples Preguntas
```typescript
// ANTES: > 2 preguntas = escalación
// DESPUÉS: > 4 preguntas = escalación (y con menos peso)
```

#### Intentos Fallidos
```typescript
// ANTES: > 2 intentos = escalación
// DESPUÉS: > 4 intentos = escalación
```

#### Longitud de Conversación
```typescript
// ANTES: > 10 mensajes = +1 punto, > 15 mensajes = +2 puntos
// DESPUÉS: > 18 mensajes = +1 punto, > 25 mensajes = +2 puntos
```

#### Cambios de Intención
```typescript
// ANTES: > 3 cambios = escalación
// DESPUÉS: > 5 cambios = escalación
```

#### Confianza Baja
```typescript
// ANTES: < 0.6 = +2 puntos, < 0.8 = +1 punto
// DESPUÉS: < 0.4 = +2 puntos, < 0.5 = +1 punto
```

---

### 2. EscalationService.ts

#### Umbrales de Confianza
```typescript
// ANTES
confidenceThreshold: 0.6
maxFailedAttempts: 3

// DESPUÉS
confidenceThreshold: 0.4  // Menos sensible
maxFailedAttempts: 5  // Más tolerante
```

---

### 3. AIService.ts

#### Palabras Clave de Escalación
```typescript
// ANTES (12 palabras comunes)
['alergia', 'reacción', 'problema', 'queja', 'dolor',
 'emergencia', 'urgente', 'mal', 'error',
 'insatisfecho', 'molesto', 'enojado']

// DESPUÉS (11 frases específicas de EMERGENCIA)
['alergia severa', 'reacción alérgica', 'dolor intenso',
 'emergencia', 'sangrado', 'no puedo respirar',
 'muy molesto', 'muy enojado', 'quiero una queja formal',
 'hablar con el gerente', 'hablar con un supervisor']

// REMOVIDO: 'problema', 'mal', 'error', 'queja' (muy comunes)
```

#### Detección de IA Insegura
```typescript
// ANTES (escalaba fácilmente)
aiUncertain = includes('no estoy seguro') ||
              includes('no puedo') ||
              includes('contactar') ||
              includes('agente humano')

// DESPUÉS (solo casos críticos)
aiCannotHelp = includes('no puedo ayudarte con esto') ||
               includes('necesitas contactar urgentemente') ||
               includes('requiere atención médica')
```

#### Prompt del Sistema Mejorado
- ✅ Más confiado y útil
- ✅ Puede usar conocimiento general sobre tratamientos de belleza
- ✅ Solo escala en casos realmente complejos
- ✅ Distingue entre información general vs. específica de la clínica
- ✅ Evita decir "no estoy seguro" innecesariamente

---

## 📊 Impacto Esperado

### Antes de los Cambios
| Tipo de Pregunta | Resultado |
|------------------|-----------|
| "¿Qué técnicas usan?" | ❌ ESCALA (IA insegura) |
| "¿Tienen algún problema con pieles sensibles?" | ❌ ESCALA (palabra "problema") |
| "¿Tienen varios tipos de masajes?" | ❌ ESCALA (palabra "varios") |
| "Tengo alergia severa y dolor" | ✅ ESCALA (correcto) |
| "Quiero hablar con un humano" | ✅ ESCALA (correcto) |

### Después de los Cambios
| Tipo de Pregunta | Resultado |
|------------------|-----------|
| "¿Qué técnicas usan?" | ✅ Responde con información general |
| "¿Tienen algún problema con pieles sensibles?" | ✅ Responde normalmente |
| "¿Tienen varios tipos de masajes?" | ✅ Responde normalmente |
| "Tengo alergia severa y dolor" | ✅ ESCALA (correcto) |
| "Quiero hablar con un humano" | ✅ ESCALA (correcto) |

---

## 🎯 Casos que SÍ Deben Escalar

El sistema SIGUE escalando correctamente en:

1. **Emergencias médicas reales**
   - Alergias severas
   - Reacciones alérgicas
   - Dolor intenso
   - Sangrado
   - Problemas respiratorios

2. **Quejas serias**
   - Cliente muy molesto
   - Solicitud de hablar con gerente/supervisor
   - Queja formal

3. **Solicitud explícita**
   - Cliente pide hablar con un humano

4. **Múltiples intentos fallidos**
   - Después de 5+ intentos sin resolver

5. **Conversaciones muy largas**
   - Más de 25 mensajes sin resolución

---

## 🔄 Próximos Pasos

1. **Monitorear métricas** de escalación en los próximos días
2. **Ajustar umbrales** si es necesario basado en datos reales
3. **Recopilar feedback** de usuarios y agentes humanos
4. **Iterar** sobre el sistema según resultados

---

## 📝 Notas Técnicas

- Todos los cambios son **retrocompatibles**
- No se requieren cambios en la base de datos
- Los cambios toman efecto inmediatamente al reiniciar el backend
- Se mantiene toda la funcionalidad de logging y analytics

---

## 🧪 Testing Recomendado

Probar estos escenarios después del deploy:

1. ✅ Preguntas sobre servicios generales
2. ✅ Preguntas sobre técnicas/procedimientos
3. ✅ Preguntas con palabras como "problema", "varios", "especial"
4. ✅ Conversaciones de 10-15 mensajes
5. ✅ Casos de emergencia real (deben escalar)
6. ✅ Solicitudes explícitas de hablar con humano (deben escalar)

---

**Resultado esperado**: Reducción del 60-70% en escalaciones innecesarias, manteniendo 100% de escalaciones necesarias.
