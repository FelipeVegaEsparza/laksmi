# Dashboard de Base de Conocimientos - Documentación

## 🎯 Resumen

Se ha implementado una interfaz completa en el dashboard para gestionar la base de conocimientos del chatbot. Los administradores ahora pueden agregar, editar y eliminar contenido fácilmente.

---

## ✅ Funcionalidades Implementadas

### 1. **Página Principal** (`/knowledge`)

Una interfaz intuitiva con 4 tabs principales:

#### Tab 1: FAQs (Preguntas Frecuentes)
- ✅ Lista completa de todas las FAQs
- ✅ Crear nueva FAQ
- ✅ Editar FAQ existente
- ✅ Eliminar FAQ
- ✅ Ver detalles completos
- ✅ Estadísticas (vistas, votos útiles)
- ✅ Filtro por categoría
- ✅ Palabras clave para búsqueda

#### Tab 2: Artículos
- 📝 Preparado para futura implementación
- Estructura lista para agregar artículos detallados

#### Tab 3: Tecnologías
- ✅ Lista de tecnologías y equipos
- ✅ Crear nueva tecnología
- ✅ Descripción completa
- ✅ Beneficios y aplicaciones
- ✅ Vista en tarjetas

#### Tab 4: Ingredientes
- ✅ Lista de ingredientes activos
- ✅ Crear nuevo ingrediente
- ✅ Descripción y beneficios
- ✅ Precauciones
- ✅ Vista en tarjetas

### 2. **Estadísticas en Tiempo Real**

Tarjetas superiores mostrando:
- 📊 Total de FAQs
- 📊 Total de Tecnologías
- 📊 Total de Ingredientes
- 📊 Total de Categorías

### 3. **Diálogos de Gestión**

#### Crear/Editar FAQ
- Selector de categoría
- Campo de pregunta
- Campo de respuesta (multilinea)
- Palabras clave (separadas por coma)
- Validación de campos requeridos

#### Crear Tecnología
- Nombre
- Descripción detallada
- Beneficios (lista)
- Aplicaciones (lista)

#### Crear Ingrediente
- Nombre
- Descripción
- Beneficios (lista)
- Precauciones

---

## 🎨 Interfaz de Usuario

### Diseño
- **Material-UI** con tema consistente
- **Responsive** - funciona en móvil y desktop
- **Iconos intuitivos** para cada sección
- **Colores diferenciados** por tipo de contenido

### Experiencia de Usuario
- **Búsqueda visual** fácil
- **Acciones rápidas** (ver, editar, eliminar)
- **Feedback inmediato** con notificaciones
- **Confirmación** antes de eliminar

---

## 📁 Archivos Creados

### Frontend
```
dashboard/src/pages/KnowledgeBasePage.tsx  # Página principal
dashboard/src/App.tsx                      # Ruta agregada
dashboard/src/components/Layout.tsx        # Menú actualizado
```

### Estructura del Componente

```typescript
KnowledgeBasePage
├── Header con título
├── Alert informativo
├── Tarjetas de estadísticas (4)
├── Tabs de navegación (4)
├── Contenido según tab seleccionado
│   ├── FAQs (lista con acciones)
│   ├── Artículos (placeholder)
│   ├── Tecnologías (grid de tarjetas)
│   └── Ingredientes (grid de tarjetas)
└── Diálogos modales
    ├── FAQ Dialog
    ├── Technology Dialog
    ├── Ingredient Dialog
    └── View Dialog
```

---

## 🔌 Integración con API

### Endpoints Utilizados

```typescript
// Obtener datos
GET  /api/v1/knowledge/categories
GET  /api/v1/knowledge/faqs
GET  /api/v1/knowledge/technologies
GET  /api/v1/knowledge/ingredients

// Crear
POST /api/v1/knowledge/faqs
POST /api/v1/knowledge/technologies
POST /api/v1/knowledge/ingredients

// Actualizar
PUT  /api/v1/knowledge/faqs/:id

// Eliminar
DELETE /api/v1/knowledge/faqs/:id
```

### Manejo de Errores

- Try-catch en todas las operaciones
- Notificaciones de éxito/error con `notistack`
- Mensajes descriptivos para el usuario
- Logging en consola para debugging

---

## 🚀 Cómo Usar

### Acceder a la Página

1. Iniciar sesión en el dashboard
2. Click en "Base de Conocimientos" en el menú lateral
3. Verás las estadísticas y tabs

### Crear una FAQ

1. Click en tab "FAQs"
2. Click en botón "Nueva FAQ"
3. Seleccionar categoría
4. Escribir pregunta
5. Escribir respuesta
6. Agregar palabras clave (opcional pero recomendado)
7. Click en "Crear"

### Editar una FAQ

1. Buscar la FAQ en la lista
2. Click en ícono de editar (lápiz)
3. Modificar los campos
4. Click en "Actualizar"

### Eliminar una FAQ

1. Buscar la FAQ en la lista
2. Click en ícono de eliminar (papelera)
3. Confirmar en el diálogo
4. La FAQ se elimina

### Crear Tecnología/Ingrediente

1. Ir al tab correspondiente
2. Click en "Nueva Tecnología" o "Nuevo Ingrediente"
3. Llenar el formulario
4. Para listas (beneficios, aplicaciones), separar con comas
5. Click en "Crear"

---

## 💡 Mejores Prácticas

### Al Crear FAQs

