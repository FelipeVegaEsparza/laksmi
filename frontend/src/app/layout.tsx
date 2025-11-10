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
      <body 
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
