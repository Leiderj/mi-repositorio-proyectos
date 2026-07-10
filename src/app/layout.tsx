// src/app/layout.tsx (Versión Limpia con PWA)
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Aquí combinamos tu metadata original con la configuración de la PWA
export const metadata: Metadata = {
  title: 'UNEXCA PNF-I',
  description: 'Gestión de Proyectos de Informática',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UNEXCA PNF-I',
  },
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