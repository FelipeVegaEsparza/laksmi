// Utilidades para trackear eventos de Meta Pixel en el frontend

export const trackServiceView = (serviceName: string, serviceId: string, price?: number) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'ViewContent', {
      content_name: serviceName,
      content_ids: [serviceId],
      content_type: 'product',
      value: price,
      currency: 'CLP',
    })
  }
}

export const trackBookingInitiated = (serviceName: string, serviceId: string, price: number) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'InitiateCheckout', {
      content_name: serviceName,
      content_ids: [serviceId],
      content_type: 'product',
      value: price,
      currency: 'CLP',
    })
  }
}

export const trackBookingCompleted = (
  serviceName: string,
  serviceId: string,
  price: number,
  bookingId: string
) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Purchase', {
      content_name: serviceName,
      content_ids: [serviceId],
      content_type: 'product',
      value: price,
      currency: 'CLP',
      transaction_id: bookingId,
    })
  }
}

export const trackSearch = (searchQuery: string) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Search', {
      search_string: searchQuery,
    })
  }
}

export const trackCategoryView = (categoryName: string) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('trackCustom', 'ViewCategory', {
      category_name: categoryName,
    })
  }
}

export const trackWhatsAppClick = () => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Contact', {
      contact_method: 'whatsapp',
    })
  }
}

export const trackLead = (formName: string = 'Contact Form') => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Lead', {
      content_name: formName,
    })
  }
}
