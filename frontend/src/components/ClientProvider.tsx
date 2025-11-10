'use client';

import { useEffect, useState } from 'react';
import { ChatProvider } from '@/contexts/ChatContext';

interface ClientProviderProps {
  children: React.ReactNode;
}

const ClientProvider = ({ children }: ClientProviderProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Durante SSR, renderizar sin el ChatProvider
  if (!isClient) {
    return <>{children}</>;
  }

  // En el cliente, renderizar con el ChatProvider
  return (
    <ChatProvider>
      {children}
    </ChatProvider>
  );
};

export default ClientProvider;