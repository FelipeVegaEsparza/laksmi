# 📘 Ejemplos Prácticos de Uso del Meta Pixel

## Ejemplo Completo: Página de Servicio con Tracking

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  trackServiceView,
  trackBookingInitiated,
  trackWhatsAppClick,
} from '@/utils/metaPixelTracking'

interface Service {
  id: string
  name: string
  price: number
  description: string
  // ... otros campos
}

export default function ServicePage() {
  const params = useParams()
  const [service, setService] = useState<Service | null>(null)

  // Cargar servicio
  useEffect(() => {
    const fetchService = async () => {
      const response = await fetch(`/api/services/${params.id}`)
      const data = await response.json()
      setService(data)
    }
    fetchService()
  }, [params.id])

  // 🎯 TRACKING: Vista de servicio
  useEffect(() => {
    if (service) {
      trackServiceView(service.name, service.id, service.price)
    }
  }, [service])

  // 🎯 TRACKING: Inicio de reserva
  const handleBookNow = () => {
    if (service) {
      trackBookingInitiated(service.name, service.id, service.price)
    }
    // Redirigir a página de reserva
    window.location.href = `/booking/${service.id}`
  }

  // 🎯 TRACKING: Click en WhatsApp
  const handleWhatsApp = () => {
    trackWhatsAppClick()
    window.open('https://wa.me/56912345678', '_blank')
  }

  if (!service) return <div>Cargando...</div>

  return (
    <div>
      <h1>{service.name}</h1>
      <p>{service.description}</p>
      <p>Precio: ${service.price.toLocaleString('es-CL')}</p>
      
      <button onClick={handleBookNow}>
        Reservar Ahora
      </button>
      
      <button onClick={handleWhatsApp}>
        Consultar por WhatsApp
      </button>
    </div>
  )
}
```

---

## Ejemplo: Página de Confirmación de Reserva

```typescript
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackBookingCompleted } from '@/utils/metaPixelTracking'

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Obtener datos de la reserva de la URL o estado
    const bookingId = searchParams.get('bookingId')
    const serviceName = searchParams.get('serviceName')
    const serviceId = searchParams.get('serviceId')
    const price = parseFloat(searchParams.get('price') || '0')

    // 🎯 TRACKING: Reserva completada (conversión)
    if (bookingId && serviceName && serviceId && price) {
      trackBookingCompleted(serviceName, serviceId, price, bookingId)
    }
  }, [searchParams])

  return (
    <div>
      <h1>¡Reserva Confirmada! 🎉</h1>
      <p>Tu reserva ha sido confirmada exitosamente.</p>
      {/* ... resto del contenido */}
    </div>
  )
}
```

---

## Ejemplo: Barra de Búsqueda con Tracking

```typescript
'use client'

import { useState } from 'react'
import { trackSearch } from '@/utils/metaPixelTracking'

export default function SearchBar() {
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 🎯 TRACKING: Búsqueda
    if (query.trim()) {
      trackSearch(query)
    }
    
    // Realizar búsqueda
    window.location.href = `/search?q=${encodeURIComponent(query)}`
  }

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar servicios..."
      />
      <button type="submit">Buscar</button>
    </form>
  )
}
```

---

## Ejemplo: Lista de Categorías con Tracking

```typescript
'use client'

import { trackCategoryView } from '@/utils/metaPixelTracking'

interface Category {
  id: string
  name: string
  slug: string
}

export default function CategoryList({ categories }: { categories: Category[] }) {
  const handleCategoryClick = (category: Category) => {
    // 🎯 TRACKING: Vista de categoría
    trackCategoryView(category.name)
    
    // Navegar a la categoría
    window.location.href = `/category/${category.slug}`
  }

  return (
    <div>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category)}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
```

---

## Ejemplo: Formulario de Contacto con Tracking

```typescript
'use client'

import { useState } from 'react'
import { trackLead } from '@/utils/metaPixelTracking'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Enviar formulario
      await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      
      // 🎯 TRACKING: Lead generado
      trackLead('Contact Form')
      
      alert('¡Mensaje enviado!')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Nombre"
        required
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        placeholder="Mensaje"
        required
      />
      <button type="submit">Enviar</button>
    </form>
  )
}
```

---

## Ejemplo: Botón de WhatsApp Flotante

```typescript
'use client'

