'use client'; // Indica que este componente se procesa en el cliente, permitiendo el uso de hooks y eventos de formulario

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Método de Firebase Auth para crear un nuevo usuario con credenciales de acceso primarias
import { createUserWithEmailAndPassword } from 'firebase/auth';
// Métodos de Firestore para escribir un documento con un ID específico y capturar marcas de tiempo de servidor
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; 

// Componentes estéticos y estructurales de Shadcn/ui para el formulario de registro
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegistroPage() {
  const router = useRouter();
  
  // Estados locales para capturar de forma controlada cada uno de los inputs requeridos
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pnf, setPnf] = useState('Informática'); // Valor institucional inicializado por defecto para el PNF-I
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para manejar los flujos de la interfaz de usuario
  const [cargando, setCargando] = useState(false); // Controla el estado del botón submit durante la inserción asíncrona
  const [error, setError] = useState('');           // Captura los mensajes de error sanitizados para mostrar al usuario

  /**
   * MANEJADOR DE REGISTRO DE USUARIOS
   * Ejecuta el proceso de aprovisionamiento en dos pasos atómicos: Auth (Seguridad) y Firestore (Perfil).
   */
  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault(); // Detiene la recarga nativa de la página al despachar el formulario
    setCargando(true);  // Activa el bloqueo del botón y el estado visual de espera
    setError('');       // Resetea errores previos

    try {
      // --- PASO 1: CREACIÓN DE IDENTIDAD EN FIREBASE AUTH (El Portero) ---
      // Registra el correo y la clave en los servidores de autenticación de Firebase.
      // Si la contraseña es débil o el correo ya existe, rompe el flujo e ingresa directamente al bloque 'catch'.
      const credenciales = await createUserWithEmailAndPassword(auth, correo, password);
      const usuarioAuth = credenciales.user;

      // --- PASO 2: VINCULACIÓN DEL PERFIL EXTENDIDO EN FIRESTORE (El Archivero) ---
      // Usamos 'setDoc' combinado con 'doc(db, 'users', usuarioAuth.uid)' para forzar de forma intencional 
      // que el ID del documento en Firestore sea EXACTAMENTE el mismo 'UID' generado por Firebase Auth.
      // Esto crea una relación 1:1 limpia, eliminando la necesidad de hacer búsquedas secundarias.
      await setDoc(doc(db, 'users', usuarioAuth.uid), {
        nombre: nombre,
        apellido: apellido,
        cedula: cedula,
        telefono: telefono,
        pnf: pnf,
        correo: correo,
        rol: 'basico', // REGLA DE SEGURIDAD: Todo usuario nuevo entra con el privilegio mínimo ('basico')
        fechaRegistro: serverTimestamp() // Captura la fecha y hora directamente desde los servidores de Firebase
      });

      // Si ambos pasos tienen éxito, redirige de inmediato al catálogo de proyectos
      router.push('/projects');

    } catch (err: any) {
      console.error("Error en el proceso de registro:", err);
      
      // --- TRADUCCIÓN Y SANITIZACIÓN DE EXCEPCIONES DE FIREBASE ---
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error al registrar el usuario. Revisa tus datos.');
      }
    } finally {
      setCargando(false); // Apaga el estado visual de carga
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      {/* Tarjeta contenedora del formulario */}
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Registro de Usuario</CardTitle>
          <CardDescription className="text-center">
            Crea tu cuenta para acceder al Repositorio del PNF-I
          </CardDescription>
        </CardHeader>

        <form onSubmit={manejarRegistro}>
          <CardContent className="space-y-4">
            
            {/* RENDERIZADO CONDICIONAL DEL BANNER DE ERROR: Se activa sólo si el estado 'error' contiene texto */}
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md text-center">
                {error}
              </div>
            )}

            {/* Fila Duplicada en Columnas (Responsivo por defecto) - Nombre y Apellido */}
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

            {/* Fila Duplicada en Columnas - Cédula de Identidad y Teléfono */}
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

            {/* Campo Restringido: PNF Institucional */}
            <div className="space-y-2">
              <Label htmlFor="pnf">PNF al que pertenece</Label>
              {/* Se mantiene deshabilitado (`disabled`) y con cursor bloqueado porque el sistema está 
                  parametrizado de forma exclusiva para el Programa Nacional de Formación en Informática.
              */}
              <Input 
                id="pnf" 
                value="Informática" 
                disabled 
                className="bg-gray-100 cursor-not-allowed" 
              />
            </div>

            {/* Campo: Correo Electrónico */}
            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña (Mínimo 6 caracteres)</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

          </CardContent>
          
          {/* Pie de la tarjeta: Botón de confirmación y enlace alternativo */}
          <CardFooter className="flex flex-col space-y-4">
            {/* Si 'cargando' es true, el botón se bloquea mecánicamente previniendo subidas duplicadas por spam de clicks */}
            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
            
            {/* Redirección rápida al Login si el estudiante ya poseía un perfil previo */}
            <Button variant="link" type="button" onClick={() => router.push('/login')} className="text-sm">
              ¿Ya tienes cuenta? Inicia sesión aquí
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}