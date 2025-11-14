'use client';

import Layout from '@/components/Layout';
import Card from '@/components/Card';
import { FileText } from 'lucide-react';
import { themeColors } from '@/utils/colors';

const TermsPage = () => {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8" style={{ color: themeColors.primary }} />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Términos y Condiciones
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
                TÉRMINOS Y CONDICIONES DE USO – CENTRO DE SALUD LAKSMI
              </h2>

              <p className="text-gray-700 mb-6">
                Todas las compras efectuadas mediante el sitio web <strong>www.centrodesaludlaksmi.cl</strong> se regirán por los presentes términos y condiciones.
              </p>

              <p className="text-gray-700 mb-6">
                Al comprar en www.centrodesaludlaksmi.cl, el usuario acepta íntegramente los términos aquí descritos. Se entiende que cualquier persona que realice una transacción en esta plataforma ha leído, comprendido y aceptado estas condiciones.
              </p>

              <p className="text-gray-700 mb-8">
                Asimismo, el usuario autoriza expresamente al Centro de Salud Laksmi a utilizar, almacenar y tratar sus datos personales, conforme a lo dispuesto por la Ley N°19.628 sobre la protección de la vida privada.
              </p>

              <p className="text-gray-700 mb-8">
                Además, autoriza a Centro de Salud Laksmi a enviar a su correo electrónico información comercial, promociones, encuestas u otras comunicaciones relacionadas.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                COMUNICACIONES PROMOCIONALES
              </h3>
              <p className="text-gray-700 mb-8">
                El cliente podrá solicitar no recibir más correos promocionales escribiendo a: <a href="mailto:estetica.laksmichillan@gmail.com" className="transition-colors duration-300" style={{ color: themeColors.primary }}>estetica.laksmichillan@gmail.com</a>
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                CÓMO COMPRAR EN EL SITIO
              </h3>
              <p className="text-gray-700 mb-6">
                En www.centrodesaludlaksmi.cl se detallan claramente los pasos para efectuar una compra. Seguir este procedimiento equivale a aceptar los términos establecidos.
              </p>
              <p className="text-gray-700 mb-8">
                El cliente podrá contactar a Centro de Salud Laksmi mediante correo electrónico para solicitar correcciones en datos o en el envío de la compra.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                FORMAS DE PAGO
              </h3>
              <p className="text-gray-700 mb-6">
                Únicamente se podrán utilizar los medios de pago que se detallan en el sitio web. En el caso de tarjetas bancarias, se aplicarán las condiciones pactadas entre el usuario y su banco. Centro de Salud Laksmi no será responsable por dichos contratos.
              </p>
              <p className="text-gray-700 mb-8">
                Las promociones y descuentos no son acumulables. Ofertas disponibles en sucursales físicas pueden no estar disponibles en el sitio web y viceversa.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                CUPONES Y DESCUENTOS
              </h3>
              <p className="text-gray-700 mb-6">
                Centro de Salud Laksmi podrá otorgar cupones de descuento, que serán válidos por una sola vez y por el monto especificado.
              </p>
              <p className="text-gray-700 mb-8">
                Los descuentos obtenidos mediante cupones no son acumulables con otras promociones y pueden estar sujetos a restricciones como límite de uso, valor mínimo de compra o fecha de expiración.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                VALIDACIÓN DE COMPRA
              </h3>
              <p className="text-gray-700 mb-4">
                Toda operación quedará sujeta a validación por parte de Centro de Salud Laksmi, lo que incluye:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Confirmación de disponibilidad del servicio.</li>
                <li>Verificación y aceptación del medio de pago.</li>
                <li>Coincidencia de los datos del cliente con los registrados en el sitio.</li>
              </ul>
              <p className="text-gray-700 mb-8">
                La validación será informada al cliente mediante correo electrónico u otro medio adecuado. Dicha confirmación implicará aceptación por ambas partes.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                CAMBIOS Y ANULACIONES
              </h3>
              <p className="text-gray-700 mb-6">
                El cliente podrá cambiar un servicio por otro disponible del mismo valor. <strong>No se realizan devoluciones de dinero bajo ningún motivo.</strong>
              </p>
              <p className="text-gray-700 mb-6">
                Las anulaciones o reprogramaciones deben realizarse con al menos 24 horas de anticipación a través del sitio web. En caso contrario, se perderá el derecho a recibir el servicio sin opción de reembolso.
              </p>
              <p className="text-gray-700 mb-8">
                Cualquier atraso en la llegada a la cita agendada será descontado del tiempo total de atención.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                GARANTÍA DE LOS RESULTADOS
              </h3>
              <p className="text-gray-700 mb-4">
                Los tratamientos de Centro de Salud Laksmi tienen garantía bajo las siguientes condiciones:
              </p>
              <ul className="list-disc pl-6 mb-8 text-gray-700">
                <li>Resultados evaluables tras completar múltiplos de 6 sesiones.</li>
                <li>Asistencia mínima de 3 veces por semana, sin atrasos.</li>
                <li>Seguir una dieta equilibrada y estilo de vida saludable.</li>
                <li>No presentar condiciones médicas que interfieran con los resultados.</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                MODIFICACIÓN DE SERVICIOS
              </h3>
              <p className="text-gray-700 mb-6">
                Centro de Salud Laksmi podrá actualizar, modificar o suspender servicios y promociones ofrecidas en el sitio web.
              </p>
              <p className="text-gray-700 mb-8">
                Si el cliente tiene servicios activos que fueran retirados, podrá cambiarlos por otros equivalentes en valor. Si el nuevo servicio tiene un valor menor, la diferencia quedará como crédito a favor del cliente. Si tiene un costo mayor, se deberá abonar la diferencia.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                VIGENCIA DE LOS SERVICIOS
              </h3>
              <p className="text-gray-700 mb-6">
                <strong>Depilación Láser:</strong> Los servicios tienen una vigencia de 12 meses desde la fecha de compra. Vencido ese plazo, se considerarán caducados. En caso de cierre obligatorio decretado por la autoridad sanitaria (como cuarentenas), el plazo se extenderá proporcionalmente al tiempo de cierre.
              </p>
              <p className="text-gray-700 mb-8">
                <strong>Tratamientos faciales y corporales:</strong> Aplica la misma política anterior.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                EDAD MÍNIMA PARA COMPRAR
              </h3>
              <p className="text-gray-700 mb-6">
                La edad mínima para comprar es de 18 años. Menores de edad deberán contar con autorización escrita de sus padres o tutores, enviada a: <a href="mailto:estetica.laksmichillan@gmail.com" className="transition-colors duration-300" style={{ color: themeColors.primary }}>estetica.laksmichillan@gmail.com</a>
              </p>
              <p className="text-gray-700 mb-8">
                Los representantes legales serán responsables por cualquier dato entregado por el menor. Centro de Salud Laksmi no será responsable por la información entregada por menores de edad.
              </p>

              <div className="bg-gray-100 p-6 rounded-lg mt-8">
                <p className="text-sm text-gray-600 text-center">
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

export default TermsPage;
