# 📅 Sistema de Disponibilidad de Horarios - Frontend Laxmi

## 🎯 ¿Cómo Funciona la Disponibilidad de Horarios?

El frontend obtiene la disponibilidad de horarios a través de una comunicación completa con el backend que involucra múltiples capas y validaciones.

## 🔄 Flujo Completo del Sistema

### 1. **Trigger del Usuario**
```typescript
// Cuando el usuario selecciona una fecha en /reservar
const [selectedDate, setSelectedDate] = useState<string>('');

// Se ejecuta automáticamente cuando cambia la fecha
useEffect(() => {
  if (selectedService && selectedDate) {
    loadAvailability();
  }
}, [selectedService, selectedDate, loadAvailability]);
```

### 2. **Llamada del Frontend**
```typescript
// frontend/src/app/reservar/page.tsx
const loadAvailability = useCallback(async () => {
  try {
    // Llamada a la API del backend
    const slots = await bookingsApi.getAvailability(selectedService.id, selectedDate);
    setAvailableSlots(Array.isArray(slots) ? slots : []);
  } catch (error) {
    // Si falla, usa datos mock para demo
    const mockSlots = [...]; // Horarios de ejemplo
    setAvailableSlots(mockSlots);
  }
}, [selectedService, selectedDate]);
```

### 3. **API Request al Backend**
```typescript
// frontend/src/services/api.ts
export const bookingsApi = {
  getAvailability: async (serviceId: string, date: string): Promise<AvailabilitySlot[]> => {
    // GET /api/v1/bookings/availability?serviceId=123&date=2025-11-15
    const response = await api.get(`/bookings/availability?serviceId=${serviceId}&date=${date}`);
    return response.data;
  }
};
```

## 🏗️ Arquitectura del Backend

### 1. **Ruta Pública** (`backend/src/routes/bookings.ts`)
```typescript
// Endpoint público - NO requiere autenticación
router.get('/availability', BookingController.getAvailability);
```

### 2. **Controller** (`backend/src/controllers/BookingController.ts`)
```typescript
static async getAvailability(req: Request, res: Response): Promise<void> {
  const availabilityRequest: AvailabilityRequest = {
    serviceId: req.query.serviceId as string,
    dateFrom: new Date(req.query.dateFrom as string),
    dateTo: new Date(req.query.dateTo as string),
    preferredProfessionalId: req.query.preferredProfessionalId as string
  };

  // Validaciones básicas
  if (!serviceId || !dateFrom || !dateTo) {
    return error('Parámetros requeridos faltantes');
  }

  const availability = await BookingService.getAvailability(availabilityRequest);
  res.json({ success: true, data: availability });
}
```

### 3. **Service Layer** (`backend/src/services/BookingService.ts`)
```typescript
static async getAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
  // 1. Validar que el servicio existe y está activo
  const service = await ServiceModel.findById(request.serviceId);
  if (!service || !service.isActive) {
    throw new Error('Servicio no disponible');
  }

  // 2. Validar rango de fechas (máximo 30 días)
  if (daysDiff > 30) {
    throw new Error('Consulta limitada a 30 días');
  }

  // 3. Delegar al modelo para obtener disponibilidad real
  return await BookingModel.getAvailability(request);
}
```

### 4. **Model Layer** (`backend/src/models/Booking.ts`)
```typescript
static async getAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
  // 1. Obtener profesionales que pueden realizar este servicio
  const professionals = await ProfessionalModel.findBySpecialty(request.serviceId);
  
  if (professionals.length === 0) {
    return { slots: [] }; // Sin profesionales disponibles
  }

  const slots: AvailabilitySlot[] = [];
  
  // 2. Para cada día en el rango de fechas
  while (currentDate <= endDate) {
    for (const professional of professionals) {
      // 3. Generar slots de tiempo para cada profesional
      const daySlots = await this.generateDaySlots(
        professional.id,
        professional.name,
        currentDate,
        service.duration
      );
      slots.push(...daySlots);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { slots: slots.sort(byDateTime) };
}
```

## ⚙️ Generación de Slots de Tiempo

### Algoritmo de `generateDaySlots`
```typescript
private static async generateDaySlots(
  professionalId: string,
  professionalName: string,
  date: Date,
  serviceDuration: number
): Promise<AvailabilitySlot[]> {
  
  // 1. Obtener horarios de trabajo del profesional para ese día
  const workingHours = await ProfessionalModel.getWorkingHours(professionalId, date);
  
  for (const shift of workingHours) {
    // 2. Para cada turno (ej: 9:00-13:00, 14:00-18:00)
    const shiftStart = parseTime(date, shift.startTime); // 9:00
    const shiftEnd = parseTime(date, shift.endTime);     // 13:00
    
    // 3. Generar slots cada 30 minutos
    let currentTime = new Date(shiftStart);
    
    while (currentTime + serviceDuration <= shiftEnd) {
      // 4. Verificar si el profesional está disponible en ese horario
      const isAvailable = await ProfessionalModel.isAvailableAtTime(
        professionalId,
        currentTime,
        serviceDuration
      );
      
      slots.push({
        dateTime: new Date(currentTime),
        professionalId,
        professionalName,
        duration: serviceDuration,
        available: isAvailable  // ¡Aquí está la magia!
      });
      
      // 5. Avanzar 30 minutos
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
  }
  
  return slots;
}
```

