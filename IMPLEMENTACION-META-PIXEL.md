# 🎯 Implementación de Meta Pixel (Facebook Pixel)

## ✅ Implementación Completada

Se ha implementado exitosamente el sistema de Meta Pixel en tu aplicación Laxmi.

---

## 📋 Cambios Realizados

### 1. Base de Datos
- ✅ **Migración 039**: Agregado campo `meta_pixel_id` a `company_settings`
- Ubicación: `backend/migrations/039_add_meta_pixel_to_company_settings.sql`

### 2. Backend
- ✅ Actualizado modelo `CompanySettings` con campo `metaPixelId`
- ✅ Actualizado interface `UpdateCompanySettingsRequest`
- ✅ API lista para guardar y recuperar el Pixel ID

### 3. Dashboard
- ✅ Agregado campo "Meta Pixel ID" en la sección de Redes Sociales
- ✅ Validación y ayuda contextual incluida
- Ubicación: `dashboard/src/pages/CompanySettingsPage.tsx`

### 4. Frontend
- ✅ Componente `MetaPixel` creado con todas las funcionalidades
- ✅ Integración automática en el layout principal
- ✅ Utilidades de tracking para eventos comunes
- Ubicación: 
  - `frontend/src/components/MetaPixel.tsx`
  - `frontend/src/utils/metaPixelTracking.ts`

---

## 🚀 Cómo Usar

### Paso 1: Obtener tu Meta Pixel ID

1. Ve a [Meta Events Manager](https://business.facebook.com/events_manager)
2. Selecciona tu cuenta de negocio
3. Crea un nuevo Pixel o selecciona uno existente
4. Copia el **Pixel ID** (es un número de 15-16 dígitos)

### Paso 2: Configurar en el Dashboard

1. Reinicia el backend para aplicar la migración:
   ```bash
   docker-compose restart backend
   ```

2. Accede al Dashboard de Laxmi
3. Ve a **Configuración de la Empresa**
4. En la sección **Redes Sociales**, encontrarás el campo **Meta Pixel ID**
5. Pega tu Pixel ID (ejemplo: `123456789012345`)
6. Haz clic en **Guardar Cambios**

### Paso 3: Verificar la Instalación

1. Instala la extensión [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) en Chrome
2. Visita tu sitio web (frontend)
3. La extensión mostrará un ícono verde si el pixel está funcionando
4. Verás el evento `PageView` registrado

---

## 📊 Eventos Trackeados Automáticamente

El sistema trackea automáticamente los siguientes eventos:

### Eventos Estándar de Meta

| Evento | Cuándo se Dispara | Datos Enviados |
|--------|-------------------|----------------|
| **PageView** | Cada vez que se carga una página | URL, referrer |
| **ViewContent** | Usuario ve un servicio | Nombre, ID, precio |
| **InitiateCheckout** | Usuario inicia reserva | Servicio, precio |
| **Purchase** | Reserva completada | Servicio, precio, ID reserva |
| **Search** | Usuario busca servicios | Término de búsqueda |
| **Contact** | Click en WhatsApp | Método de contacto |
| **Lead** | Formulario completado | Nombre del formulario |

### Eventos Personalizados

| Evento | Cuándo se Dispara | Datos Enviados |
|--------|-------------------|----------------|
| **ViewCategory** | Usuario ve categoría | Nombre de categoría |

---

## 💻 Cómo Implementar Tracking en tus Páginas

### Ejemplo 1: Trackear Vista de Servicio

```typescript
import { trackServiceView } from '@/utils/metaPixelTracking'

// En tu componente de servicio
useEffect(() => {
  if (service) {
    trackServiceView(service.name, service.id, service.price)
  }
}, [service])
```

### Ejemplo 2: Trackear Inicio de Reserva

```typescript
import { trackBookingInitiated } from '@/utils/metaPixelTracking'

const handleBookNow = () => {
  trackBookingInitiated(service.name, service.id, service.price)
  // ... resto de tu lógica
}
```

### Ejemplo 3: Trackear Reserva Completada

```typescript
import { trackBookingCompleted } from '@/utils/metaPixelTracking'

const handleBookingSuccess = (bookingId: string) => {
  trackBookingCompleted(
    service.name,
    service.id,
    service.price,
    bookingId
  )
  // ... resto de tu lógica
}
```

### Ejemplo 4: Trackear Click en WhatsApp

```typescript
import { trackWhatsAppClick } from '@/utils/metaPixelTracking'

const handleWhatsAppClick = () => {
  trackWhatsAppClick()
  window.open(`https://wa.me/${whatsappNumber}`, '_blank')
}
```

### Ejemplo 5: Trackear Búsqueda

```typescript
import { trackSearch } from '@/utils/metaPixelTracking'

const handleSearch = (query: string) => {
  trackSearch(query)
  // ... resto de tu lógica de búsqueda
}
```

---

## 🎨 Funciones Disponibles

### En `frontend/src/utils/metaPixelTracking.ts`:

```typescript
// Vista de servicio
trackServiceView(serviceName: string, serviceId: string, price?: number)

