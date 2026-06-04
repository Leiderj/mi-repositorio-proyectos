'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; 

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegistroPage() {
  const router = useRouter();
  
  // Estados para todos los campos que pediste + la contraseña obligatoria
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pnf, setPnf] = useState('Informática'); // Valor por defecto
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      // PASO 1: Crear el usuario en Firebase Auth (El Portero)
      const credenciales = await createUserWithEmailAndPassword(auth, correo, password);
      const usuarioAuth = credenciales.user;

      // PASO 2: Guardar los datos extra en Firestore (El Archivero)
      // Usamos setDoc y doc() para que el ID del documento sea EXACTAMENTE el mismo ID del Auth
      await setDoc(doc(db, 'users', usuarioAuth.uid), {
        nombre: nombre,
        apellido: apellido,
        cedula: cedula,
        telefono: telefono,
        pnf: pnf,
        correo: correo,
        rol: 'basico', // Todo usuario nuevo entra como básico
        fechaRegistro: serverTimestamp()
      });

      // Si todo sale bien, lo mandamos a la página de proyectos
      router.push('/projects');

    } catch (err: any) {
      console.error(err);
      // Traducimos los errores comunes de Firebase al español
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error al registrar el usuario. Revisa tus datos.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Registro de Usuario</CardTitle>
          <CardDescription className="text-center">
            Crea tu cuenta para acceder al Repositorio del PNF-I
          </CardDescription>
        </CardHeader>

        <form onSubmit={manejarRegistro}>
          <CardContent className="space-y-4">
            
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula</Label>
                <Input id="cedula" placeholder="V-12345678" value={cedula} onChange={(e) => setCedula(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" placeholder="0414-0000000" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pnf">PNF al que pertenece</Label>
              <Input 
                id="pnf" 
                value="Informática" 
                disabled 
                 className="bg-gray-100 cursor-not-allowed" 
              />

            </div>

            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña (Mínimo 6 caracteres)</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
            <Button variant="link" type="button" onClick={() => router.push('/login')} className="text-sm">
              ¿Ya tienes cuenta? Inicia sesión aquí
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}