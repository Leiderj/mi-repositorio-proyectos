'use client';
import { useEffect, useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { BookText, FileText, Home, ShieldAlert, Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase';

import { Navbar } from '@/components/navbar';

export function MainSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [rol, setRol] = useState<string | null>(null);
  const [cargandoRol, setCargandoRol] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setRol(userDoc.data().rol);
          }
        } catch (error) {
          console.error("Error verificando rol en Sidebar:", error);
        }
      } else {
        setRol(null);
      }
      setCargandoRol(false);
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path: string) => pathname === path;

  // Mientras carga el rol, mostramos un estado neutro o un spinner
  if (cargandoRol) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2 border-b">
            <Logo className="size-8 text-primary" />
            <h1 className="text-lg font-semibold">ProjectHub</h1>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarMenu>
            
            {/* 🏠 PROYECTOS: Visible para ADMIN y BASICO solamente */}
            {(rol === 'admin' || rol === 'basico') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/projects')} tooltip="Proyectos">
                  <Link href="/projects">
                    <span className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>Proyectos</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            
            {/* 📊 REPORTES: Oculto para Auditor, visible para el resto */}
            {(rol === 'admin' || rol === 'basico') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reportes">
                  <Link href="#">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Reportes</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            
            {/* 📚 BIBLIOGRAFÍA: Oculto para Auditor, visible para el resto */}
            {(rol === 'admin' || rol === 'basico') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Bibliografía">
                  <Link href="#">
                    <span className="flex items-center gap-2">
                      <BookText className="h-4 w-4" />
                      <span>Bibliografía</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {/* 🛡️ AUDITORÍA: Visible para ADMIN y AUDITOR únicamente */}
            {(rol === 'admin' || rol === 'auditor') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/auditoria')} tooltip="Auditoría">
                  <Link href="/auditoria">
                    <span className="flex items-center gap-2 text-red-600 font-bold">
                      <ShieldAlert className="h-4 w-4" />
                      <span>Auditoría</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      
      <SidebarInset className="flex flex-col bg-gray-50/30">
        <header className="flex h-12 items-center px-4 md:hidden border-b bg-white">
          <SidebarTrigger />
        </header>
        
        <div className="sticky top-0 z-10 w-full bg-white shadow-sm border-b">
          <Navbar />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 text-slate-900">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}