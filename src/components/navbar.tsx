'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { registrarAuditoria } from '@/lib/audit'; // Asegúrate que esta sea la ruta correcta

export function Navbar() {
  const [usuario, setUsuario] = useState<any>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // 1. Registrar auditoría ANTES de cerrar sesión
      if (auth.currentUser) {
        await registrarAuditoria('LOGOUT', `Cierre de sesión: ${auth.currentUser.email}`);
      }
      // 2. Cerrar sesión
      await signOut(auth);
      // 3. Redirigir
      router.push('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          setUsuario({
            email: user.email,
            rol: userDoc.exists() ? userDoc.data().rol : 'usuario'
          });
        } catch (e) {
          setUsuario({ email: user.email, rol: 'conectado' });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-16 items-center justify-end px-6 w-full bg-white relative z-50">
      <div className="flex items-center gap-4">
        {usuario && (
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mr-2">
            <User className="h-4 w-4" />
            <span>{usuario.email}</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase">
              {usuario.rol}
            </span>
          </div>
        )}
        
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleSignOut}
>
       <LogOut className="h-4 w-4 mr-2" />
         Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}