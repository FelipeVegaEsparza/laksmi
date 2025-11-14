# Migración de Colores Hardcodeados a Colores Dinámicos

## Estado: EN PROGRESO

Este documento describe la migración de todos los colores hardcodeados (Tailwind) a colores dinámicos del tema.

## Archivos Creados

✅ `src/utils/colors.ts` - Utilidades para colores dinámicos
✅ `src/components/Button.tsx` - Componente Button con colores dinámicos
✅ `src/contexts/ThemeContext.tsx` - Actualizado con variantes de color

## Reglas de Migración

### Clases de Tailwind → Estilos Inline

| Tailwind Class | Reemplazo |
|----------------|-----------|
| `bg-rose-600` | `style={{ backgroundColor: themeColors.primary }}` |
| `bg-rose-700` | `style={{ backgroundColor: themeColors.primaryHover }}` |
| `bg-rose-100` | `style={{ backgroundColor: themeColors.primaryLight }}` |
| `text-rose-600` | `style={{ color: themeColors.primary }}` |
| `border-rose-600` | `style={{ borderColor: themeColors.primary }}` |
| `hover:bg-rose-700` | Usar `onMouseEnter/onMouseLeave` |
| `hover:text-rose-600` | Usar `onMouseEnter/onMouseLeave` |
| `from-rose-500 to-pink-500` | `style={{ background: themeColors.gradientPrimary }}` |
| `from-rose-200 to-pink-300` | `style={{ background: themeColors.gradientLight }}` |

### Componentes a Migrar

#### Alta Prioridad (Visibles en todas las páginas)
- [ ] `src/components/ChatWidget.tsx`
- [ ] `src/components/Footer.tsx`
- [ ] `src/components/Header.tsx` (si existe)
- [ ] `src/components/ServiceImage.tsx`

#### Media Prioridad (Páginas principales)
- [ ] `src/app/page.tsx` (Home)
- [ ] `src/app/servicios/page.tsx`
- [ ] `src/app/servicios/[id]/page.tsx`
- [ ] `src/app/productos/page.tsx`
- [ ] `src/app/productos/[id]/page.tsx`
- [ ] `src/app/reservar/page.tsx`

#### Baja Prioridad (Componentes específicos)
- [ ] `src/components/ImageUpload.tsx`
- [ ] Otros componentes según necesidad

## Ejemplo de Migración

### Antes:
```tsx
<button className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg">
  Click me
</button>
```

### Después (Opción 1 - Componente Button):
```tsx
import Button from '@/components/Button';

<Button variant="primary" size="md">
  Click me
</Button>
```

### Después (Opción 2 - Estilos inline):
```tsx
import { themeColors } from '@/utils/colors';

<button 
  className="text-white px-4 py-2 rounded-lg"
  style={{ backgroundColor: themeColors.primary }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColors.primaryHover}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeColors.primary}
>
  Click me
</button>
```

## Progreso

- [x] Crear utilidades de colores (COMPLETADO)
- [x] Crear componente Button reutilizable (COMPLETADO)
- [x] Crear componente Card reutilizable (COMPLETADO)
- [x] Crear componente Loading reutilizable (COMPLETADO)
- [x] Actualizar ThemeContext con variantes (COMPLETADO)
- [x] Migrar ChatWidget (100% completado)
  - [x] Botón flotante
  - [x] Header del chat
  - [x] Mensajes del usuario
  - [x] Input y botón enviar
- [x] Migrar Footer (100% completado)
  - [x] Iconos de redes sociales
  - [x] Enlaces de navegación
  - [x] Enlaces de contacto
  - [x] Información de contacto
- [x] Migrar Header (100% completado)
  - [x] Navegación principal
  - [x] Búsqueda
  - [x] Redes sociales
  - [x] Menú móvil
- [x] Migrar página Home (100% completado)
  - [x] Servicios destacados
  - [x] Sección CTA
  - [x] Estados de carga
- [x] Migrar páginas de servicios (100% completado)
  - [x] Lista de servicios (/servicios)
  - [x] Página individual (/servicios/[id])
- [x] Migrar páginas de productos (100% completado)
  - [x] Lista de productos (/productos)
  - [ ] Página individual (/productos/[id]) - No existe aún
- [x] Migrar página de reservas (100% completado)
  - [x] Flujo de 3 pasos
  - [x] Formularios con colores dinámicos
  - [x] Estados de progreso
- [x] Migrar página de contacto (100% completado)
  - [x] Información de contacto
  - [x] Formulario de contacto
  - [x] Cards informativas
- [ ] Migrar otros componentes según necesidad

## Notas

- Los colores se cargan desde `/api/v1/company-settings`
- Los colores por defecto son: primary=#e11d48, secondary=#9333ea
- Las variantes (hover, light) se generan automáticamente
- Usar el componente `Button` cuando sea posible para consistencia

