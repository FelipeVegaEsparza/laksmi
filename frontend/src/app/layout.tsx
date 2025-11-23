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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          #initial-loader {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: white;
            transition: opacity 0.6s ease-out;
          }
          #initial-loader.hidden {
            opacity: 0;
            pointer-events: none;
          }
          .loader-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
          }
          .loader-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            font-weight: 700;
            color: #1e40af;
            letter-spacing: 0.05em;
            animation: fadeInOut 2.5s ease-in-out infinite;
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
          @keyframes fadeInOut {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.02); }
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
            let checksCount = 0;
            const minDisplayTime = 1500; // Mínimo 1.5 segundos visible
            const startTime = Date.now();
            
            function checkThemeLoaded() {
              checksCount++;
              const primaryColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--color-primary')
                .trim();
              
              const elapsedTime = Date.now() - startTime;
              
              // Si los estilos están listos Y ha pasado el tiempo mínimo
              if (primaryColor && primaryColor !== '' && elapsedTime >= minDisplayTime) {
                setTimeout(hideLoader, 300);
              } else if (checksCount > 100) {
                // Después de 100 intentos (5 segundos), ocultar de todos modos
                setTimeout(hideLoader, 300);
              } else {
                // Reintentar
                setTimeout(checkThemeLoaded, 50);
              }
            }

            // Iniciar verificación cuando el DOM esté listo
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', checkThemeLoaded);
            } else {
              checkThemeLoaded();
            }

            // Timeout de seguridad aumentado
            setTimeout(hideLoader, 5000);
          })();
        `}} />
      </body>
    </html>
  );
}
