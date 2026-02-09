'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface MetaPixelProps {
  pixelId: string
}

declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}

export default function MetaPixel({ pixelId }: MetaPixelProps) {
  useEffect(() => {
    // Inicializar el pixel cuando el script se carga
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('init', pixelId)
      window.fbq('track', 'PageView')
    }
  }, [pixelId])

  if (!pixelId) return null

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

// Funciones helper para trackear eventos
export const trackEvent = (eventName: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, data)
  }
}

export const trackCustomEvent = (eventName: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, data)
  }
}

// Eventos predefinidos comunes
export const MetaPixelEvents = {
  // Evento cuando un usuario ve un servicio
  viewContent: (contentName: string, contentId: string, value?: number) => {
    trackEvent('ViewContent', {
      content_name: contentName,
      content_ids: [contentId],
      content_type: 'product',
      value: value,
      currency: 'CLP',
    })
  },

  // Evento cuando un usuario inicia el proceso de reserva
  initiateCheckout: (contentName: string, contentId: string, value: number) => {
    trackEvent('InitiateCheckout', {
      content_name: contentName,
      content_ids: [contentId],
      content_type: 'product',
      value: value,
      currency: 'CLP',
    })
  },

  // Evento cuando se completa una reserva
  purchase: (contentName: string, contentId: string, value: number, bookingId: string) => {
    trackEvent('Purchase', {
      content_name: contentName,
      content_ids: [contentId],
      content_type: 'product',
      value: value,
      currency: 'CLP',
      transaction_id: bookingId,
    })
  },

  // Evento cuando un usuario busca servicios
  search: (searchString: string) => {
    trackEvent('Search', {
      search_string: searchString,
    })
  },

  // Evento cuando un usuario ve la lista de servicios
  viewCategory: (categoryName: string) => {
    trackCustomEvent('ViewCategory', {
      category_name: categoryName,
    })
  },

  // Evento cuando un usuario hace clic en WhatsApp
  contact: (method: string) => {
    trackEvent('Contact', {
      contact_method: method,
    })
  },

  // Evento cuando un usuario completa el formulario de contacto
  lead: (contentName?: string) => {
    trackEvent('Lead', {
      content_name: contentName || 'Contact Form',
    })
  },
}
