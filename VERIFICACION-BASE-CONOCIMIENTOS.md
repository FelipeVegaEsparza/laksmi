# Verificación: Base de Conocimientos del Chatbot

## ✅ El Chatbot SÍ Está Buscando en la Base de Conocimientos

He revisado el código y confirmé que el sistema está configurado correctamente para buscar en la base de conocimientos.

## Flujo de Búsqueda

```
1. Usuario envía mensaje
   ↓
2. AIService.generateResponse() se ejecuta
   ↓
3. Llama a KnowledgeService.getContextForAI(userMessage, conversationId)
   ↓
4. KnowledgeService.search() busca en:
   - FAQs (knowledge_faqs)
   - Artículos (knowledge_articles)
   - Tecnologías (knowledge_technologies)
   - Ingredientes (knowledge_ingredients)
   ↓
5. Usa búsqueda FULLTEXT de MySQL:
   - MATCH(question, answer, keywords) AGAINST(query)
   ↓
6. Resultados se agregan al contexto del AI
   ↓
7. AI genera respuesta usando:
   - Base de conocimientos
   - Lista de servicios
   - Lista de productos
```

## Archivos Involucrados

### 1. AIService.ts (línea ~140)
```typescript
// Search knowledge base for relevant information
const knowledgeContext = await KnowledgeService.getContextForAI(userMessage, conversationId);
```

### 2. KnowledgeService.ts (línea ~50)
```typescript
const searchResults = await this.search({
  query,
  conversationId,
  limit: 5,
});

if (searchResults.results.length > 0) {
  context += 'INFORMACIÓN DE LA BASE DE CONOCIMIENTOS:\n\n';
  searchResults.results.forEach((result, index) => {
    context += `${index + 1}. ${result.title}\n`;
    context += `   ${result.content}\n\n`;
  });
}
```

### 3. Knowledge.ts (línea ~122)
```typescript
static async searchFAQs(query: string, limit: number = 10): Promise<SearchResult[]> {
  const faqs = await db('knowledge_faqs')
    .where('is_active', true)
    .whereRaw('MATCH(question, answer, keywords) AGAINST(? IN NATURAL LANGUAGE MODE)', [query])
    .limit(limit);
  
  return faqs.map(faq => ({
    type: 'faq' as const,
    id: faq.id,
    title: faq.question,
    content: faq.answer,
    relevance: 1,
    metadata: {
      categoryId: faq.category_id,
    }
  }));
}
```

## Cómo Verificar que Funciona

### 1. Verificar que hay FAQs en la base de datos

Desde el dashboard de administración:
- Ve a "Base de Conocimientos" → "FAQs"
- Verifica que hay FAQs creadas y activas
- Las FAQs iniciales se crearon en la migración 008_create_knowledge_base.sql

### 2. Verificar los logs del backend

Cuando el chatbot responde, deberías ver en los logs:
```
info: Services loaded for AI context: X services with full details
```

Si hay resultados de la base de conocimientos, el AI los usará en su respuesta.

### 3. Probar con preguntas que coincidan con FAQs

Las FAQs iniciales incluyen:
- "¿Cuánto dura un tratamiento facial?"
- "¿Cada cuánto debo hacerme un tratamiento de manicure?"
- "¿Qué productos utilizan en los tratamientos?"
- "¿Cuál es la política de cancelación?"
- "¿Qué cuidados debo tener después de un tratamiento facial?"

Prueba preguntando algo similar en WhatsApp:
- "cuanto dura un facial"
- "cada cuanto me hago manicure"
- "que productos usan"
- "como cancelo una cita"
- "cuidados despues de facial"

### 4. Verificar búsqueda FULLTEXT

La búsqueda usa FULLTEXT de MySQL, que busca en:
- `question` - La pregunta de la FAQ
- `answer` - La respuesta
- `keywords` - Palabras clave (JSON array)

**Importante**: FULLTEXT en MySQL tiene limitaciones:
- Palabras muy cortas (< 4 caracteres) pueden ser ignoradas
- Palabras muy comunes (stopwords) son ignoradas
- Necesita coincidencias parciales o completas

## Posibles Problemas

### 1. No hay FAQs en la base de datos
**Solución**: Crear FAQs desde el dashboard o verificar que la migración 008 se ejecutó correctamente.

### 2. FAQs están inactivas
**Solución**: Verificar que `is_active = true` en las FAQs.

### 3. Búsqueda FULLTEXT no encuentra coincidencias
**Solución**: 
- Usar palabras clave más específicas
- Agregar más keywords a las FAQs
- Verificar que las palabras no sean stopwords de MySQL

### 4. El AI no usa la información encontrada
**Solución**: El AI decide qué información usar. Si encuentra información en la base de conocimientos pero también tiene información de servicios, puede priorizar los servicios.

## Cómo Mejorar la Búsqueda

### 1. Agregar más FAQs
Desde el dashboard, agrega FAQs para preguntas comunes:
- Precios
- Horarios
- Ubicación
- Métodos de pago
- Promociones
- Contraindicaciones

### 2. Agregar keywords relevantes
Cuando crees una FAQ, agrega keywords que los usuarios podrían usar:
```json
["precio", "costo", "cuanto vale", "cuanto cuesta"]
```

### 3. Crear artículos detallados
Para información más extensa, usa Artículos en lugar de FAQs:
- Guías de cuidado
- Explicaciones de tecnologías
- Información sobre ingredientes

### 4. Monitorear búsquedas
El sistema registra todas las búsquedas en `knowledge_searches`:
```sql
SELECT query, results_found, was_helpful, created_at 
FROM knowledge_searches 
ORDER BY created_at DESC 
LIMIT 50;
```

Esto te ayuda a identificar:
- Qué preguntan los usuarios
- Qué búsquedas no encuentran resultados
- Qué FAQs necesitas agregar

## Estado Actual

✅ **Sistema configurado correctamente**
- El chatbot busca en la base de conocimientos
- Usa búsqueda FULLTEXT de MySQL
- Integra resultados en el contexto del AI

⚠️ **Verificar**:
- Que hay FAQs activas en la base de datos
- Que las keywords son relevantes
- Que las búsquedas encuentran resultados

## Próximos Pasos

1. **Verificar FAQs existentes**: Ve al dashboard y revisa cuántas FAQs hay
2. **Agregar más FAQs**: Crea FAQs para preguntas comunes de tus clientes
3. **Probar búsquedas**: Haz preguntas al chatbot que coincidan con las FAQs
4. **Monitorear logs**: Revisa los logs para ver si hay errores en la búsqueda
5. **Analizar búsquedas**: Usa la tabla `knowledge_searches` para ver qué buscan los usuarios

## Comandos Útiles

### Ver FAQs en la base de datos
```sql
SELECT id, question, is_active, view_count 
FROM knowledge_faqs 
ORDER BY display_order;
```

### Ver búsquedas recientes
```sql
SELECT query, results_found, created_at 
FROM knowledge_searches 
ORDER BY created_at DESC 
LIMIT 20;
```

### Ver FAQs más vistas
```sql
SELECT question, view_count, helpful_count 
FROM knowledge_faqs 
WHERE is_active = true 
ORDER BY view_count DESC 
LIMIT 10;
```
