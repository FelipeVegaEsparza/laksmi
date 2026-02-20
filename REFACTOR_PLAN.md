# Plan de Refactorización MessageRouter

## Cambios Críticos a Implementar

### 1. NO MUTAR request.clientId ✅
- Usar variable local `effectiveClientId`
- Mantener request.clientId inmutable

### 2. Contexto Fresco Después de Guardar Mensaje ✅
- Llamar `ContextManager.getContext(conversation.id)` después de guardar mensaje
- Usar `freshContext` para NLU, AI, booking management

### 3. Takeover Humano ANTES de Detección por Número ✅
- Mover check de takeover humano ANTES de la detección de número
- Si hay takeover, guardar mensaje pero NO responder

### 4. Confirmación Robusta Sin Falsos Positivos ✅
- Eliminar keywords cortos como "si", "sí", "ok"
- Usar estado explícito: `awaitingBookingConfirmation`
- Solo generar link con: confirmación válida + serviceId + servicio activo

### 5. SERVICE_ID Persistente ✅
- Extraer [SERVICE_ID:xxx] ANTES de limpiar
- Guardar en context Y en metadata del mensaje
- No depender de búsqueda en mensajes históricos

### 6. detectAndSaveServiceOptions Robusto ✅
- Parser tolerante a variaciones
- Normalización de precio
- Match flexible

## Orden de Ejecución Correcto

1. Validaciones sistema (mantenimiento, OpenAI)
2. Validar request
3. Rate limit
4. Obtener/crear cliente (SIN mutar request.clientId)
5. Obtener/crear conversación
6. Guardar mensaje cliente
7. Actualizar contexto
8. **OBTENER CONTEXTO FRESCO**
9. Capturar serviceId de metadata
10. **CHECK TAKEOVER HUMANO** (si activo, return early)
11. Detección por número (si aplica)
12. Procesar con NLU (usando freshContext)
13. Verificaciones especiales (email, phone, etc.)
14. Booking management (usando freshContext)
15. Escalación
16. Generar respuesta AI (usando freshContext)
17. Extraer SERVICE_ID del mensaje AI
18. Detectar y guardar service options
19. Generar booking link (con confirmación robusta)
20. Guardar respuesta AI (con metadata completo)
21. Return response
