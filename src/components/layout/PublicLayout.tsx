import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import SkipLink from '@/components/shared/SkipLink';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