import { trackWhatsAppClick } from '@/utils/metaPixelTracking'

export default function WhatsAppButton() {
  const handleClick = () => {
    // 🎯 TRACKING: Click en WhatsApp
    trackWhatsAppClick()
    
    // Abrir WhatsApp
    const phone = '56912345678'
    const message = encodeURIComponent('Hola, me gustaría más información sobre sus servicios')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
      }}
    >
      💬 WhatsApp
    </button>
  )
}
```

---

## Ejemplo: Hook Personalizado para Tracking

```typescript
// hooks/useMetaPixelTracking.ts
import { useEffect } from 'react'
import {
  trackServiceView,
  trackBookingInitiated,
  trackBookingCompleted,
} from '@/utils/metaPixelTracking'

interface Service {
  id: string
  name: string
  price: number
}

export function useServiceViewTracking(service: Service | null) {
  useEffect(() => {
    if (service) {
      trackServiceView(service.name, service.id, service.price)
    }
  }, [service])
}

export function useBookingTracking() {
  const trackInitiate = (service: Service) => {
    trackBookingInitiated(service.name, service.id, service.price)
  }

  const trackComplete = (service: Service, bookingId: string) => {
    trackBookingCompleted(service.name, service.id, service.price, bookingId)
  }

  return { trackInitiate, trackComplete }
}
```

### Uso del Hook:

```typescript
'use client'

import { useServiceViewTracking, useBookingTracking } from '@/hooks/useMetaPixelTracking'

export default function ServicePage({ service }: { service: Service }) {
  // 🎯 TRACKING automático de vista
  useServiceViewTracking(service)
  
  const { trackInitiate, trackComplete } = useBookingTracking()

  const handleBookNow = () => {
    trackInitiate(service)
    // ... lógica de reserva
  }

  return (
    <div>
      <h1>{service.name}</h1>
      <button onClick={handleBookNow}>Reservar</button>
    </div>
  )
}
```

---

## 🎯 Mejores Prácticas

### 1. Trackear en el Momento Correcto
```typescript
// ✅ BIEN: Trackear cuando el usuario realmente ve el contenido
useEffect(() => {
  if (service && service.id) {
    trackServiceView(service.name, service.id, service.price)
  }
}, [service])

// ❌ MAL: Trackear antes de que el contenido esté listo
trackServiceView(service.name, service.id, service.price) // service puede ser null
```

### 2. Evitar Tracking Duplicado
```typescript
// ✅ BIEN: Usar useEffect con dependencias
useEffect(() => {
  trackServiceView(service.name, service.id, service.price)
}, [service.id]) // Solo cuando cambia el ID

// ❌ MAL: Trackear en cada render
trackServiceView(service.name, service.id, service.price)
```

### 3. Validar Datos Antes de Trackear
```typescript
// ✅ BIEN: Validar que los datos existan
if (service && service.id && service.price) {
  trackServiceView(service.name, service.id, service.price)
}

// ❌ MAL: Trackear sin validar
trackServiceView(service.name, service.id, service.price)
```

### 4. Usar Valores Consistentes
```typescript
// ✅ BIEN: Usar siempre el mismo formato de ID
trackServiceView(service.name, service.id, service.price)

// ❌ MAL: Usar diferentes formatos
trackServiceView(service.name, `service-${service.id}`, service.price)
```

---

## 📊 Eventos Recomendados por Página

| Página | Eventos a Trackear |
|--------|-------------------|
| **Home** | PageView (automático) |
| **Lista de Servicios** | PageView, ViewCategory |
| **Detalle de Servicio** | ViewContent |
| **Formulario de Reserva** | InitiateCheckout |
| **Confirmación** | Purchase |
| **Búsqueda** | Search |
| **Contacto** | Lead |
| **WhatsApp** | Contact |

---

## 🚀 Implementación Rápida

Si quieres implementar tracking rápidamente en tu proyecto:

1. **Copia las funciones de tracking** de `frontend/src/utils/metaPixelTracking.ts`
2. **Importa donde necesites**:
   ```typescript
   import { trackServiceView, trackBookingInitiated } from '@/utils/metaPixelTracking'
   ```
3. **Llama las funciones** en los momentos clave
4. **Verifica con Meta Pixel Helper** que los eventos se disparen

---

**¡Listo para empezar a trackear! 🎉**
