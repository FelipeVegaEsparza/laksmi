'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function MaintenanceCheck() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/company-settings`, {
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          const isMaintenanceMode = data.success && data.data?.maintenanceMode;

          // Si está en modo mantenimiento y no está en la página de mantenimiento
          if (isMaintenanceMode && pathname !== '/maintenance') {
            router.push('/maintenance');
          }
          
          // Si NO está en modo mantenimiento y está en la página de mantenimiento
          if (!isMaintenanceMode && pathname === '/maintenance') {
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      }
    };

    // Verificar inmediatamente
    checkMaintenanceMode();

    // Verificar cada 30 segundos
    const interval = setInterval(checkMaintenanceMode, 30000);

    return () => clearInterval(interval);
  }, [pathname, router]);

  return null; // Este componente no renderiza nada
}
