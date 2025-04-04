import React from 'react';
import VaccineChatbot from './VaccineChatbot';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 relative">
      <main className="container mx-auto px-4 py-8 pb-24">
        {children}
      </main>
      <div className="fixed bottom-0 right-0 z-50">
        <VaccineChatbot />
      </div>
    </div>
  );
};

export default Layout; 