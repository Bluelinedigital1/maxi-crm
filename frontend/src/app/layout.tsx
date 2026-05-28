import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Maxi CRM',
  description: 'Gestão comercial de joias e semijoias',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" style={{ colorScheme: 'light' }}>
      <body style={{ backgroundColor: '#FAF9F5', color: '#2A2F2D' }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#212529',
              color: '#F8F9FA',
              borderRadius: '12px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#0F4C3A', secondary: '#F8F9FA' } },
          }}
        />
      </body>
    </html>
  );
}
