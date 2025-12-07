'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCompanySettings } from '@/hooks/useCompanySettings';

export default function MaintenanceCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const { maintenanceMode, loading } = useCompanySettings();

  useEffect(() => {
    // No hacer nada mientras está cargando
    if (loading) return;

    console.log('🔍 MaintenanceCheck - Maintenance mode:', maintenanceMode);
    console.log('🔍 MaintenanceCheck - Current pathname:', pathname);

    // Si está en modo mantenimiento y no está en la página de mantenimiento
    if (maintenanceMode && pathname !== '/maintenance') {
      console.log('✅ Redirecting to /maintenance');
      router.push('/maintenance');
    }
    
    // Si NO está en modo mantenimiento y está en la página de mantenimiento
    if (!maintenanceMode && pathname === '/maintenance') {
      console.log('✅ Redirecting to /');
      router.push('/');
    }
  }, [maintenanceMode, pathname, router, loading]);

  return null; // Este componente no renderiza nada
}
