import { useEffect, useRef } from 'react';

export const useEscalationNotification = (unreadCount: number) => {
  const previousCountRef = useRef(unreadCount);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Crear el elemento de audio si no existe
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.volume = 0.5; // Volumen al 50%
    }
  }, []);

  useEffect(() => {
    const previousCount = previousCountRef.current;
    
    // Si aumentó el contador de no leídas, reproducir sonido y actualizar título
    if (unreadCount > previousCount) {
      // Reproducir sonido
      if (audioRef.current) {
        audioRef.current.play().catch(error => {
          console.log('No se pudo reproducir el sonido:', error);
        });
      }

      // Actualizar título de la pestaña
      document.title = `(${unreadCount}) Nueva escalación - Dashboard`;

      // Crear notificación del navegador si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nueva Escalación', {
          body: 'Un cliente solicita atención humana',
          icon: '/logo.png',
          badge: '/logo.png',
        });
      }
    } else if (unreadCount === 0) {
      // Restaurar título original cuando no hay notificaciones
      document.title = 'Dashboard - Clínica de Belleza';
    } else if (unreadCount > 0) {
      // Mantener el contador en el título
      document.title = `(${unreadCount}) Dashboard - Clínica de Belleza`;
    }

    previousCountRef.current = unreadCount;
  }, [unreadCount]);

  // Solicitar permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Limpiar el título cuando el componente se desmonte
  useEffect(() => {
    return () => {
      document.title = 'Dashboard - Clínica de Belleza';
    };
  }, []);
};
