import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="pl-2 pr-4 py-6 sm:pr-6 lg:pr-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};