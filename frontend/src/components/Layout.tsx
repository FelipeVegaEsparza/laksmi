import Header from './Header';
import Footer from './Footer';
import ChatWidget from './ChatWidget';
import ClientOnly from './ClientOnly';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <ClientOnly>
        <ChatWidget />
      </ClientOnly>
    </div>
  );
};

export default Layout;