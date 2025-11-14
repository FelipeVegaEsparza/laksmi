# Normalización de Estilos - Frontend Laxmi

## Estado: EN PROGRESO ✅

Este documento describe el proceso de normalización y migración de estilos del frontend para usar colores dinámicos y componentes reutilizables.

## Componentes Creados/Actualizados

### ✅ Componentes Base Completados
- **Button.tsx** - Componente de botón reutilizable con soporte para enlaces
- **Card.tsx** - Componente de tarjeta reutilizable con múltiples variantes
- **Loading.tsx** - Componente de carga con múltiples tipos (spinner, dots, pulse, skeleton)

### ✅ Utilidades de Colores Mejoradas
- **colors.ts** - Sistema completo de colores dinámicos
- **globals.css** - Clases CSS utilitarias y animaciones

### ✅ Componentes Migrados
- **ChatWidget.tsx** - 100% migrado a colores dinámicos
- **Footer.tsx** - 100% migrado a colores dinámicos
- **Header.tsx** - 100% migrado a colores dinámicos
- **page.tsx (Home)** - 100% migrado con nuevos componentes

## Sistema de Colores Dinámicos

### Variables CSS Disponibles
```css
--color-primary: Color primario principal
--color-primary-hover: Variante hover del primario
--color-primary-light: Variante clara del primario
--color-secondary: Color secundario principal
--color-secondary-hover: Variante hover del secundario
--color-secondary-light: Variante clara del secundario
--color-background: Color de fondo
--color-text: Color de texto
```

### Utilidades JavaScript
```typescript
// Colores básicos
themeColors.primary
themeColors.primaryHover
themeColors.gradientPrimary

// Estilos predefinidos
dynamicStyles.bgPrimary
dynamicStyles.btnPrimary
dynamicStyles.textPrimary

// Efectos hover
hoverEffects.primaryButton
hoverEffects.textLink

// Utilidades CSS
cssUtils.primaryMix10
cssUtils.primaryMix20
```

## Componentes Reutilizables

### Button
```tsx
<Button variant="primary" size="md" href="/link">
  Texto del botón
</Button>
```

**Variantes**: primary, secondary, outline, ghost
**Tamaños**: sm, md, lg
**Props**: fullWidth, href (para enlaces)

### Card
```tsx
<Card hover padding="md" shadow="lg" gradient>
  Contenido de la tarjeta
</Card>
```

**Props**: hover, padding, shadow, rounded, gradient, onClick

### Loading
```tsx
<Loading type="spinner" size="md" text="Cargando..." />
<Loading type="skeleton" className="h-48" />
<Loading type="dots" />
```

**Tipos**: spinner, dots, pulse, skeleton

## Clases CSS Utilitarias

### Colores Dinámicos
- `.bg-primary` - Fondo primario
- `.text-primary` - Texto primario
- `.border-primary` - Borde primario
- `.bg-gradient-primary` - Gradiente primario

### Animaciones
- `.hover-lift` - Efecto de elevación al hover
- `.animate-fadeIn` - Animación de aparición
- `.animate-slideIn` - Animación de deslizamiento
- `.loading-shimmer` - Efecto shimmer para loading

### Estados de Foco
- `.focus-primary` - Estilo de foco con color primario

## Migración Completada

### ✅ Páginas Principales
- **Home (/)** - Migrada completamente
  - Servicios destacados con Card component
  - Loading states con Loading component
  - Botones con Button component
  - Colores dinámicos en toda la página

### ✅ Componentes Globales
- **Header** - Navegación, búsqueda, redes sociales
- **Footer** - Enlaces, contacto, redes sociales
- **ChatWidget** - Chat flotante completo

## Próximos Pasos

### ✅ Completado Recientemente
- **Servicios Individuales (/servicios/[id])** - 100% migrado
- **Productos (/productos)** - 100% migrado

### ✅ Completado Recientemente
- **Contacto (/contacto)** - 100% migrado con formularios dinámicos
- **Reservar Cita (/reservar)** - 100% migrado con flujo de 3 pasos

### 🔄 Pendiente
- Crear página individual de producto (/productos/[id])
- Optimizar componentes adicionales según necesidad

### 📋 Pendiente
- Crear componente de formulario reutilizable
- Crear componente de modal reutilizable
- Migrar componentes específicos (ImageUpload, ServiceImage)
- Optimizar rendimiento de colores dinámicos

## Beneficios Logrados

### 🎨 Consistencia Visual
- Colores unificados en toda la aplicación
- Componentes reutilizables con diseño consistente
- Animaciones y transiciones estandarizadas

### 🔧 Mantenibilidad
- Cambios de color centralizados
- Componentes modulares y reutilizables
- Código más limpio y organizado

### 🚀 Rendimiento
- Menos CSS duplicado
- Componentes optimizados
- Loading states mejorados

### 📱 Experiencia de Usuario
- Transiciones suaves
- Estados de carga claros
- Interacciones consistentes

## Guía de Uso para Desarrolladores

### Para Nuevos Componentes
1. Usar `themeColors` para colores dinámicos
2. Implementar hover effects con `hoverEffects`
3. Usar componentes base (Button, Card, Loading)
4. Aplicar clases utilitarias cuando sea apropiado

### Para Migrar Componentes Existentes
1. Reemplazar colores hardcodeados con `themeColors`
2. Usar componentes reutilizables cuando sea posible
3. Implementar hover states dinámicos
4. Añadir animaciones con clases utilitarias

### Ejemplo de Migración
```tsx
// Antes
<button className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded">
  Click me
</button>

// Después
<Button variant="primary" size="md">
  Click me
</Button>
```

## Configuración del Tema

Los colores se cargan automáticamente desde:
- **Backend**: `/api/v1/company-settings`
- **Dashboard**: Configuración de empresa
- **Fallback**: Colores por defecto en `globals.css`

Para actualizar colores:
1. Cambiar en el dashboard de administración
2. Los cambios se aplican automáticamente
3. Usar `refreshTheme()` para forzar actualización

---

**Última actualización**: 2025-11-13
**Estado**: Migración principal completada, continuando con páginas específicas
**Próximo objetivo**: Completar migración de todas las páginas principales