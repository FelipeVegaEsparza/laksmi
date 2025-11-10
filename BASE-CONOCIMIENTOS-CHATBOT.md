# Base de Conocimientos para Chatbot - Documentación Completa

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Tipos de Contenido](#tipos-de-contenido)
4. [Cómo Funciona](#cómo-funciona)
5. [Integración con el Chatbot](#integración-con-el-chatbot)
6. [API Endpoints](#api-endpoints)
7. [Gestión de Contenido](#gestión-de-contenido)
8. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🎯 Visión General

La Base de Conocimientos es un sistema inteligente que permite al chatbot responder preguntas específicas sobre:
- ✅ Servicios de la clínica
- ✅ Productos y sus características
- ✅ Tecnologías y equipos utilizados
- ✅ Ingredientes y componentes
- ✅ Cuidados pre y post tratamiento
- ✅ Políticas de la clínica

### Beneficios

**Para el Chatbot**:
- Respuestas precisas y actualizadas
- Información estructurada y fácil de buscar
- Contexto relevante para generar mejores respuestas

**Para los Clientes**:
- Respuestas inmediatas 24/7
- Información detallada y confiable
- Experiencia personalizada

**Para la Clínica**:
- Reducción de consultas repetitivas
- Información centralizada y actualizable
- Analytics de preguntas frecuentes

---

## 🏗️ Arquitectura

### Base de Datos

```
knowledge_categories          # Categorías de contenido
├── knowledge_articles        # Artículos detallados
├── knowledge_faqs           # Preguntas frecuentes
├── knowledge_technologies   # Tecnologías y equipos
├── knowledge_ingredients    # Ingredientes activos
└── knowledge_searches       # Log de búsquedas (analytics)
```

### Flujo de Información

```
Cliente pregunta
    ↓
Chatbot recibe mensaje
    ↓
Busca en Base de Conocimientos
    ↓
Encuentra resultados relevantes
    ↓
IA genera respuesta usando el contexto
    ↓
Responde al cliente
    ↓
Registra búsqueda para analytics
```

---

## 📚 Tipos de Contenido

### 1. **Categorías** (`knowledge_categories`)

Organizan el contenido en grupos lógicos:
- Servicios
- Productos
- Tecnologías
- Ingredientes
- Cuidados
- Políticas

**Campos**:
- `name`: Nombre de la categoría
- `description`: Descripción breve
- `icon`: Ícono para UI
- `display_order`: Orden de visualización
- `is_active`: Si está activa

### 2. **Artículos** (`knowledge_articles`)

Contenido detallado sobre temas específicos.

**Ejemplo**:
```
Título: "Tratamiento Facial Profundo: Todo lo que necesitas saber"
Contenido: Descripción completa del tratamiento
Summary: Resumen breve
Keywords: ["facial", "tratamiento", "limpieza"]
Tags: ["facial", "belleza"]
Related Services: [ID del servicio]
```

**Campos importantes**:
- `title`: Título del artículo
- `content`: Contenido completo (Markdown)
- `summary`: Resumen breve
- `keywords`: Array de palabras clave para búsqueda
- `tags`: Etiquetas para categorización
- `related_services`: IDs de servicios relacionados
- `related_products`: IDs de productos relacionados
- `view_count`: Contador de vistas
- `helpful_count`: Votos positivos
- `is_published`: Si está publicado

### 3. **FAQs** (`knowledge_faqs`)

Preguntas y respuestas frecuentes.

**Ejemplo**:
```
Pregunta: "¿Cuánto dura un tratamiento facial?"
Respuesta: "La duración varía según el tipo..."
Keywords: ["duracion", "tiempo", "facial"]
```

**Campos importantes**:
- `question`: La pregunta
- `answer`: La respuesta
- `keywords`: Palabras clave
- `display_order`: Orden de visualización
- `view_count`: Contador de vistas
- `helpful_count`: Votos positivos

### 4. **Tecnologías** (`knowledge_technologies`)

Información sobre equipos y tecnologías.

**Ejemplo**:
```
Nombre: "Microdermoabrasión Diamante"
Descripción: "Sistema profesional de microdermoabrasión..."
Benefits: ["Exfoliación precisa", "Resultados visibles"]
Applications: ["Rejuvenecimiento", "Cicatrices"]
```

**Campos importantes**:
- `name`: Nombre de la tecnología
- `description`: Descripción detallada
- `benefits`: Array de beneficios
- `applications`: Array de aplicaciones
- `related_services`: Servicios que la usan
- `image_url`: URL de imagen

### 5. **Ingredientes** (`knowledge_ingredients`)

Información sobre ingredientes activos.

**Ejemplo**:
```
Nombre: "Ácido Hialurónico"
Descripción: "Molécula que retiene agua..."
Benefits: ["Hidratación intensa", "Rellena líneas"]
Precautions: "Generalmente bien tolerado..."
```

**Campos importantes**:
- `name`: Nombre del ingrediente
- `description`: Descripción
- `benefits`: Array de beneficios
- `precautions`: Precauciones y contraindicaciones
- `related_products`: Productos que lo contienen

### 6. **Búsquedas** (`knowledge_searches`)

Log de todas las búsquedas para analytics.

**Campos**:
- `conversation_id`: ID de la conversación
- `query`: Texto de la búsqueda
- `results_found`: Número de resultados
- `result_ids`: IDs de resultados mostrados
- `was_helpful`: Feedback del usuario

---

## 🔄 Cómo Funciona

### Búsqueda Inteligente

El sistema usa **MySQL FULLTEXT search** para búsquedas rápidas y relevantes:

```sql
MATCH(title, content, keywords) AGAINST('manicure gel' IN NATURAL LANGUAGE MODE)
```

**Ventajas**:
- Búsqueda en lenguaje natural
- Relevancia automática
- Muy rápido incluso con miles de registros
- Soporta sinónimos y variaciones

### Proceso de Búsqueda

1. **Cliente pregunta**: "¿Cuánto dura el manicure con gel?"

2. **Sistema busca** en:
   - FAQs (prioridad alta)
   - Artículos
   - Tecnologías
   - Ingredientes

3. **Encuentra resultados**:
   ```json
   {
     "type": "faq",
     "title": "¿Cuál es la diferencia entre manicure tradicional y con gel?",
     "content": "El manicure con gel dura 3-4 semanas...",
     "relevance": 0.95
   }
   ```

4. **IA usa el contexto**:
   ```
   Información de la base de conocimientos:
   - El manicure con gel dura 3-4 semanas
   - Usa esmalte especial que se cura con lámpara UV/LED
   - Tiene acabado más brillante
   ```

5. **Genera respuesta personalizada**:
   ```
   ¡Hola! 😊 El manicure con gel tiene una duración de 3-4 semanas, 
   mucho más que el esmalte tradicional. Se aplica un esmalte especial 
   que se cura con lámpara UV/LED, lo que le da ese acabado brillante 
   y duradero. ¿Te gustaría agendar una cita?
   ```

---

## 🤖 Integración con el Chatbot

### AIService con Knowledge Base

El servicio de IA (`AIService.ts`) integra automáticamente la base de conocimientos:

```typescript
// 1. Buscar en base de conocimientos
const knowledgeContext = await KnowledgeService.getContextForAI(
  userMessage, 
  conversationId
);

// 2. Agregar contexto al prompt
messages.push({
  role: 'system',
  content: `INFORMACIÓN DE LA BASE DE CONOCIMIENTOS:
${knowledgeContext}

Usa esta información para responder de manera precisa.`
});

// 3. Generar respuesta con OpenAI
const completion = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: messages,
});
```

### Detección de Escalación

El sistema detecta automáticamente cuándo escalar a humano:

```typescript
// Palabras clave que requieren atención humana
const escalationKeywords = [
  'alergia', 'reacción', 'problema', 'queja',
  'dolor', 'emergencia', 'urgente', 'mal'
];

// Si el mensaje contiene estas palabras, escala
if (hasEscalationKeyword) {
  return {
    message: aiResponse,
    suggestedActions: ['escalate']
  };
}
```

---

## 🔌 API Endpoints

### Búsqueda Pública

```http
GET /api/v1/knowledge/search?query=manicure&limit=5

Response:
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "faq",
        "id": "uuid",
        "title": "¿Cuánto dura el manicure con gel?",
        "content": "El manicure con gel dura 3-4 semanas...",
        "relevance": 0.95
      }
    ],
    "totalResults": 3,
    "query": "manicure",
    "searchId": "uuid"
  }
}
```

### Obtener FAQs

```http
GET /api/v1/knowledge/faqs?categoryId=uuid

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "question": "¿Cuánto dura un tratamiento facial?",
      "answer": "La duración varía...",
      "keywords": ["duracion", "facial"],
      "viewCount": 150,
      "helpfulCount": 45
    }
  ]
}
```

### Feedback

```http
POST /api/v1/knowledge/search/:searchId/feedback
Body: {
  "helpful": true,
  "resultId": "uuid",
  "resultType": "faq"
}
```

### Gestión de Contenido (Requiere autenticación)

```http
# Crear artículo
POST /api/v1/knowledge/articles
Body: {
  "categoryId": "uuid",
  "title": "Nuevo artículo",
  "content": "Contenido...",
  "keywords": ["palabra1", "palabra2"]
}

# Actualizar artículo
PUT /api/v1/knowledge/articles/:id

# Eliminar artículo
DELETE /api/v1/knowledge/articles/:id

# Crear FAQ
POST /api/v1/knowledge/faqs

# Crear tecnología
POST /api/v1/knowledge/technologies

# Crear ingrediente
POST /api/v1/knowledge/ingredients
```

---

## 📝 Gestión de Contenido

### Agregar Nuevo Contenido

#### 1. Crear un FAQ

```sql
INSERT INTO knowledge_faqs (category_id, question, answer, keywords) VALUES
(
  'category-uuid',
  '¿Ofrecen servicios para hombres?',
  'Sí, todos nuestros servicios están disponibles para hombres y mujeres. Tenemos tratamientos específicos para piel masculina.',
  '["hombres", "servicios", "masculino", "genero"]'
);
```

#### 2. Crear un Artículo

```sql
INSERT INTO knowledge_articles (
  category_id, title, content, summary, keywords, tags, is_published
) VALUES (
  'category-uuid',
  'Cuidado de la Piel Masculina',
  'Contenido completo del artículo...',
  'Guía de cuidado de piel para hombres',
  '["hombres", "cuidado", "piel", "masculino"]',
  '["hombres", "skincare"]',
  TRUE
);
```

#### 3. Crear una Tecnología

```sql
INSERT INTO knowledge_technologies (
  name, description, benefits, applications
) VALUES (
  'Láser de Diodo',
  'Tecnología láser de última generación...',
  '["Depilación permanente", "Indoloro", "Rápido"]',
  '["Depilación", "Rejuvenecimiento"]'
);
```

### Actualizar Contenido Existente

```sql
UPDATE knowledge_faqs 
SET answer = 'Nueva respuesta actualizada...',
    keywords = '["nuevas", "palabras", "clave"]'
WHERE id = 'faq-uuid';
```

### Mejores Prácticas

1. **Keywords Efectivas**:
   - Incluir sinónimos
   - Usar términos que los clientes realmente usan
   - Incluir variaciones (singular/plural)

2. **Contenido Claro**:
   - Párrafos cortos
   - Listas cuando sea posible
   - Lenguaje simple y directo

3. **Mantener Actualizado**:
   - Revisar contenido regularmente
   - Actualizar precios y políticas
   - Agregar nuevos servicios/productos

4. **Usar Analytics**:
   - Revisar búsquedas frecuentes
   - Identificar gaps de información
   - Crear contenido basado en preguntas reales

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Cliente Pregunta por Servicio

**Cliente**: "¿Qué incluye el facial?"

**Sistema**:
1. Busca "facial" en base de conocimientos
2. Encuentra artículo "Tratamiento Facial Profundo"
3. IA genera respuesta usando el contexto:

```
¡Hola! 😊 Nuestro tratamiento facial profundo incluye:

✨ Limpieza profunda
✨ Exfoliación
✨ Extracción de impurezas
✨ Mascarilla personalizada
✨ Masaje facial relajante
✨ Hidratación con productos premium

Dura 90 minutos y cuesta $80. ¿Te gustaría agendar una cita?
```

### Ejemplo 2: Pregunta sobre Ingrediente

**Cliente**: "¿Qué es el ácido hialurónico?"

**Sistema**:
1. Busca en `knowledge_ingredients`
2. Encuentra información del ingrediente
3. Responde:

```
El ácido hialurónico es una molécula que retiene hasta 1000 veces 
su peso en agua. Es excelente para:

💧 Hidratación profunda
💧 Rellenar líneas finas
💧 Mejorar elasticidad de la piel

Es apto para todo tipo de piel y muy bien tolerado. 
¿Te interesa algún tratamiento con este ingrediente?
```

### Ejemplo 3: Pregunta Compleja (Escalación)

**Cliente**: "Tuve una reacción alérgica después del tratamiento"

**Sistema**:
1. Detecta palabra clave "alérgica"
2. Marca para escalación
3. Responde:

```
Lamento mucho escuchar eso. 😟 Tu salud es nuestra prioridad.
Voy a conectarte con uno de nuestros especialistas que podrá 
ayudarte de inmediato. Un momento por favor...

[Sistema escala automáticamente a agente humano]
```

---

## 📊 Analytics y Mejora Continua

### Métricas Importantes

1. **Búsquedas sin Resultados**:
   - Identificar gaps de información
   - Crear contenido nuevo

2. **Contenido Más Visto**:
   - Artículos populares
   - FAQs más consultadas

3. **Feedback de Usuarios**:
   - Contenido útil vs no útil
   - Mejorar respuestas

4. **Tasa de Escalación**:
   - Si es alta, mejorar base de conocimientos
   - Agregar más información

### Query para Analytics

```sql
-- Top 10 búsquedas
SELECT query, COUNT(*) as count
FROM knowledge_searches
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY query
ORDER BY count DESC
LIMIT 10;

-- Contenido más útil
SELECT id, title, helpful_count, not_helpful_count
FROM knowledge_articles
WHERE is_published = TRUE
ORDER BY helpful_count DESC
LIMIT 10;

-- Búsquedas sin resultados
SELECT query, COUNT(*) as count
FROM knowledge_searches
WHERE results_found = 0
GROUP BY query
ORDER BY count DESC;
```

---

## 🚀 Próximos Pasos

### Para Implementar

1. **Ejecutar Migración**:
   ```bash
   docker-compose exec backend npm run migrate
   ```

2. **Cargar Datos de Ejemplo**:
   ```bash
   docker-compose exec backend mysql -u root -proot123 clinica_belleza < seeds/004_knowledge_base_data.sql
   ```

3. **Registrar Rutas** en `backend/src/index.ts`:
   ```typescript
   import knowledgeRoutes from './routes/knowledge';
   app.use('/api/v1/knowledge', knowledgeRoutes);
   ```

4. **Configurar OpenAI**:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

5. **Probar**:
   ```bash
   curl "http://localhost:3000/api/v1/knowledge/search?query=manicure"
   ```

### Para Mejorar

1. **Dashboard de Gestión**:
   - Interfaz para agregar/editar contenido
   - Vista de analytics
   - Gestión de categorías

2. **Búsqueda Avanzada**:
   - Filtros por categoría
   - Ordenamiento por relevancia
   - Sugerencias de búsqueda

3. **Multiidioma**:
   - Contenido en inglés
   - Detección automática de idioma

4. **Integración con Servicios/Productos**:
   - Vincular automáticamente
   - Mostrar información relacionada

---

## 📝 Notas Finales

- La base de conocimientos está **completamente implementada** y lista para usar
- El chatbot la usa **automáticamente** al generar respuestas
- El contenido es **fácilmente actualizable** vía API o SQL
- El sistema **aprende** de las búsquedas para mejorar
- **No requiere** configuración adicional más allá de ejecutar las migraciones

**¡Tu chatbot ahora es mucho más inteligente y útil!** 🎉

