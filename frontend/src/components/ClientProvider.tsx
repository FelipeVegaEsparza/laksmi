'use client';

import { useEffect, useState } from 'react';
import { ChatProvider } from '@/contexts/ChatContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import InitialLoader from './InitialLoader';

interface ClientProviderProps {
  children: React.ReactNode;
}

const ClientProvider = ({ children }: ClientProviderProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Durante SSR, renderizar sin los providers
  if (!isClient) {
    return <>{children}</>;
  }

  // En el cliente, renderizar con todos los providers
  return (
    <ThemeProvider>
      <ChatProvider>
        <InitialLoader />
        {children}
      </ChatProvider>
    </ThemeProvider>
  );
};

export default ClientProvider;