# Sistema de Banners - Implementación Completa

## ✅ Implementado

### Backend

1. **Base de Datos**
   - Tabla `banners` creada con campos:
     - `id`, `title`, `description`, `link`, `image_url`
     - `order` (para ordenamiento)
     - `active` (para activar/desactivar)
     - `created_at`, `updated_at`

2. **API Endpoints** (`/api/v1/banners`)
   - `GET /banners` - Listar todos los banners (query param `activeOnly=true` para solo activos)
   - `GET /banners/:id` - Obtener banner por ID
   - `POST /banners` - Crear nuevo banner (Admin)
   - `PUT /banners/:id` - Actualizar banner (Admin)
   - `DELETE /banners/:id` - Eliminar banner (Admin)
   - `POST /banners/:id/upload-image` - Subir imagen del banner (Admin)
   - `POST /banners/reorder` - Reordenar banners (Admin)

3. **Archivos Creados**
   - `backend/src/models/Banner.ts` - Modelo de datos
   - `backend/src/controllers/BannerController.ts` - Lógica de negocio
   - `backend/src/routes/banners.ts` - Rutas de API
   - `backend/src/migrations/20251111_create_banners_table.ts` - Migración

### Dashboard

1. **Nueva Sección en el Menú**
   - "Banner Principal" agregado al menú lateral
   - Ruta: `/banners`

2. **Página de Gestión de Banners** (`BannersPage.tsx`)
   - ✅ Lista de banners en formato de tarjetas
   - ✅ Botón "Agregar Banner"
   - ✅ Formulario para crear/editar con campos:
     - Título (requerido)
     - Descripción (opcional)
     - Link/URL (opcional)
     - Estado activo/inactivo
   - ✅ Subir/cambiar imagen del banner
   - ✅ Vista previa de la imagen
   - ✅ Botones para reordenar (↑ ↓)
   - ✅ Toggle para activar/desactivar
   - ✅ Botón para editar
   - ✅ Botón para eliminar
   - ✅ Indicador visual de estado (chip verde/gris)

3. **Archivos Creados**
   - `dashboard/src/pages/BannersPage.tsx` - Página principal
   - Actualizado `dashboard/src/components/Layout.tsx` - Menú
   - Actualizado `dashboard/src/App.tsx` - Rutas

### Frontend

1. **Componente de Carrusel** (`BannerCarousel.tsx`)
   - ✅ Auto-play cada 5 segundos
   - ✅ Transiciones suaves
   - ✅ Botones de navegación (prev/next) - aparecen al hacer hover
   - ✅ Indicadores de puntos (dots) en la parte inferior
   - ✅ Responsive (se adapta a móvil, tablet y desktop)
   - ✅ Muestra título, descripción y botón con link
   - ✅ Usa colores dinámicos del tema (color primario en dots activos)
   - ✅ Overlay oscuro sobre la imagen para mejor legibilidad del texto
   - ✅ Solo muestra banners activos
   - ✅ No se muestra si no hay banners

2. **Integración**
   - Carrusel agregado en la página principal (`page.tsx`)
   - Ubicado justo debajo del header, antes del hero section

3. **Archivos Creados**
   - `frontend/src/components/BannerCarousel.tsx` - Componente del carrusel
   - Actualizado `frontend/src/app/page.tsx` - Página principal

## 🚀 Cómo Usar

### 1. Crear un Banner

1. Ve al Dashboard → "Banner Principal"
2. Click en "Agregar Banner"
3. Completa el formulario:
   - **Título**: Texto principal del banner
   - **Descripción**: Texto secundario (opcional)
   - **Link**: URL a donde redirige el botón (opcional)
   - **Activo**: Toggle para activar/desactivar
4. Click en "Crear"
5. Sube una imagen usando el botón "Subir Imagen"
   - Formatos: JPG, PNG, GIF, WEBP
   - Tamaño máximo: 5MB
   - Recomendado: 1920x500px o similar (16:9)

### 2. Gestionar Banners

- **Editar**: Click en el ícono de lápiz
- **Eliminar**: Click en el ícono de papelera
- **Activar/Desactivar**: Toggle switch
- **Reordenar**: Usa las flechas ↑ ↓
- **Cambiar imagen**: Click en "Cambiar Imagen"

### 3. Ver en el Frontend

1. Ve a `http://localhost:3001`
2. El carrusel aparecerá automáticamente debajo del header
3. Solo se muestran banners activos
4. Se ordenan según el orden configurado

## 📋 Características

### Carrusel
- ✅ Auto-play con pausa al hacer hover
- ✅ Navegación con flechas
- ✅ Indicadores de posición (dots)
- ✅ Responsive
- ✅ Transiciones suaves
- ✅ Overlay para mejor legibilidad
- ✅ Botón de acción con link configurable

### Dashboard
- ✅ Interfaz intuitiva tipo tarjetas
- ✅ Vista previa de imágenes
- ✅ Drag & drop para reordenar (con botones)
- ✅ Activar/desactivar sin eliminar
- ✅ Validación de formularios
- ✅ Feedback visual (snackbars)
- ✅ Confirmación antes de eliminar

### Seguridad
- ✅ Solo administradores pueden gestionar banners
- ✅ Validación de tipos de archivo
- ✅ Límite de tamaño de archivo (5MB)
- ✅ Sanitización de inputs
- ✅ Autenticación requerida

## 🎨 Personalización

### Colores
El carrusel usa los colores dinámicos configurados en "Configuración Empresa":
- Color primario: Dots activos y botón de acción
- Los colores se aplican automáticamente

### Dimensiones Recomendadas
- **Desktop**: 1920x500px (ratio 16:9 o 21:9)
- **Mobile**: La imagen se adapta automáticamente
- **Formato**: JPG o WebP para mejor rendimiento

### Timing
Para cambiar la velocidad del auto-play, edita:
```typescript
// frontend/src/components/BannerCarousel.tsx
const interval = setInterval(() => {
  setCurrentIndex((prev) => (prev + 1) % banners.length)
}, 5000) // Cambiar este valor (en milisegundos)
```

## 🐛 Troubleshooting

### El carrusel no aparece
1. Verifica que haya al menos un banner activo
2. Revisa la consola del navegador para errores
3. Verifica que el backend esté corriendo

### Las imágenes no se cargan
1. Verifica que la imagen se haya subido correctamente
2. Revisa la URL de la imagen en el dashboard
3. Verifica que la carpeta `backend/uploads/banners` exista
4. Revisa los permisos de la carpeta

### No puedo crear banners
1. Verifica que estés logueado como administrador
2. Revisa los logs del backend para errores
3. Verifica la conexión a la base de datos

## 📝 Próximas Mejoras (Opcionales)

- [ ] Agregar efectos de transición personalizados
- [ ] Soporte para videos en lugar de imágenes
- [ ] Programación de banners (fecha inicio/fin)
- [ ] Estadísticas de clicks en banners
- [ ] Múltiples botones de acción por banner
- [ ] Posiciones personalizadas del texto (izquierda, centro, derecha)
- [ ] Animaciones de entrada del texto
