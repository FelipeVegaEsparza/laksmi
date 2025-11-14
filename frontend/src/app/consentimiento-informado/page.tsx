'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import { FileCheck, AlertCircle } from 'lucide-react';
import { themeColors } from '@/utils/colors';

const ConsentimientoPage = () => {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-4">
              <FileCheck className="h-8 w-8" style={{ color: themeColors.primary }} />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Consentimientos Informados
              </h1>
            </div>
            <p className="text-xl text-gray-600">
              Centro de Salud Laksmi
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-700">
                    Antes de someterse a cualquier procedimiento, es preciso entender que nuestros tratamientos de belleza son dirigidos a personas sanas que no poseen ningún impedimento físico o médico.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Al aceptar los consentimientos, el cliente entiende que las compras no podrán ser anuladas, como tampoco serán sujetas a devoluciones de ningún tipo.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Ante cualquier duda sobre los siguientes CONSENTIMIENTOS INFORMADOS favor envíanos un correo a{' '}
                    <a href="mailto:estetica.laksmichillan@gmail.com" className="font-semibold underline">
                      estetica.laksmichillan@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              {/* DEPILACIÓN LÁSER */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
                TRATAMIENTO DEPILACIÓN LÁSER PLANAR LED
              </h2>
              
              <p className="text-gray-700 mb-4">
                Es un equipo de tecnología híbrida que conjuga LED de alta potencia con Láser de tres longitudes de onda (755, 808 Y 1064 nm) para depilación y remoción de vellos de forma eficiente a diferentes profundidades de zonas corporales y faciales y en todos los fototipos de piel.
              </p>

              <p className="text-gray-700 mb-4">
                Utiliza un sistema de emisión en conjunto con tecnología Extreme Cooling que mantiene la puntera refrigerada hasta -15°C, otorgando mayor confort en la aplicación del tratamiento ya que genera un efecto anestésico en la epidermis y estructuras del folículo piloso.
              </p>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Características:</h4>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  <li>Indicado en pieles oscuras y sensibles</li>
                  <li>Alto poder criogénico y luz fría</li>
                  <li>Temperatura de enfriamiento: -15° a 5° C</li>
                  <li>Sistema de enfriamiento: Contacto con zafiro</li>
                </ul>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
                Consideraciones Previas a la Depilación
              </h3>
              
              <ol className="list-decimal pl-5 text-gray-700 space-y-3 mb-6">
                <li><strong>Rasura el vello 24 horas antes</strong> de la sesión de depilación láser.</li>
                <li>
                  <strong>HIGIENE PERSONAL</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li>
                      <strong>Cuerpo:</strong> La piel debe estar completamente limpia y seca, sin restos de desodorantes, cremas, lociones o sérums. Si has usado productos con ácido glicólico, retinoico u otros ácidos exfoliantes, suspende su uso al menos una semana antes.
                    </li>
                    <li>
                      <strong>Rostro:</strong> Preséntate con el rostro limpio, sin maquillaje ni productos. Suspende el uso de ácido glicólico, láctico, mandélico, retinoico (retinol), salicílico, tranexámico y AHA al menos una semana antes. Si usas vitamina C o E, interrumpe su aplicación mínimo tres días antes.
                    </li>
                  </ul>
                </li>
                <li>La piel debe estar en su tono natural, sin bronceado. Si has estado expuesta al sol, solarium o autobronceante, espera al menos <strong>6 semanas</strong>.</li>
              </ol>

              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
                Cuidados Post Tratamiento
              </h3>

              <ol className="list-decimal pl-5 text-gray-700 space-y-3 mb-6">
                <li><strong>EXPOSICIÓN SOLAR:</strong> Evita la exposición directa al sol durante 6 semanas antes y 48 horas después de la sesión.</li>
                <li><strong>IRRITACIÓN:</strong> No rasques la zona. Aplica compresas frías o crema humectante sin perfume y pH neutro.</li>
                <li><strong>ANTITRANSPIRANTES:</strong> Espera al menos 24 horas antes de aplicar productos sobre la zona tratada.</li>
                <li><strong>REACCIONES:</strong> Si después de 48 horas presentas enrojecimiento, picazón, ardor o costras, contáctanos inmediatamente.</li>
              </ol>

              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
                Resultados y Protocolo
              </h3>

              <ul className="list-disc pl-5 text-gray-700 space-y-2 mb-6">
                <li>Los vellos se desprenden aproximadamente a las 2 semanas</li>
                <li>Se reducen en cantidad, crecen más lento y más finos</li>
                <li>3 a 6 sesiones según la zona tratada</li>
                <li>Intervalo facial: 20-30 días</li>
                <li>Intervalo corporal: 30-50 días</li>
                <li>Después de 6 sesiones, el 89% logra depilación permanente</li>
              </ul>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">Contraindicaciones:</h4>
                <ul className="list-disc pl-5 text-red-700 space-y-1 text-sm">
                  <li>Epilepsia</li>
                  <li>Medicamentos fotosensibilizantes</li>
                  <li>Alteraciones de cicatrización o queloide</li>
                  <li>Zona de tratamiento no indemne</li>
                  <li>Tatuajes en la zona</li>
                  <li>Embarazo o lactancia</li>
                  <li>Tumores malignos o antecedente de cáncer</li>
                  <li>Cardiopatías e hipertensión</li>
                  <li>Tratamiento con Roaccutane en los últimos 6 meses</li>
                  <li>Diabetes mellitus, presión alta</li>
                  <li>Venas varicosas en estado crónico</li>
                  <li>Herpes activo</li>
                </ul>
              </div>

              {/* CRIOLIPÓLISIS */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-12">
                TRATAMIENTO CRIOLIPÓLISIS
              </h2>

              <p className="text-gray-700 mb-4">
                La Criolipólisis es un tratamiento no invasivo que no requiere anestesia. Consiste en la aplicación de un cabezal que utiliza presión de vacío negativo para movilizar el panículo adiposo hacia los paneles de enfriamiento, enfriando selectivamente los adipocitos a una temperatura inferior a 0° Celsius.
              </p>

              <p className="text-gray-700 mb-4">
                La disminución del tejido adiposo se realiza de manera paulatina, obteniendo el máximo resultado a los <strong>3 meses post sesión</strong>.
              </p>

              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Resultados Esperados:</h4>
                <p className="text-gray-700">
                  Reducirás la grasa localizada entre un <strong>20% a 40%</strong> en un periodo de 3 meses aproximadamente, manteniendo el peso inicial controlado.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">Contraindicaciones:</h4>
                <ul className="list-disc pl-5 text-red-700 space-y-1 text-sm">
                  <li>Menores de edad</li>
                  <li>Personas con obesidad y grandes acumulaciones de grasa</li>
                  <li>Mujeres embarazadas, lactantes o menstruando</li>
                  <li>Hipertensión, diabetes o problemas cardiovasculares</li>
                  <li>Alteraciones en la coagulación</li>
                  <li>Procesos infecciosos</li>
                </ul>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
                Efectos Secundarios Posibles:
              </h3>

              <ul className="list-disc pl-5 text-gray-700 space-y-2 mb-6">
                <li>Enrojecimiento temporal (minutos a horas)</li>
                <li>Hematomas localizados ocasionales</li>
                <li>Alteraciones en la sensibilidad cutánea (hasta 8 semanas)</li>
                <li>Cansancio o estado febril menor a 24 horas</li>
                <li>Dolor leve durante los primeros 10 minutos</li>
                <li>Molestias posteriores por 7-10 días</li>
              </ul>

              {/* ELECTROESTIMULACIÓN */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-12">
                TRATAMIENTO ELECTRO ESTIMULACIÓN
              </h2>

              <p className="text-gray-700 mb-4">
                Tecnología conocida como corriente Aussie o Australiana, es una corriente eléctrica que estimula directamente el músculo vía electrodos por contacto directo con el paciente. Es un estímulo transcutáneo neuromuscular bien tolerado e indoloro.
              </p>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Zonas de Tratamiento:</h4>
                <p className="text-gray-700">
                  Glúteos, abdomen, piernas, pectorales y brazos.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">Contraindicaciones:</h4>
                <ul className="list-disc pl-5 text-red-700 space-y-1 text-sm">
                  <li>Mujeres embarazadas o lactantes</li>
                  <li>Personas con marcapasos</li>
                  <li>Lesiones cutáneas e inflamación</li>
                  <li>Problemas vasculares serios</li>
                  <li>Cáncer, HIV y/o insuficiencia cardíaca</li>
                </ul>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
                Duración de Resultados
              </h3>

              <p className="text-gray-700 mb-6">
                Se recomienda sesiones de mantenimiento para conservar los resultados. Las mejorías son duraderas en la medida que el paciente mantenga un estilo de vida saludable, comprometiéndose en la mantención de su peso inicial, consumiendo una dieta balanceada y siguiendo una rutina de ejercicios.
              </p>

              {/* OTROS TRATAMIENTOS */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-12">
                OTROS TRATAMIENTOS
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-gray-900">PROSCULPT</h4>
                  <p className="text-sm text-gray-600 mt-2">Consulta detalles específicos</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-gray-900">PRESOTERAPIA</h4>
                  <p className="text-sm text-gray-600 mt-2">Consulta detalles específicos</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-gray-900">ONDAS DE CHOQUE</h4>
                  <p className="text-sm text-gray-600 mt-2">Consulta detalles específicos</p>
                </div>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg mt-8">
                <p className="text-sm text-gray-600 text-center mb-2">
                  Para más información sobre estos tratamientos, contáctanos:
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

export default ConsentimientoPage;
