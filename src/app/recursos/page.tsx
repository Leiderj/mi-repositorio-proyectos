'use client'; // Habilita la interactividad, el manejo de estados de React y la API de Firebase en el cliente

import { useEffect, useState } from 'react';
// Importaciones de Firestore para consultas, ordenamiento, escucha en tiempo real, inserción de documentos y marcas de tiempo del servidor
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
// Observador para seguir el estado de la sesión activa
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

// Componentes estructurales y contenedores compartidos (Layout y UI)
import { MainSidebar } from '@/components/main-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Iconografía vectorial de Lucide React
import { FileText, Download, Loader2, Plus } from 'lucide-react';

export default function RecursosPage() {
  // Estados para la lectura de datos y control de UI
  const [guias, setGuias] = useState<any[]>([]); // Almacena el listado de recursos/guías académicas
  const [rol, setRol] = useState<string | null>(null); // Rol del usuario actual ('admin', 'auditor', etc.)
  const [cargando, setCargando] = useState(true);      // Loader de la lista general

  // Estados locales para capturar los inputs del formulario (Campos controlados)
  const [nombre, setNombre] = useState('');
  const [url, setUrl] = useState('');
  const [guardando, setGuardando] = useState(false); // Spinner específico del botón de envío

  /**
   * EFECTO DE ESCUCHA Y ACOPLAMIENTO DE DATOS
   * Sincroniza de forma independiente la sesión y el flujo de base de datos en tiempo real.
   */
  useEffect(() => {
    // 1. Verificación de Autenticación y Rol
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Si hay sesión, consulta el rol exacto asignado en Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setRol(userDoc.data()?.rol || null);
      } else {
        setRol(null); // Limpia el rol si el usuario cierra sesión
      }
    });

    // 2. Escucha Activa de Recursos (WebSockets nativos de Firebase)
    // Apunta a la colección 'recursos' y los ordena de forma descendente por la fecha de creación
    const q = query(collection(db, 'recursos'), orderBy('createdAt', 'desc'));
    
    // Al usar onSnapshot, cualquier manual o PDF añadido por un admin aparecerá en la pantalla
    // de todos los estudiantes al instante, sin recargar el navegador.
    const unsubscribeData = onSnapshot(q, (snapshot) => {
      setGuias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCargando(false); // Apaga el spinner general una vez recibida la primera captura
    });

    // FUNCIÓN DE LIMPIEZA (Cleanup): Evita fugas de memoria y lecturas redundantes en la API de Firebase
    return () => {
      unsubscribeAuth();
      unsubscribeData();
    };
  }, []);

  /**
   * MANEJADOR DE ESCRITURA (Privilegios de Administrador)
   * Valida los campos locales e inserta el nuevo recurso con marcas de tiempo atómicas.
   */
  const handleGuardar = async () => {
    if (!nombre || !url) return; // Validación de seguridad elemental por si se evaden las restricciones del botón
    setGuardando(true);           // Enciende el loader interno del botón para evitar solicitudes en ráfaga
    
    try {
      // Agrega un nuevo documento a la colección 'recursos'
      await addDoc(collection(db, 'recursos'), {
        nombre,
        url,
        // serverTimestamp garantiza que la hora se tome del servidor de Firebase, previniendo desfases por relojes locales mal configurados
        createdAt: serverTimestamp() 
      });
      
      // Limpia las cajas de texto tras una inserción exitosa
      setNombre('');
      setUrl('');
    } catch (error) {
      console.error("Error al guardar el recurso metodológico:", error);
    } finally {
      setGuardando(false); // Libera el bloqueo del botón
    }
  };

  return (
    <MainSidebar>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        
        {/* Título de la Sección */}
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="text-primary" /> Recursos de Apoyo
        </h1>

        {/* 3. FORMULARIO RESTRINGIDO (Renderizado Condicional RBAC)
            Esta tarjeta completa solo se monta e inyecta en el DOM si el string 'rol' es exactamente 'admin'.
            Los estudiantes e invitados nunca descargarán ni procesarán este fragmento de código visual.
        */}
        {rol === 'admin' && (
          <Card className="border-primary/50 shadow-sm bg-slate-50 dark:bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" /> Agregar Nuevo Recurso
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              {/* Captura el nombre de la guía metodológica */}
              <Input 
                placeholder="Nombre de la guía (Ej. Manual de Usuario)" 
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
                className="flex-1"
              />
              {/* Captura la dirección externa o repositorio de Drive */}
              <Input 
                placeholder="URL de Google Drive o PDF" 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                className="flex-1"
              />
              {/* El botón se auto-deshabilita si los campos están vacíos o si se está ejecutando la petición */}
              <Button onClick={handleGuardar} disabled={guardando || !nombre || !url}>
                {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Subir Recurso
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 4. FLUJO DE RENDERIZADO DE LA COLECClÓN */}
        {cargando ? (
          // Estado A: Descargando datos iniciales
          <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8" /></div>
        ) : guias.length === 0 ? (
          // Estado B: Conexión exitosa, pero la colección en Firestore está vacía
          <Card>
             <CardContent className="flex justify-center items-center p-10 text-slate-500">
               No hay recursos disponibles en este momento.
             </CardContent>
          </Card>
        ) : (
          // Estado C: Renderizado dinámico de la lista de guías mediante iteración (.map)
          <div className="grid gap-4">
            {guias.map((guia) => (
              <Card key={guia.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {/* Icono de archivo con color contrastante para simular un PDF */}
                    <FileText className="text-red-500 h-6 w-6" />
                    <span className="font-medium">{guia.nombre}</span>
                  </div>
                  
                  {/* Botón con la propiedad 'asChild'. Indica a Radix UI que no pinte un elemento <button> real,
                      sino que herede los estilos de Shadcn y los aplique directamente a la etiqueta <a> interna.
                      Esto previene el error HTML de anidar un enlace dentro de un botón.
                  */}
                  <Button variant="outline" asChild>
                    <a href={guia.url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Abrir PDF
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainSidebar>
  );
}