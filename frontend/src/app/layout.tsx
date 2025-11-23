import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProvider from "@/components/ClientProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Clínica de Belleza - Tratamientos y Productos de Belleza",
  description: "Descubre nuestros tratamientos de belleza profesionales y productos de alta calidad. Reserva tu cita online las 24 horas.",
  keywords: "clínica belleza, tratamientos faciales, spa, productos belleza, reserva online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          #initial-loader {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: white;
            transition: opacity 0.5s ease-out;
          }
          #initial-loader.hidden {
            opacity: 0;
            pointer-events: none;
          }
          .loader-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
          }
          .loader-title {
            font-size: 2.25rem;
            font-weight: 700;
            color: #1e40af;
            animation: pulse 2s infinite;
          }
          .loader-spinner {
            position: relative;
            width: 5rem;
            height: 5rem;
          }
          .spinner-circle {
            position: absolute;
            inset: 0;
            border: 4px solid #dbeafe;
            border-radius: 50%;
          }
          .spinner-circle-1 {
            border-top-color: #3b82f6;
            border-right-color: #3b82f6;
            animation: spin 1s linear infinite;
          }
          .spinner-circle-2 {
            inset: 0.5rem;
            border-bottom-color: #1e40af;
            border-left-color: #1e40af;
            animation: spin-reverse 1.5s linear infinite;
          }
          .spinner-dot {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .spinner-dot-inner {
            width: 0.75rem;
            height: 0.75rem;
            background-color: #3b82f6;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }
          .loader-text {
            font-size: 0.875rem;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          .loader-dot {
            animation: bounce 1s infinite;
          }
          .loader-dot:nth-child(2) { animation-delay: 0.2s; }
          .loader-dot:nth-child(3) { animation-delay: 0.4s; }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-0.5rem); }
          }
        `}} />
      </head>
      <body 
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        {/* Loader inline que se muestra INMEDIATAMENTE */}
        <div id="initial-loader">
          <div className="loader-content">
            <div className="loader-title">Estética Laksmi</div>
            <div className="loader-spinner">
              <div className="spinner-circle"></div>
              <div className="spinner-circle spinner-circle-1"></div>
              <div className="spinner-circle spinner-circle-2"></div>
              <div className="spinner-dot">
                <div className="spinner-dot-inner"></div>
              </div>
            </div>
            <div className="loader-text">
              <span>Cargando</span>
              <span className="loader-dot">.</span>
              <span className="loader-dot">.</span>
              <span className="loader-dot">.</span>
            </div>
          </div>
        </div>

        <ClientProvider>
          {children}
        </ClientProvider>

        {/* Script para ocultar el loader cuando React esté listo */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // Ocultar loader cuando el DOM esté completamente cargado
            function hideLoader() {
              const loader = document.getElementById('initial-loader');
              if (loader) {
                loader.classList.add('hidden');
                setTimeout(() => {
                  loader.remove();
                }, 500);
              }
            }

            // Esperar a que los estilos del tema se carguen
            function checkThemeLoaded() {
              const primaryColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--color-primary')
                .trim();
              
              if (primaryColor && primaryColor !== '') {
                setTimeout(hideLoader, 200);
              } else {
                setTimeout(checkThemeLoaded, 50);
              }
            }

            // Iniciar verificación cuando el DOM esté listo
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', checkThemeLoaded);
            } else {
              checkThemeLoaded();
            }

            // Timeout de seguridad
            setTimeout(hideLoader, 3000);
          })();
        `}} />
      </body>
    </html>
  );
}