1. **Pregunta Clara**: Usa el lenguaje que los clientes realmente usan
2. **Respuesta Completa**: Incluye toda la información necesaria
3. **Palabras Clave**: Agrega sinónimos y variaciones
   - Ejemplo: "manicure, uñas, esmalte, gel, duracion"
4. **Categoría Correcta**: Facilita la organización

### Al Crear Tecnologías

1. **Nombre Descriptivo**: Claro y profesional
2. **Descripción Detallada**: Explica qué es y cómo funciona
3. **Beneficios Específicos**: Lista ventajas concretas
4. **Aplicaciones Claras**: Indica para qué se usa

### Al Crear Ingredientes

1. **Nombre Científico y Común**: Si aplica
2. **Descripción Educativa**: Explica qué es
3. **Beneficios Comprobados**: Lista efectos reales
4. **Precauciones Importantes**: Alergias, contraindicaciones

---

## 📊 Estadísticas y Analytics

### Métricas Disponibles

Cada FAQ muestra:
- **View Count**: Cuántas veces se ha consultado
- **Helpful Count**: Cuántos usuarios la encontraron útil

Estas métricas ayudan a:
- Identificar contenido popular
- Detectar FAQs que necesitan mejora
- Priorizar actualizaciones

---

## 🔄 Flujo de Trabajo Recomendado

### Mantenimiento Regular

1. **Semanal**:
   - Revisar FAQs más vistas
   - Actualizar información desactualizada
   - Agregar nuevas preguntas frecuentes

2. **Mensual**:
   - Analizar búsquedas sin resultados
   - Crear contenido para gaps identificados
   - Revisar y actualizar tecnologías

3. **Trimestral**:
   - Auditoría completa de contenido
   - Eliminar información obsoleta
   - Reorganizar categorías si es necesario

### Proceso de Creación de Contenido

```
1. Identificar necesidad
   ↓
2. Investigar información
   ↓
3. Redactar contenido
   ↓
4. Agregar palabras clave
   ↓
5. Publicar en dashboard
   ↓
6. Probar con chatbot
   ↓
7. Ajustar según feedback
```

---

## 🎯 Casos de Uso

### Caso 1: Cliente Pregunta por Servicio Nuevo

**Problema**: Agregaste un nuevo servicio pero el chatbot no sabe responder

**Solución**:
1. Ir a Base de Conocimientos
2. Tab "FAQs"
3. Crear FAQ:
   - Pregunta: "¿Qué incluye el [nuevo servicio]?"
   - Respuesta: Descripción completa
   - Palabras clave: nombre del servicio, variaciones
4. El chatbot ahora puede responder

### Caso 2: Nueva Tecnología en la Clínica

**Problema**: Compraste nuevo equipo y quieres que el chatbot lo explique

**Solución**:
1. Ir a Base de Conocimientos
2. Tab "Tecnologías"
3. Crear Tecnología:
   - Nombre: Nombre del equipo
   - Descripción: Qué es y cómo funciona
   - Beneficios: Ventajas para el cliente
   - Aplicaciones: Para qué tratamientos se usa
4. El chatbot puede explicar la tecnología

### Caso 3: Clientes Preguntan lo Mismo

**Problema**: Recibes la misma pregunta repetidamente

**Solución**:
1. Identificar la pregunta común
2. Crear FAQ con respuesta clara
3. Agregar todas las variaciones como palabras clave
4. El chatbot responde automáticamente

---

## 🔧 Troubleshooting

### "No puedo crear FAQ"

**Posibles causas**:
- Campos requeridos vacíos
- No hay conexión con el backend
- No tienes permisos (requiere rol manager o admin)

**Solución**:
- Verifica que pregunta y respuesta estén llenas
- Revisa conexión en esquina superior derecha
- Contacta administrador si no tienes permisos

### "Los cambios no se reflejan en el chatbot"

**Posibles causas**:
- Caché del navegador
- Backend no reiniciado

**Solución**:
- Refresca la página (F5)
- Espera 1-2 minutos
- Prueba en ventana incógnita

### "Error al guardar"

**Posibles causas**:
- Problema de conexión
- Error en el servidor
- Datos inválidos

**Solución**:
- Revisa la consola del navegador (F12)
- Verifica que todos los campos sean válidos
- Intenta de nuevo en unos segundos

---

## 🚀 Próximas Mejoras Sugeridas

### Corto Plazo
1. **Búsqueda en la interfaz**: Filtrar FAQs por texto
2. **Ordenamiento**: Por fecha, vistas, utilidad
3. **Bulk actions**: Editar/eliminar múltiples items
4. **Preview**: Ver cómo se verá en el chatbot

### Mediano Plazo
1. **Editor rico**: Markdown para respuestas
2. **Imágenes**: Subir imágenes para tecnologías
3. **Versiones**: Historial de cambios
4. **Colaboración**: Múltiples editores

### Largo Plazo
1. **IA Assistant**: Sugerencias de mejora
2. **A/B Testing**: Probar diferentes respuestas
3. **Analytics avanzado**: Dashboard de métricas
4. **Multiidioma**: Contenido en varios idiomas

---

## 📝 Notas Finales

- ✅ **Interfaz completamente funcional** y lista para usar
- ✅ **Integrada con el backend** existente
- ✅ **Responsive** y accesible
- ✅ **Fácil de usar** para administradores
- ✅ **Impacto inmediato** en el chatbot

**¡Tu equipo ahora puede gestionar el conocimiento del chatbot fácilmente!** 🎉

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0.0
