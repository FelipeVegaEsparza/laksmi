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
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          #initial-loader {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%);
            transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          #initial-loader.hidden {
            opacity: 0;
            pointer-events: none;
          }
          
          /* Contenedor principal - Minimalista */
          .loader-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
            animation: fadeIn 0.6s ease-out;
          }
          
          /* Logo simple y elegante */
          .loader-logo-container {
            position: relative;
            width: 120px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .loader-logo-image {
            width: 100px;
            height: 100px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(13, 110, 253, 0.15);
            animation: gentlePulse 2s ease-in-out infinite;
          }
          
          .logo-letter {
            font-family: 'Cormorant Garamond', serif;
            font-size: 56px;
            font-weight: 700;
            color: #0D6EFD;
          }
          
          /* Anillo giratorio simple */
          .logo-ring {
            position: absolute;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 2px solid transparent;
            border-top-color: #0D6EFD;
            border-right-color: #0D6EFD;
            animation: smoothSpin 2s linear infinite;
          }
          
          /* Barra de progreso elegante */
          .loader-progress {
            width: 200px;
            height: 3px;
            background: rgba(13, 110, 253, 0.1);
            border-radius: 10px;
            overflow: hidden;
          }
          
          .progress-bar {
            height: 100%;
            background: #0D6EFD;
            border-radius: 10px;
            animation: progressSlide 1.5s ease-in-out infinite;
          }
          
          /* Texto simple */
          .loader-text {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.875rem;
            font-weight: 500;
            color: #6c757d;
            letter-spacing: 0.02em;
          }
          
          /* Animaciones suaves */
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes gentlePulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 4px 20px rgba(13, 110, 253, 0.15);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 6px 25px rgba(13, 110, 253, 0.25);
            }
          }
          
          @keyframes smoothSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes progressSlide {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .loader-logo-container {
              width: 100px;
              height: 100px;
            }
            .loader-logo-image {
              width: 80px;
              height: 80px;
            }
            .logo-letter {
              font-size: 44px;
            }
            .logo-ring {
              width: 100px;
              height: 100px;
            }
            .loader-progress {
              width: 160px;
            }
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
            {/* Logo animado */}
            <div className="loader-logo-container">
              <div className="logo-ring"></div>
              <div className="loader-logo-image">
                <div className="logo-letter">L</div>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="loader-progress">
              <div className="progress-bar"></div>
            </div>
            
            {/* Texto de carga */}
            <div className="loader-text">
              Cargando...
            </div>
          </div>
        </div>

        <ClientProvider>
          {children}
        </ClientProvider>

        {/* Script para ocultar el loader cuando React esté listo */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function hideLoader() {
              const loader = document.getElementById('initial-loader');
              if (loader) {
                loader.classList.add('hidden');
                setTimeout(() => {
                  loader.style.display = 'none';
                }, 800);
              }
            }

            let checksCount = 0;
            const minDisplayTime = 3000; // Mínimo 3 segundos visible
            const startTime = Date.now();
            let dataLoaded = false;
            
            // Verificar si los datos del backend están cargados
            function checkDataLoaded() {
              // Verificar si hay elementos del header/footer cargados
              const header = document.querySelector('header');
              const hasContent = header && header.textContent.trim().length > 0;
              
              // Verificar si las variables CSS están cargadas
              const primaryColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--color-primary')
                .trim();
              
              return hasContent && primaryColor && primaryColor !== '';
            }
            
            function checkIfReady() {
              checksCount++;
              const elapsedTime = Date.now() - startTime;
              
              // Verificar si los datos están listos
              if (!dataLoaded) {
                dataLoaded = checkDataLoaded();
              }
              
              // Ocultar solo si:
              // 1. Ha pasado el tiempo mínimo
              // 2. Los datos están cargados
              if (elapsedTime >= minDisplayTime && dataLoaded) {
                setTimeout(hideLoader, 500);
              } else if (checksCount > 200) {
                // Después de 200 intentos (10 segundos), ocultar de todos modos
                setTimeout(hideLoader, 500);
              } else {
                // Reintentar cada 50ms
                setTimeout(checkIfReady, 50);
              }
            }

            // Iniciar verificación cuando el DOM esté listo
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', () => {
                setTimeout(checkIfReady, 100);
              });
            } else {
              setTimeout(checkIfReady, 100);
            }

            // Timeout de seguridad: 10 segundos máximo
            setTimeout(hideLoader, 10000);
          })();
        `}} />
      </body>
    </html>
  );
}
