'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function MaintenanceCheck() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        console.log('🔍 MaintenanceCheck - API URL:', apiUrl);
        console.log('🔍 MaintenanceCheck - Current pathname:', pathname);
        
        const response = await fetch(`${apiUrl}/api/v1/company-settings`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        console.log('🔍 MaintenanceCheck - Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 MaintenanceCheck - Data received:', data);
          console.log('🔍 MaintenanceCheck - maintenanceMode value:', data.data?.maintenanceMode);
          
          const isMaintenanceMode = data.success && data.data?.maintenanceMode;
          console.log('🔍 MaintenanceCheck - Is maintenance mode?', isMaintenanceMode);

          // Si está en modo mantenimiento y no está en la página de mantenimiento
          if (isMaintenanceMode && pathname !== '/maintenance') {
            console.log('✅ Redirecting to /maintenance');
            router.push('/maintenance');
          }
          
          // Si NO está en modo mantenimiento y está en la página de mantenimiento
          if (!isMaintenanceMode && pathname === '/maintenance') {
            console.log('✅ Redirecting to /');
            router.push('/');
          }
        }
      } catch (error) {
        console.error('❌ Error checking maintenance mode:', error);
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
