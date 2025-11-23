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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
            transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
          }
          
          #initial-loader.hidden {
            opacity: 0;
            pointer-events: none;
          }
          
          /* Partículas flotantes de fondo */
          .loader-particles {
            position: absolute;
            inset: 0;
            overflow: hidden;
          }
          
          .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            animation: float 20s infinite;
          }
          
          .particle:nth-child(1) { left: 10%; animation-delay: 0s; animation-duration: 15s; }
          .particle:nth-child(2) { left: 20%; animation-delay: 2s; animation-duration: 18s; }
          .particle:nth-child(3) { left: 30%; animation-delay: 4s; animation-duration: 20s; }
          .particle:nth-child(4) { left: 40%; animation-delay: 1s; animation-duration: 16s; }
          .particle:nth-child(5) { left: 50%; animation-delay: 3s; animation-duration: 19s; }
          .particle:nth-child(6) { left: 60%; animation-delay: 5s; animation-duration: 17s; }
          .particle:nth-child(7) { left: 70%; animation-delay: 2.5s; animation-duration: 21s; }
          .particle:nth-child(8) { left: 80%; animation-delay: 4.5s; animation-duration: 15s; }
          .particle:nth-child(9) { left: 90%; animation-delay: 1.5s; animation-duration: 18s; }
          
          /* Contenedor principal con glassmorphism */
          .loader-content {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3rem;
            padding: 4rem 3rem;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
            animation: floatIn 1s ease-out;
          }
          
          /* Logo/Icono animado */
          .loader-logo-container {
            position: relative;
            width: 200px;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .loader-logo-image {
            width: 160px;
            height: 160px;
            position: relative;
            z-index: 2;
            background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(224, 231, 255, 0.9) 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4), 0 0 80px rgba(255, 255, 255, 0.3);
            animation: logoFloat 3s ease-in-out infinite;
            border: 3px solid rgba(255, 255, 255, 0.5);
          }
          
          .logo-letter {
            font-family: 'Cormorant Garamond', serif;
            font-size: 90px;
            font-weight: 700;
            color: #667eea;
            text-shadow: 0 4px 15px rgba(102, 126, 234, 0.5), 0 2px 5px rgba(118, 75, 162, 0.3);
          }
          
          .logo-ring {
            position: absolute;
            border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.2);
          }
          
          .logo-ring-1 {
            width: 200px;
            height: 200px;
            border-top-color: rgba(255, 255, 255, 0.6);
            border-right-color: rgba(255, 255, 255, 0.6);
            animation: spin 4s linear infinite;
          }
          
          .logo-ring-2 {
            width: 160px;
            height: 160px;
            border-bottom-color: rgba(255, 255, 255, 0.4);
            border-left-color: rgba(255, 255, 255, 0.4);
            animation: spin-reverse 3s linear infinite;
          }
          

          
          /* Barra de progreso */
          .loader-progress {
            width: 280px;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            overflow: hidden;
            position: relative;
          }
          
          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), #fff, rgba(255, 255, 255, 0.8));
            background-size: 200% 100%;
            border-radius: 10px;
            animation: progressFlow 2s ease-in-out infinite;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
          }
          
          /* Texto de carga */
          .loader-text {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.875rem;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.9);
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          
          .loader-dot {
            animation: dotBounce 1.4s infinite;
          }
          .loader-dot:nth-child(2) { animation-delay: 0.2s; }
          .loader-dot:nth-child(3) { animation-delay: 0.4s; }
          
          /* Animaciones */
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(100vh) translateX(0);
              opacity: 0;
            }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% {
              transform: translateY(-100px) translateX(100px);
              opacity: 0;
            }
          }
          
          @keyframes floatIn {
            from {
              opacity: 0;
              transform: translateY(30px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
          }
          
          @keyframes logoFloat {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            50% {
              transform: translateY(-10px) scale(1.05);
            }
          }
          
          @keyframes progressFlow {
            0% { background-position: 0% 0%; }
            100% { background-position: 200% 0%; }
          }
          
          @keyframes dotBounce {
            0%, 80%, 100% {
              transform: translateY(0);
              opacity: 1;
            }
            40% {
              transform: translateY(-8px);
              opacity: 0.7;
            }
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .loader-content {
              padding: 3rem 2rem;
              gap: 2rem;
            }
            .loader-logo-container {
              width: 150px;
              height: 150px;
            }
            .loader-logo-image {
              width: 130px;
              height: 130px;
            }
            .logo-letter {
              font-size: 70px;
            }
            .logo-ring-1 { width: 150px; height: 150px; }
            .logo-ring-2 { width: 120px; height: 120px; }
            .loader-progress {
              width: 220px;
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
          {/* Partículas flotantes */}
          <div className="loader-particles">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
          </div>
          
          {/* Contenido principal */}
          <div className="loader-content">
            {/* Logo animado */}
            <div className="loader-logo-container">
              <div className="logo-ring logo-ring-1"></div>
              <div className="logo-ring logo-ring-2"></div>
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
              <span>Preparando tu experiencia</span>
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
                // NO remover del DOM, solo ocultar con CSS
                loader.style.display = 'none';
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
