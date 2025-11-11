# Uso de Colores Dinámicos en el Frontend

Los colores del frontend ahora se cargan dinámicamente desde la configuración de la empresa en el backend.

## Variables CSS Disponibles

```css
--color-primary: Color primario (por defecto: #e11d48)
--color-secondary: Color secundario (por defecto: #9333ea)
--color-background: Color de fondo (por defecto: #ffffff)
--color-text: Color de texto (por defecto: #000000)
```

## Cómo Usar en Componentes

### Opción 1: Usar variables CSS directamente en estilos inline

```tsx
<div style={{ backgroundColor: 'var(--color-primary)' }}>
  Contenido
</div>
```

### Opción 2: Usar el hook useTheme

```tsx
'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function MyComponent() {
  const { colors } = useTheme()
  
  return (
    <div style={{ backgroundColor: colors.primary }}>
      <h1 style={{ color: colors.text }}>Título</h1>
    </div>
  )
}
```

### Opción 3: Usar clases CSS personalizadas

En tu archivo CSS:
```css
.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.text-primary {
  color: var(--color-primary);
}
```

## Actualizar Colores

Los colores se actualizan automáticamente cuando:
1. Se carga la página (se obtienen del backend)
2. Se guardan cambios en la configuración de empresa del dashboard

Para forzar una actualización manual:
```tsx
const { refreshTheme } = useTheme()
await refreshTheme()
```

## Migración de Colores Hardcodeados

Reemplazar:
- `bg-rose-600` → `style={{ backgroundColor: 'var(--color-primary)' }}`
- `text-rose-600` → `style={{ color: 'var(--color-primary)' }}`
- `bg-purple-600` → `style={{ backgroundColor: 'var(--color-secondary)' }}`
- `text-purple-600` → `style={{ color: 'var(--color-secondary)' }}`
