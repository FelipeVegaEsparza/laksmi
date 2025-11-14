'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { themeColors, dynamicStyles, hoverEffects } from '@/utils/colors';

interface CompanySettings {
  companyName: string;
  contactAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  privacy: boolean;
}

const ContactPage = () => {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
    privacy: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company-settings`);
      const data = await response.json();
      if (data.success) {
        setCompanySettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        setFormData({
          name: '',
          phone: '',
          email: '',
          subject: '',
          message: '',
          privacy: false,
        });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setSubmitError(data.error || 'Error al enviar el mensaje');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Error al enviar el mensaje. Por favor, intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contacto
            </h1>
            <p className="text-xl text-gray-600">
              Estamos aquí para ayudarte. Contáctanos por cualquier medio.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Información de Contacto
              </h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Cargando información...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {companySettings?.contactAddress && (
                    <div className="flex items-start">
                      <MapPin className="h-6 w-6 mr-4 mt-1" style={{ color: themeColors.primary }} />
                      <div>
                        <h3 className="font-semibold text-gray-900">Dirección</h3>
                        <p className="text-gray-600">{companySettings.contactAddress}</p>
                      </div>
                    </div>
                  )}

                  {companySettings?.contactPhone && (
                    <div className="flex items-start">
                      <Phone className="h-6 w-6 mr-4 mt-1" style={{ color: themeColors.primary }} />
                      <div>
                        <h3 className="font-semibold text-gray-900">Teléfono</h3>
                        <p className="text-gray-600">{companySettings.contactPhone}</p>
                      </div>
                    </div>
                  )}

                  {companySettings?.contactEmail && (
                    <div className="flex items-start">
                      <Mail className="h-6 w-6 mr-4 mt-1" style={{ color: themeColors.primary }} />
                      <div>
                        <h3 className="font-semibold text-gray-900">Email</h3>
                        <p className="text-gray-600">{companySettings.contactEmail}</p>
                      </div>
                    </div>
                  )}

                  {companySettings?.contactWhatsapp && (
                    <div className="flex items-start">
                      <MessageCircle className="h-6 w-6 mr-4 mt-1" style={{ color: themeColors.primary }} />
                      <div>
                        <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                        <p className="text-gray-600">{companySettings.contactWhatsapp}</p>
                        <a 
                          href={`https://wa.me/${companySettings.contactWhatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm transition-colors duration-300"
                          style={{ color: themeColors.primary }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = themeColors.primaryHover;
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = themeColors.primary;
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          Enviar mensaje
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <Clock className="h-6 w-6 mr-4 mt-1" style={{ color: themeColors.primary }} />
                    <div>
                      <h3 className="font-semibold text-gray-900">Horarios</h3>
                      <div className="text-gray-600 space-y-1">
                        <p>Lunes - Viernes: 9:00 - 20:00</p>
                        <p>Sábado: 9:00 - 18:00</p>
                        <p>Domingo: Cerrado</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Card 
                className="mt-8"
                style={{ backgroundColor: themeColors.primaryLight }}
              >
                <h3 
                  className="font-semibold mb-2"
                  style={{ color: themeColors.primaryHover }}
                >
                  ¿Necesitas ayuda inmediata?
                </h3>
                <p 
                  className="mb-4"
                  style={{ color: themeColors.primary }}
                >
                  Nuestro asistente virtual está disponible 24/7 para ayudarte con 
                  reservas, consultas y información sobre servicios.
                </p>
                <Button variant="primary" size="sm">
                  Iniciar Chat
                </Button>
              </Card>
            </div>

            {/* Contact Form */}
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Envíanos un Mensaje
              </h2>

              {submitSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                  ✅ Mensaje enviado correctamente. Te contactaremos pronto.
                </div>
              )}

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                  ❌ {submitError}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300"
                      style={{
                        '--tw-ring-color': themeColors.primary,
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = themeColors.primary;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '';
                      }}
                      placeholder="Tu nombre"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300"
                      style={{
                        '--tw-ring-color': themeColors.primary,
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = themeColors.primary;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '';
                      }}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300"
                    style={{
                      '--tw-ring-color': themeColors.primary,
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = themeColors.primary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '';
                    }}
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300"
                    style={{
                      '--tw-ring-color': themeColors.primary,
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = themeColors.primary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '';
                    }}
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="consulta">Consulta general</option>
                    <option value="reserva">Reserva de cita</option>
                    <option value="productos">Información sobre productos</option>
                    <option value="reclamo">Reclamo o sugerencia</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300"
                    style={{
                      '--tw-ring-color': themeColors.primary,
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = themeColors.primary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '';
                    }}
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="privacy"
                    name="privacy"
                    checked={formData.privacy}
                    onChange={handleInputChange}
                    required
                    className="h-4 w-4 border-gray-300 rounded focus:ring-2"
                    style={{
                      color: themeColors.primary,
                      '--tw-ring-color': themeColors.primary,
                    } as React.CSSProperties}
                  />
                  <label htmlFor="privacy" className="ml-2 text-sm text-gray-600">
                    Acepto la{' '}
                    <a 
                      href="/politica-de-privacidad" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors duration-300"
                      style={{ color: themeColors.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = themeColors.primaryHover;
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = themeColors.primary;
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      política de privacidad
                    </a>{' '}
                    y el tratamiento de mis datos personales.
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={submitting}
                >
                  {submitting ? 'Enviando...' : 'Enviar Mensaje'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;