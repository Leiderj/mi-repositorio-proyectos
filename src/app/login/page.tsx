'use client'; // Habilita hooks de React e interactividad en el cliente (Next.js App Router)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Método de Firebase Auth para iniciar sesión mediante correo y contraseña
import { signInWithEmailAndPassword } from 'firebase/auth';
// Métodos de Firestore para consultar documentos específicos (en este caso, el perfil del usuario)
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase'; 
// Función personalizada para registrar eventos en la bitácora de seguridad (auditoría)
import { registrarAuditoria } from '@/lib/audit';

// Componentes estéticos de interfaz de usuario de Shadcn/ui
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Iconos vectoriales de la librería Lucide React
import { Loader2, AlertCircle, Users } from 'lucide-react'; 

export default function LoginPage() {
  const router = useRouter();
  
  // Estados locales para capturar los datos del formulario y manejar la interfaz
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false); // Controla el estado del spinner y deshabilita botones
  const [error, setError] = useState('');           // Almacena los mensajes de error legibles para el usuario

  /**
   * MANEJADOR DEL INICIO DE SESIÓN
   * Procesa el evento de envío (submit) del formulario, valida credenciales,
   * lee el rol en Firestore, registra la auditoría y redirige.
   */
  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue por defecto al enviar el formulario
    setCargando(true);  // Activa el estado visual de carga (bloquea botones, muestra spinner)
    setError('');       // Limpia cualquier error previo

    try {
      // 1. AUTENTICACIÓN: Intenta validar al usuario en los servidores de Firebase Auth
      const credenciales = await signInWithEmailAndPassword(auth, correo, password);
      const usuario = credenciales.user;
      
      // 2. RECUPERACIÓN DE ROL: Busca el documento complementario del usuario en la colección 'users' usando su UID
      const userDoc = await getDoc(doc(db, 'users', usuario.uid));
      
      if (userDoc.exists()) {
        const datosUsuario = userDoc.data();
        const rol = datosUsuario.rol;

        // 3. REGISTRO EN BITÁCORA: Envía el evento de login exitoso a los logs de auditoría de ProjectHub
        try {
          await registrarAuditoria('LOGIN', `Sesión iniciada por ${usuario.email} (${rol})`);
        } catch (e) {
          // Si la auditoría falla (ej. por reglas de Firestore o red), se usa console.warn para no bloquear la experiencia del usuario
          console.warn("No se pudo registrar la auditoría.");
        }

        // 4. ENRUTAMIENTO INTELIGENTE (RBAC): Redirige al usuario a su panel correspondiente según su rol
        if (rol === 'admin') {
          router.push('/projects');
        } else if (rol === 'auditor') {
          router.push('/auditoria'); // Los auditores van directo a la bitácora de seguridad
        } else {
          router.push('/projects');  // Estudiantes / Usuarios comunes van a proyectos
        }
      } else {
        // Error controlado: El usuario se autenticó en Auth, pero no tiene perfil en la colección de Firestore
        setError('Error: Perfil de usuario no encontrado en la base de datos.');
      }
    } catch (err: any) {
      // 5. CONTROL ROBUSTO DE ERRORES DE FIREBASE
      console.error(err); // Útil para depuración en desarrollo
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        // Mensaje genérico por seguridad (no dar pistas a atacantes sobre si el correo o la contraseña están mal por separado)
        setError('Las credenciales ingresadas no son válidas o el usuario ha sido eliminado.');
      } else if (err.code === 'auth/too-many-requests') {
        // Medida de seguridad integrada de Firebase contra ataques de fuerza bruta
        setError('Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente.');
      } else {
        setError('Ocurrió un problema de conexión. Inténtalo más tarde.');
      }
    } finally {
      // Se ejecuta SIEMPRE, ya sea que el bloque try tenga éxito o falle, asegurando apagar el estado de carga
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      {/* Tarjeta contenedora del formulario */}
      <Card className="w-full max-w-md shadow-xl border-t-4 border-primary">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl text-center font-bold tracking-tight">UNEXCA PNF-I</CardTitle>
          <CardDescription className="text-center text-base">
            Acceso administrativo y estudiantil
          </CardDescription>
        </CardHeader>

        {/* Formulario HTML que dispara la lógica de autenticación */}
        <form onSubmit={manejarLogin}>
          <CardContent className="space-y-4 pt-4">
            
            {/* RENDERIZADO CONDICIONAL DE ERRORES: Muestra el banner rojo solo si hay un mensaje en el estado */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {/* Campo: Correo Institucional */}
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
            
            {/* Campo: Contraseña */}
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
          
          {/* Pie de la tarjeta: Botones de acción */}
          <CardFooter className="flex flex-col space-y-4 pb-8">
            {/* Botón de envío. Se deshabilita durante la carga para evitar peticiones duplicadas */}
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={cargando}>
              {cargando ? (
                // Muestra un loader giratorio animado si está procesando la petición
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Iniciando sesión...</>
              ) : 'Entrar al Sistema'}
            </Button>
            
            {/* Enlace alternativo para redirigir a la vista de registro */}
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

      {/* BOTÓN ADICIONAL: Enlace directo para conocer al equipo desarrollador */}
      <div className="mt-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/equipo')} 
          className="text-slate-500 hover:text-slate-800 flex items-center gap-2"
        >
          <Users className="h-4 w-4" /> Conoce al equipo y nuestras redes
        </Button>
      </div>
    </div>
  );
}