# Instrucciones para Aplicar los Cambios

## Cambios Realizados

Se modificó el prompt del sistema del chatbot en `backend/src/services/AIService.ts` para que:

1. **SIEMPRE muestre todas las opciones** cuando el usuario pregunte por una categoría de servicio (ej: "depilación", "masajes", "faciales")
2. **NO salte directamente** a ofrecer un servicio específico
3. **Pregunte al usuario** cuál opción le interesa antes de dar detalles completos

## Cómo Aplicar los Cambios

### Opción 1: Reiniciar solo el backend (Recomendado)

```bash
docker-compose restart backend
```

### Opción 2: Reiniciar todo el sistema

```bash
docker-compose down
docker-compose up -d
```

### Opción 3: Si estás en producción (Easypanel)

1. Hacer commit de los cambios:
   ```bash
   git add backend/src/services/AIService.ts
   git commit -m "Mejora flujo de conversación del chatbot - mostrar opciones antes de detalles"
   git push
   ```

2. En Easypanel, hacer rebuild del servicio backend

## Cómo Probar

1. Envía un mensaje de WhatsApp al chatbot con una consulta genérica:
   - "quiero depilación"
   - "información sobre depilación láser"
   - "cuánto cuesta la depilación"

2. **Resultado esperado**:
   ```
   La depilación láser es un tratamiento para eliminar el vello de forma permanente. 
   Tenemos estas opciones:

   • Depilación láser bigote (8 sesiones) - $120,000
   • Depilación láser axilas (8 sesiones) - $180,000
   • Depilación láser piernas completas (8 sesiones) - $450,000
   • Depilación láser brasileño (8 sesiones) - $280,000

   ¿De cuál de estos te gustaría conocer más detalles?
   ```

3. **Resultado NO esperado** (lo que estaba pasando antes):
   ```
   Claro, puedo ayudarte con eso. ¿Te gustaría reservar la *depilación láser bigote (8 sesiones)*? 
   [link de reserva]
   ```

## Verificar que Funcionó

Después de reiniciar el backend:

1. Revisa los logs del backend:
   ```bash
   docker-compose logs -f backend
   ```

2. Busca líneas que digan:
   ```
   Services loaded for AI context: X services with full details
   ```

3. Envía un mensaje de prueba y verifica que el bot:
   - ✅ Muestre TODAS las opciones disponibles
   - ✅ NO ofrezca un servicio específico directamente
   - ✅ Pregunte cuál opción le interesa
   - ✅ Solo después de que elijas, dé detalles completos

## Si el Problema Persiste

Si después de reiniciar el backend el bot sigue saltando directamente a un servicio específico:

1. Verifica que el archivo `backend/src/services/AIService.ts` tenga los cambios
2. Verifica que el backend se haya reiniciado correctamente
3. Limpia la caché de conversaciones (si existe)
4. Revisa los logs del backend para ver si hay errores

## Archivos Modificados

- `backend/src/services/AIService.ts` - Prompt del sistema mejorado
- `MEJORA-FLUJO-CONVERSACION-CHATBOT.md` - Documentación de los cambios
- `INSTRUCCIONES-APLICAR-CAMBIOS.md` - Este archivo

## Notas Importantes

- ⚠️ Los cambios solo afectan el comportamiento del chatbot, no la base de datos
- ⚠️ No se requieren migraciones
- ⚠️ El cambio es inmediato una vez que se reinicia el backend
- ⚠️ No afecta otras funcionalidades del chatbot (productos, políticas, etc.)
