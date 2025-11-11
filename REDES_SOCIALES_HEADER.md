# Redes Sociales Agregadas al Header

## Cambios Realizados

### 1. Hook useCompanySettings
✅ **Archivo:** `frontend/src/hooks/useCompanySettings.ts`
- Exporta las URLs de redes sociales:
  - `facebookUrl`
  - `instagramUrl`
  - `tiktokUrl`
  - `xUrl`

### 2. Header del Frontend
✅ **Archivo:** `frontend/src/components/Header.tsx`

#### Barra Superior Mejorada:

**Lado Izquierdo - Información de Contacto:**
- 📞 Teléfono (clickeable para llamar)
- ✉️ Email (clickeable para enviar correo)
- 📍 Dirección (visible solo en desktop)
- Todos los elementos son enlaces funcionales
- Responsive: oculta texto en móviles, solo muestra iconos

**Lado Derecho - Redes Sociales:**
- 📘 Facebook (icono SVG oficial)
- 📷 Instagram (icono SVG oficial)
- 🎵 TikTok (icono SVG oficial)
- 🐦 X/Twitter (icono SVG oficial)
- Todos abren en nueva pestaña
- Efecto hover con opacidad
- Solo se muestran si están configuradas

## Características

### Iconos SVG Oficiales
- Usamos los iconos oficiales de cada red social
- Tamaño: 16x16px (h-4 w-4)
- Color: Heredan el color primario de la empresa
- Transición suave en hover

### Interactividad
- **Teléfono**: `tel:` link para llamar directamente
- **Email**: `mailto:` link para abrir cliente de correo
- **Redes Sociales**: `target="_blank"` para abrir en nueva pestaña
- **Accesibilidad**: `aria-label` en cada red social

### Responsive
- **Desktop**: Muestra todo (contacto + redes)
- **Tablet**: Oculta texto de contacto, muestra iconos
- **Móvil**: Prioriza redes sociales, contacto compacto

## Cómo Usar

### 1. Configurar en el Dashboard
```
http://localhost:5173
```

Ve a **Configuración → Empresa → Redes Sociales**

Completa las URLs:
- Facebook: `https://facebook.com/tu-empresa`
- Instagram: `https://instagram.com/tu-empresa`
- TikTok: `https://tiktok.com/@tu-empresa`
- X: `https://x.com/tu-empresa`

### 2. Guardar Cambios
Clic en "Guardar Cambios"

### 3. Ver en el Frontend
Abre `http://localhost:3001`

Los iconos aparecerán en la barra superior derecha

## Ejemplo Visual

```
┌────────────────────────────────────────────────────────────────────┐
│ 📞 +34 123 456 789  ✉️ info@empresa.com  📍 Dirección    📘 📷 🎵 🐦 │
└────────────────────────────────────────────────────────────────────┘
```

## Código de Iconos

### Facebook
```jsx
<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12..."/>
</svg>
```

### Instagram
```jsx
<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
  <path d="M12 2.163c3.204 0 3.584.012 4.85.07..."/>
</svg>
```

### TikTok
```jsx
<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67..."/>
</svg>
```

### X (Twitter)
```jsx
<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
  <path d="M18.244 2.25h3.308l-7.227 8.26..."/>
</svg>
```

## Ventajas

✅ **Profesional**: Iconos oficiales de cada red social
✅ **Funcional**: Enlaces directos a tus perfiles
✅ **Responsive**: Se adapta a todos los tamaños de pantalla
✅ **Dinámico**: Solo muestra las redes configuradas
✅ **Accesible**: Labels para lectores de pantalla
✅ **Elegante**: Efectos hover suaves

## Archivos Modificados

- ✅ `frontend/src/hooks/useCompanySettings.ts`
- ✅ `frontend/src/components/Header.tsx`

## Estado Actual

✅ Hook actualizado con redes sociales
✅ Header con iconos SVG oficiales
✅ Enlaces funcionales a redes sociales
✅ Responsive y accesible
✅ Sin errores de compilación

¡Las redes sociales están completamente integradas en el header! 🎉