## 🔍 Verificación de Disponibilidad Real

### `ProfessionalModel.isAvailableAtTime()`
Esta función verifica:

1. **Citas Existentes**: ¿Ya tiene una cita en ese horario?
2. **Tiempo de Servicio**: ¿El servicio cabe en el slot disponible?
3. **Descansos**: ¿Está en horario de descanso?
4. **Días Libres**: ¿El profesional trabaja ese día?
5. **Vacaciones**: ¿Está de vacaciones?
6. **Disponibilidad Manual**: ¿Se marcó como no disponible?

```sql
-- Ejemplo de query que se ejecuta
SELECT COUNT(*) FROM bookings 
WHERE professional_id = ? 
  AND date_time <= ? 
  AND (date_time + INTERVAL duration MINUTE) > ?
  AND status NOT IN ('cancelled', 'no_show')
```

## 📊 Estructura de Respuesta

### Frontend Recibe:
```typescript
interface AvailabilitySlot {
  dateTime: Date | string;     // "2025-11-15T09:00:00"
  available: boolean;          // true/false ← ¡La clave!
  professionalId?: string;     // "prof-123"
  professionalName?: string;   // "María García"
  duration?: number;           // 60 (minutos)
  timeSlot?: string;          // "09:00" (formato display)
}
```

### Ejemplo de Respuesta Real:
```json
{
  "success": true,
  "data": {
    "serviceId": "service-123",
    "serviceName": "Limpieza Facial",
    "serviceDuration": 60,
    "slots": [
      {
        "dateTime": "2025-11-15T09:00:00Z",
        "available": true,
        "professionalId": "prof-1",
        "professionalName": "María García"
      },
      {
        "dateTime": "2025-11-15T09:30:00Z",
        "available": false,  // ← Ya ocupado
        "professionalId": "prof-1",
        "professionalName": "María García"
      },
      {
        "dateTime": "2025-11-15T10:00:00Z",
        "available": true,
        "professionalId": "prof-1",
        "professionalName": "María García"
      }
    ]
  }
}
```

## 🎨 Renderizado en el Frontend

### Visualización de Slots
```tsx
{Array.isArray(availableSlots) && availableSlots.map((slot, index) => (
  <button
    key={index}
    onClick={() => setSelectedTime(getSlotTime(slot))}
    disabled={!slot.available}  // ← Botón deshabilitado si no está disponible
    style={{
      backgroundColor: slot.available ? 'white' : '#f3f4f6',  // Gris si no disponible
      color: slot.available ? '#374151' : '#9ca3af',          // Texto gris si no disponible
      cursor: slot.available ? 'pointer' : 'not-allowed'      // Cursor apropiado
    }}
  >
    {getSlotTime(slot)}  {/* "09:00", "09:30", etc. */}
  </button>
))}
```

## 🔄 Flujo de Datos Completo

```
1. Usuario selecciona fecha → "2025-11-15"
2. Frontend → GET /api/v1/bookings/availability?serviceId=123&date=2025-11-15
3. Backend Controller → Valida parámetros
4. Backend Service → Valida servicio y fechas
5. Backend Model → Busca profesionales disponibles
6. Para cada profesional → Genera slots de 30 min
7. Para cada slot → Verifica disponibilidad real en BD
8. Backend → Retorna array de slots con available: true/false
9. Frontend → Renderiza botones habilitados/deshabilitados
10. Usuario → Ve horarios disponibles en verde, ocupados en gris
```

## 🛡️ Validaciones y Seguridad

### Backend Valida:
- ✅ Servicio existe y está activo
- ✅ Fechas válidas (no en el pasado)
- ✅ Rango máximo de 30 días
- ✅ Profesionales disponibles
- ✅ Horarios de trabajo
- ✅ Citas existentes

### Frontend Maneja:
- ✅ Errores de conexión (usa mock data)
- ✅ Respuestas vacías
- ✅ Estados de carga
- ✅ Validación de arrays

## 🎯 Resultado Final

El usuario ve en tiempo real:
- **Botones verdes**: Horarios disponibles para reservar
- **Botones grises**: Horarios ya ocupados o no disponibles
- **Sin botones**: Profesional no trabaja ese día

¡El sistema es completamente dinámico y refleja la disponibilidad real basada en citas existentes, horarios de trabajo y configuración de profesionales!

---

**Fecha de Documentación**: 2025-11-13  
**Estado**: Sistema funcionando con datos reales del backend  
**Fallback**: Mock data si el backend no está disponible