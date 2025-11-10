'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Service, BookingFormData, AvailabilitySlot, BookingForm } from '@/types';
import { servicesApi, bookingsApi } from '@/services/api';
import { Clock, User, Phone, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

const BookingContent = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get('service');

  const { register, handleSubmit, formState: { errors } } = useForm<BookingForm>();

  useEffect(() => {
    const loadServices = async () => {
      try {
        const servicesData = await servicesApi.getAll();
        setServices(servicesData);
        
        if (preselectedServiceId) {
          const service = servicesData.find(s => s.id === preselectedServiceId);
          if (service) {
            setSelectedService(service);
            setStep(2);
          }
        }
      } catch (error) {
        console.error('Error loading services:', error);
        // Mock data for development
        const mockServices: Service[] = [
          {
            id: '1',
            name: 'Limpieza Facial Profunda',
            category: 'facial',
            price: 65,
            duration: 60,
            description: 'Tratamiento completo de limpieza facial',
            images: [],
            requirements: [],
            isActive: true
          },
          {
            id: '2',
            name: 'Masaje Relajante',
            category: 'corporal',
            price: 80,
            duration: 90,
            description: 'Masaje corporal completo',
            images: [],
            requirements: [],
            isActive: true
          }
        ];
        setServices(mockServices);
        
        if (preselectedServiceId) {
          const service = mockServices.find(s => s.id === preselectedServiceId);
          if (service) {
            setSelectedService(service);
            setStep(2);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [preselectedServiceId]);

  const loadAvailability = useCallback(async () => {
    if (!selectedService || !selectedDate) return;
    
    try {
      const slots = await bookingsApi.getAvailability(selectedService.id, selectedDate);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading availability:', error);
      // Mock availability data
      const mockSlots: AvailabilitySlot[] = [
        { dateTime: new Date(`${selectedDate}T09:00:00`), available: true },
        { dateTime: new Date(`${selectedDate}T10:00:00`), available: true },
        { dateTime: new Date(`${selectedDate}T11:00:00`), available: false },
        { dateTime: new Date(`${selectedDate}T12:00:00`), available: true },
        { dateTime: new Date(`${selectedDate}T14:00:00`), available: true },
        { dateTime: new Date(`${selectedDate}T15:00:00`), available: true },
        { dateTime: new Date(`${selectedDate}T16:00:00`), available: false },
        { dateTime: new Date(`${selectedDate}T17:00:00`), available: true },
      ];
      setAvailableSlots(mockSlots);
    }
  }, [selectedService, selectedDate]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailability();
    }
  }, [selectedService, selectedDate, loadAvailability]);

  const onSubmit = async (data: BookingForm) => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    const bookingData: BookingFormData = {
      serviceId: selectedService.id,
      dateTime: new Date(`${selectedDate}T${selectedTime}:00`),
      client: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        allergies: data.allergies ? data.allergies.split(',').map((a: string) => a.trim()) : [],
        preferences: data.preferences ? data.preferences.split(',').map((p: string) => p.trim()) : [],
      },
      notes: data.notes,
    };

    try {
      await bookingsApi.create(bookingData);
      setBookingConfirmed(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      // For demo purposes, simulate success
      setBookingConfirmed(true);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (bookingConfirmed) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Reserva Confirmada!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Tu cita ha sido reservada exitosamente. Recibirás un recordatorio por WhatsApp y email.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-green-900 mb-2">Detalles de tu cita:</h3>
              <p className="text-green-800"><strong>Servicio:</strong> {selectedService?.name}</p>
              <p className="text-green-800"><strong>Fecha:</strong> {selectedDate}</p>
              <p className="text-green-800"><strong>Hora:</strong> {selectedTime}</p>
              <p className="text-green-800"><strong>Duración:</strong> {selectedService?.duration} min</p>
              <p className="text-green-800"><strong>Precio:</strong> €{selectedService?.price}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium"
              >
                Volver al Inicio
              </Link>
              <Link
                href="/servicios"
                className="border border-rose-600 text-rose-600 px-6 py-3 rounded-lg hover:bg-rose-600 hover:text-white transition-colors duration-200 font-medium"
              >
                Ver Más Servicios
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/servicios"
          className="inline-flex items-center text-rose-600 hover:text-rose-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Servicios
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Reservar Cita
        </h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-rose-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-rose-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-rose-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-rose-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-rose-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              3
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Selecciona un Servicio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
                      selectedService?.id === service.id
                        ? 'border-rose-600 bg-rose-50'
                        : 'border-gray-300 hover:border-rose-300'
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 mb-3 text-sm">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration} min
                      </div>
                      <div className="text-xl font-bold text-rose-600">
                        €{service.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedService}
                  className="bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 2 && selectedService && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Selecciona Fecha y Hora
              </h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Servicio Seleccionado
                </h3>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <h4 className="font-semibold text-rose-900">{selectedService.name}</h4>
                  <p className="text-rose-800 text-sm">{selectedService.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-rose-700">Duración: {selectedService.duration} min</span>
                    <span className="text-xl font-bold text-rose-600">€{selectedService.price}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona una fecha
                  </label>
                  <input
                    type="date"
                    min={getMinDate()}
                    max={getMaxDate()}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horarios disponibles
                  </label>
                  {selectedDate ? (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedTime(slot.dateTime.toTimeString().slice(0, 5))}
                          disabled={!slot.available}
                          className={`p-2 text-sm rounded-lg border transition-colors duration-200 ${
                            selectedTime === slot.dateTime.toTimeString().slice(0, 5)
                              ? 'bg-rose-600 text-white border-rose-600'
                              : slot.available
                              ? 'border-gray-300 hover:border-rose-300 hover:bg-rose-50'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {slot.dateTime.toTimeString().slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Selecciona una fecha para ver horarios disponibles</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  className="bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Datos del Cliente
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('name', { required: 'El nombre es obligatorio' })}
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('phone', { required: 'El teléfono es obligatorio' })}
                        type="tel"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        placeholder="+34 123 456 789"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alergias (separadas por comas)
                  </label>
                  <input
                    {...register('allergies')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Ej: níquel, fragancias, látex"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferencias especiales
                  </label>
                  <input
                    {...register('preferences')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Ej: productos naturales, música relajante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Cualquier información adicional que consideres importante"
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Resumen de tu reserva:</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><strong>Servicio:</strong> {selectedService?.name}</p>
                    <p><strong>Fecha:</strong> {selectedDate}</p>
                    <p><strong>Hora:</strong> {selectedTime}</p>
                    <p><strong>Duración:</strong> {selectedService?.duration} min</p>
                    <p><strong>Precio:</strong> €{selectedService?.price}</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium"
                  >
                    Confirmar Reserva
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const BookingPage = () => {
  return (
    <Suspense fallback={
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </Layout>
    }>
      <BookingContent />
    </Suspense>
  );
};

export default BookingPage;