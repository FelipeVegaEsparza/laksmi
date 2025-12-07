import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // No aplicar middleware a rutas de API, assets estáticos, o la página de mantenimiento
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/maintenance'
  ) {
    return NextResponse.next();
  }

  try {
    // Verificar el estado de mantenimiento
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/company-settings`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      const isMaintenanceMode = data.success && data.data?.maintenanceMode;

      // Si está en modo mantenimiento y no está en la página de mantenimiento, redirigir
      if (isMaintenanceMode && pathname !== '/maintenance') {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }

      // Si NO está en modo mantenimiento y está en la página de mantenimiento, redirigir al home
      if (!isMaintenanceMode && pathname === '/maintenance') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    // En caso de error, permitir el acceso normal
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
