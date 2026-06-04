// src/app/layout.tsx (Versión Limpia)
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
// Ya NO importamos la Navbar aquí

export const metadata: Metadata = {
  title: 'PNF-I ProjectHub',
  description: 'A platform for managing PNF-I projects at UNEXCA Altagracia.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* ... tus fuentes ... */}
      </head>
      <body className="font-body antialiased">
        {/* Quitamos la <Navbar /> de aquí */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}