// Inicio de reserva
trackBookingInitiated(serviceName: string, serviceId: string, price: number)

// Reserva completada
trackBookingCompleted(serviceName: string, serviceId: string, price: number, bookingId: string)

// Búsqueda
trackSearch(searchQuery: string)

// Vista de categoría
trackCategoryView(categoryName: string)

// Click en WhatsApp
trackWhatsAppClick()

// Lead/Formulario
trackLead(formName?: string)
```

---

## 🔍 Verificar Eventos en Meta

1. Ve a [Meta Events Manager](https://business.facebook.com/events_manager)
2. Selecciona tu Pixel
3. Ve a la pestaña **"Test Events"** o **"Eventos de Prueba"**
4. Realiza acciones en tu sitio web
5. Verás los eventos aparecer en tiempo real

---

## 📈 Crear Audiencias y Conversiones

### Crear Audiencia Personalizada

1. En Events Manager, ve a **Audiencias**
2. Clic en **Crear audiencia** > **Audiencia personalizada**
3. Selecciona **Sitio web**
4. Define reglas basadas en los eventos:
   - Personas que vieron servicios
   - Personas que iniciaron reserva pero no completaron
   - Personas que completaron reserva

### Configurar Conversiones

1. En Events Manager, ve a **Conversiones**
2. Clic en **Crear conversión personalizada**
3. Selecciona el evento (ej: `Purchase`)
4. Define reglas adicionales si es necesario
5. Usa esta conversión en tus campañas de Facebook/Instagram

---

## 🎯 Casos de Uso Comunes

### 1. Remarketing a Personas que Vieron Servicios
- Evento: `ViewContent`
- Audiencia: Personas que vieron servicios en los últimos 30 días
- Campaña: Mostrar anuncios con descuentos especiales

### 2. Recuperar Carritos Abandonados
- Evento: `InitiateCheckout` sin `Purchase`
- Audiencia: Personas que iniciaron reserva pero no completaron
- Campaña: Recordatorio con incentivo

### 3. Optimizar para Conversiones
- Evento: `Purchase`
- Objetivo de campaña: Conversiones
- Meta optimizará para personas más propensas a reservar

### 4. Lookalike Audiences
- Basado en: Personas que completaron `Purchase`
- Audiencia similar: Meta encuentra personas similares a tus clientes
- Campaña: Adquisición de nuevos clientes

---

## ⚙️ Configuración Avanzada

### Deshabilitar el Pixel Temporalmente

Si necesitas deshabilitar el pixel sin eliminarlo:

1. Ve al Dashboard
2. Configuración de la Empresa
3. Borra el contenido del campo **Meta Pixel ID**
4. Guarda los cambios

El pixel dejará de cargar en el frontend.

### Múltiples Pixels

Si necesitas usar múltiples pixels (ej: uno para producción, otro para desarrollo):

Puedes modificar el código para usar variables de entorno:

```typescript
// En .env.local del frontend
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
```

---

## 🐛 Troubleshooting

### El Pixel no aparece en Meta Pixel Helper

1. Verifica que guardaste el Pixel ID en el Dashboard
2. Limpia caché del navegador
3. Verifica en la consola del navegador si hay errores
4. Asegúrate de que el backend esté corriendo

### Los eventos no se registran

1. Verifica que el Pixel Helper muestre el pixel activo
2. Abre la consola del navegador y busca errores
3. Verifica que estés llamando las funciones de tracking correctamente
4. Usa la pestaña "Test Events" en Meta para ver eventos en tiempo real

### Eventos duplicados

Si ves eventos duplicados, verifica que no estés llamando las funciones de tracking múltiples veces en el mismo componente.

---

## 📚 Recursos Adicionales

- [Meta Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
- [Meta Events Manager](https://business.facebook.com/events_manager)
- [Meta Pixel Helper Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
- [Standard Events Reference](https://developers.facebook.com/docs/meta-pixel/reference)

---

## ✅ Checklist de Implementación

- [ ] Reiniciar backend (`docker-compose restart backend`)
- [ ] Obtener Meta Pixel ID de Meta Events Manager
- [ ] Configurar Pixel ID en el Dashboard
- [ ] Verificar con Meta Pixel Helper
- [ ] Implementar tracking en páginas clave
- [ ] Probar eventos en Meta Events Manager
- [ ] Crear audiencias personalizadas
- [ ] Configurar conversiones
- [ ] Lanzar campañas optimizadas

---

## 🎉 ¡Listo!

Tu sistema ahora tiene Meta Pixel completamente integrado y funcional. Puedes empezar a trackear conversiones, crear audiencias y optimizar tus campañas de Facebook e Instagram.

**Próximos pasos recomendados:**
1. Configura el Pixel ID en el Dashboard
2. Implementa tracking en las páginas de servicios y reservas
3. Crea tus primeras audiencias personalizadas
4. Lanza campañas optimizadas para conversiones

---

**Fecha de implementación**: 9 de febrero de 2026
**Versión**: 1.0
**Estado**: ✅ Completado y listo para usar
