'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase'; 
import { registrarAuditoria } from '@/lib/audit';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      // 1. Intento de autenticación
      const credenciales = await signInWithEmailAndPassword(auth, correo, password);
      const usuario = credenciales.user;

      // 2. Buscamos el documento del usuario para conocer su ROL
      const userDoc = await getDoc(doc(db, 'users', usuario.uid));
      
      if (userDoc.exists()) {
        const datosUsuario = userDoc.data();
        const rol = datosUsuario.rol;

        // Registro opcional en bitácora (no bloquea el flujo si falla)
        try {
          await registrarAuditoria('LOGIN', `Sesión iniciada por ${usuario.email} (${rol})`);
        } catch (e) {
          console.warn("No se pudo registrar la auditoría, pero el acceso es válido.");
        }

        // 3. REDIRECCIÓN SEGÚN ROL
        if (rol === 'admin') {
          // El Admin va a proyectos pero con todos los poderes activados
          router.push('/projects');
        } else if (rol === 'auditor') {
          // El Auditor va directo a su bitácora
          router.push('/auditoria');
        } else {
          // Usuario básico va al catálogo
          router.push('/projects');
        }
      } else {
        // Si el usuario existe en Auth pero NO en Firestore (error de base de datos)
        setError('Error: Perfil de usuario no encontrado en la base de datos.');
      }

    } catch (err: any) {
      console.error("Error capturado:", err.code);
      
      // MANEJO DE ERRORES (Evita la pantalla roja de "auth/invalid-credential")
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Las credenciales ingresadas no son válidas o el usuario ha sido eliminado.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente.');
      } else {
        setError('Ocurrió un problema de conexión. Inténtalo más tarde.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-primary">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl text-center font-bold tracking-tight">ProjectHub</CardTitle>
          <CardDescription className="text-center text-base">
            Acceso administrativo y estudiantil
          </CardDescription>
        </CardHeader>

        <form onSubmit={manejarLogin}>
          <CardContent className="space-y-4 pt-4">
            
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg animate-in fade-in zoom-in duration-300">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="correo">Correo Institucional</Label>
              <Input 
                id="correo" 
                type="email" 
                placeholder="usuario@unexca.edu.ve"
                value={correo} 
                onChange={(e) => setCorreo(e.target.value)} 
                required 
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="h-11"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pb-8">
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={cargando}>
              {cargando ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : 'Entrar al Sistema'}
            </Button>
            
            <button 
              type="button"
              onClick={() => router.push('/registro')} 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ¿Eres nuevo? <span className="font-bold underline">Crea una cuenta aquí</span>
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}