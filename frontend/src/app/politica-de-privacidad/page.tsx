'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { themeColors } from '@/utils/colors';

const PrivacyPolicyPage = () => {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8" style={{ color: themeColors.primary }} />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Política de Privacidad
              </h1>
            </div>
            <p className="text-xl text-gray-600">
              Centro de Salud Laksmi
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Compras y Política de Privacidad
              </h2>

              <p className="text-gray-700 mb-6">
                Toda compra realizada en Centro de Salud Laksmi, ya sea a través del sitio web o de manera presencial en nuestra clínica estética (en adelante, las "Compras"), estará sujeta tanto a la legislación chilena vigente —especialmente la <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong>— como a la presente Política de Privacidad y Seguridad.
              </p>

              <p className="text-gray-700 mb-8">
                Para navegar por el sitio web o realizar cualquier compra, es necesario aceptar esta política y autorizar el uso de datos personales bajo las condiciones aquí descritas.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
                <div className="flex">
                  <Lock className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Compromiso con la Privacidad de los Datos</h4>
                    <p className="text-sm text-blue-800">
                      En Centro de Salud Laksmi nos comprometemos firmemente a proteger la privacidad de todos nuestros clientes y visitantes del sitio web <strong>www.centrodesaludlaksmi.cl</strong>
                    </p>
                    <p className="text-sm text-blue-800 mt-2">
                      En ningún caso compartiremos, transferiremos ni cederemos los datos personales recopilados a empresas no relacionadas, asegurando así un tratamiento confidencial conforme a lo establecido por la ley.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Aceptación de la Política
              </h3>

              <p className="text-gray-700 mb-6">
                El uso del sitio web <strong>www.centrodesaludlaksmi.cl</strong> implica la aceptación plena de las condiciones establecidas en esta Política de Privacidad y Seguridad.
              </p>

              <p className="text-gray-700 mb-8">
                Se informa a usuarios, clientes y visitantes que, si bien contamos con mecanismos robustos de protección, la seguridad en Internet nunca es absoluta, por lo que se recomienda adoptar medidas de precaución, especialmente en lo relativo al resguardo de datos como números de tarjetas de crédito u otra información sensible.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Uso de la Información Personal
              </h3>

              <p className="text-gray-700 mb-4">
                Al registrarse como cliente en Centro de Salud Laksmi, se solicitará información básica como:
              </p>

              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Nombre</li>
                <li>RUT</li>
                <li>Correo electrónico</li>
                <li>Dirección</li>
                <li>Número telefónico</li>
              </ul>

              <p className="text-gray-700 mb-6">
                Estos datos serán utilizados únicamente para fines propios de la compra, como validación de pagos, contacto por temas relacionados y ficha médica.
              </p>

              <p className="text-gray-700 mb-8">
                Adicionalmente, al proporcionarnos sus datos, el usuario autoriza el envío de información promocional, campañas, ofertas y otros contenidos vinculados a Centro de Salud Laksmi.
              </p>

              <div className="bg-green-50 p-4 rounded-lg mb-8">
                <h4 className="font-semibold text-gray-900 mb-2">Derechos del Usuario</h4>
                <p className="text-gray-700 text-sm">
                  De acuerdo con la Ley N° 19.628, los clientes tienen derecho a solicitar el acceso, modificación, cancelación o bloqueo de sus datos personales. Para ejercer este derecho, pueden enviar un correo a{' '}
                  <a href="mailto:estetica.laksmichillan@gmail.com" className="font-semibold" style={{ color: themeColors.primary }}>
                    estetica.laksmichillan@gmail.com
                  </a>
                  {' '}o utilizar el enlace de "unsubscribe" presente al final de cada correo electrónico.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">Correos, Llamadas Sospechosas o Visitas a Domicilio</h4>
                    <p className="text-sm text-red-800">
                      Centro de Salud Laksmi <strong>jamás solicitará claves, contraseñas ni números de tarjeta de crédito</strong> por correo electrónico o vía telefónica.
                    </p>
                    <p className="text-sm text-red-800 mt-2">
                      Si recibes algún mensaje o llamada sospechosa, repórtalo de inmediato a:{' '}
                      <a href="mailto:estetica.laksmichillan@gmail.com" className="font-semibold underline">
                        estetica.laksmichillan@gmail.com
                      </a>
                    </p>
                    <p className="text-sm text-red-800 mt-2">
                      <strong>Centro de Salud Laksmi no opera con vendedores en terreno.</strong>
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Datos de Menores de Edad
              </h3>

              <p className="text-gray-700 mb-8">
                La responsabilidad sobre los datos entregados por menores de edad recae en sus padres, tutores o representantes legales. Centro de Salud Laksmi no asume responsabilidad alguna sobre la información que menores proporcionen a través de nuestros canales.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Casos en los que se Podrían Divulgar Datos Personales
              </h3>

              <p className="text-gray-700 mb-4">
                Salvo lo indicado por la ley, los datos personales proporcionados solo podrán ser revelados en los siguientes casos:
              </p>

              <ol className="list-decimal pl-6 mb-8 text-gray-700">
                <li className="mb-2">Cuando exista una obligación legal o mandato judicial que así lo exija.</li>
                <li className="mb-2">Si el cliente otorga su consentimiento expreso por escrito.</li>
                <li className="mb-2">Si la entrega de datos es esencial para que el cliente reciba el servicio solicitado.</li>
              </ol>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Seguridad en la Navegación
              </h3>

              <p className="text-gray-700 mb-8">
                Nuestro sitio utiliza el certificado de seguridad <strong>Extended SSL Web</strong>, que garantiza transacciones electrónicas seguras y la protección de la información personal de nuestros usuarios frente a terceros no autorizados.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Enlaces a Otros Sitios
              </h3>

              <p className="text-gray-700 mb-8">
                El sitio web www.centrodesaludlaksmi.cl podría contener enlaces a otros subdominios o sitios. Centro de Salud Laksmi no se responsabiliza por las prácticas de privacidad de esos otros sitios.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Uso de Cookies
              </h3>

              <p className="text-gray-700 mb-6">
                Este sitio utiliza cookies, pequeños archivos de texto que se almacenan en tu dispositivo para facilitar la navegación y mejorar la experiencia de usuario.
              </p>

              <p className="text-gray-700 mb-8">
                Estas cookies <strong>no contienen virus ni ejecutables</strong>, y no recopilan datos personales como nombres, apellidos, direcciones o información bancaria.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Uso de Google Analytics
              </h3>

              <p className="text-gray-700 mb-6">
                Centro de Salud Laksmi emplea <strong>Google Analytics</strong>, un servicio de análisis web de Google Inc., que utiliza cookies para generar estadísticas sobre el uso del sitio.
              </p>

              <p className="text-gray-700 mb-4">
                Para conocer más sobre cómo Google maneja esta información, puedes revisar su política de privacidad en:{' '}
                <a 
                  href="http://www.google.com/policies/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-colors duration-300"
                  style={{ color: themeColors.primary }}
                >
                  http://www.google.com/policies/privacy
                </a>
              </p>

              <p className="text-gray-700 mb-8">
                Si deseas deshabilitar el uso de cookies y evitar el tratamiento de tus datos por parte de Google, puedes descargar el complemento disponible en:{' '}
                <a 
                  href="https://tools.google.com/dlpage/gaoptout?hl=es" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-colors duration-300"
                  style={{ color: themeColors.primary }}
                >
                  https://tools.google.com/dlpage/gaoptout?hl=es
                </a>
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Legislación Aplicable y Jurisdicción
              </h3>

              <p className="text-gray-700 mb-8">
                Esta política se encuentra regida por la legislación chilena vigente. Para todos los efectos legales, el usuario fija su domicilio en la ciudad y comuna de Santiago, y se somete a la jurisdicción de sus tribunales de justicia.
              </p>

              <div className="bg-gray-100 p-6 rounded-lg mt-8">
                <p className="text-sm text-gray-600 text-center mb-2">
                  Para consultas sobre esta política de privacidad, contáctanos:
                </p>
                <p className="text-center">
                  <a 
                    href="mailto:estetica.laksmichillan@gmail.com" 
                    className="font-semibold transition-colors duration-300"
                    style={{ color: themeColors.primary }}
                  >
                    estetica.laksmichillan@gmail.com
                  </a>
                </p>
                <p className="text-sm text-gray-600 text-center mt-4">
                  Última actualización: Noviembre 2025
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;
