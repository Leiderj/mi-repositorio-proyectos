'use client'; // Indica que el componente se ejecuta en el navegador (permite hooks, eventos de Firebase y enrutamiento)

import { useEffect, useState } from 'react';
// Métodos de Firestore para realizar consultas de colecciones completas y leer documentos individuales
import { collection, getDocs, query, doc, getDoc } from 'firebase/firestore';
// Observador nativo para seguir los cambios del estado de la sesión de Firebase Auth
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; 
import { useRouter } from 'next/navigation';

// Componentes estéticos y de diseño atómico de Shadcn/ui
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react'; // Iconografía interactiva y de carga animada
// Componente hijo encargado de iterar y pintar las tarjetas o filas del catálogo
import { ProjectList } from '@/components/project-list';
import Link from 'next/link'; // Componente de Next.js para navegación rápida entre páginas del cliente (Prefetching)

export default function ProjectsPage() {
  const router = useRouter();
  // Estados de control para la interfaz de usuario
  const [proyectos, setProyectos] = useState<any[]>([]); // Almacena el listado de proyectos normalizados
  const [cargando, setCargando] = useState(true);        // Controla la visualización del esqueleto/pantalla de carga
  const [esAuditor, setEsAuditor] = useState(false);     // Flag para manejo de renderizado de seguridad local

  /**
   * EFECTO PRINCIPAL (VIGILANTE Y CARGADOR)
   * Controla de forma secuencial la sesión del usuario, valida sus privilegios 
   * y, si tiene autorización, descarga la colección desde Firebase Firestore.
   */
  useEffect(() => {
    
    /**
     * SUB-FUNCIÓN ASÍNCRONA: Obtención e Hidratación de Datos
     * Descarga los registros de la colección 'projects' y los normaliza uno a uno.
     */
    const obtenerProyectos = async () => {
      try {
        // Construye la query apuntando a la colección raíz de proyectos
        const q = query(collection(db, 'projects'));
        const querySnapshot = await getDocs(q); // Realiza la lectura física de datos (Petición HTTP)
        
        const lista: any[] = [];
        
        // Itera sobre el snapshot de documentos devuelto por Firebase
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // --- PROCESO TÉCNICO DE NORMALIZACIÓN DE ESQUEMAS (Polimorfismo) ---
          lista.push({ 
            id: doc.id, // Inyecta el ID único del documento de Firestore
            ...data,    // 1. PRIMERO: Traemos todo el objeto crudo original
            
            // 2. DESPUÉS: Forzamos la equivalencia bilingüe (Español / Inglés).
            // Esto sobrescribe claves antiguas y garantiza que el componente hijo reciba variables estables.
            title: data.title || data.titulo || 'Sin título',
            description: data.description || data.descripcion || 'Sin descripción',
            trayecto: data.trayecto || 'IV', 
            locality: data.locality || data.parroquia || 'No especificado', 
            status: data.status || data.estatus || 'Completado', 
            team: data.team || data.equipo || [], // Asegura un arreglo iterable vacío si no existen integrantes
            archivo_url: data.archivo_url || ''
          });
        });
        
        // Guarda el array mapeado y limpio en el estado
        setProyectos(lista);
      } catch (error) {
        console.error("❌ Error obteniendo proyectos: ", error);
      } finally {
        setCargando(false); // Apaga la animación de carga general
      }
    };

    // EL VIGILANTE INTERNO: Escucha cambios en la sesión de Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // CONTROL DE ACCESO (RBAC): Busca el rol del usuario en la colección 'users' antes de pintar el catálogo
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists() && userDoc.data().rol === 'auditor') {
            // REGLA DE NEGOCIO INSTITUCIONAL: Un auditor no pertenece al catálogo general de administración/estudiantes
            console.log("👮 Auditor detectado en zona de proyectos. Redirigiendo...");
            router.push('/auditoria'); // Lo expulsa inmediatamente hacia la bitácora de seguridad
          } else {
            // SI ES ESTUDIANTE / ADMIN DE REPOSITORIO: Se autoriza la carga del catálogo académico
            setEsAuditor(false);
            obtenerProyectos(); // Gatilla la subida de datos desde Firestore
          }
        } catch (error) {
          console.error("Error validando rol:", error);
          setCargando(false);
        }
      } else {
        // PROTECCIÓN DE RUTA DE INVITADOS: Si el usuario no está logueado, es redirigido al inicio de sesión
        router.push('/login');
      }
    });

    // Cleanup del hook useEffect: Cancela la suscripción de escucha de Auth al cambiar de página
    return () => unsubscribe();
  }, [router]);

  // PANTALLA GENERAL DE TRANSICIÓN Y CARGA (Garantiza que no ocurran saltos visuales o parpadeos de UI)
  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="animate-pulse">Cargando catálogo de proyectos...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* HEADER DE LA SECCIÓN DE PROYECTOS */}
      <header className="flex items-center justify-between p-4 md:p-6 border-b bg-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos PNF</h1>
          <p className="text-sm text-muted-foreground">Explora los proyectos de la sede Altagracia.</p>
        </div>
        
        {/* Enlace envuelto de forma óptima para la creación de un nuevo Trabajo de Grado */}
        <Link href="/nuevo-proyecto">
          <Button className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </header>
      
      {/* CUERPO PRINCIPAL DEL CATÁLOGO
          Inyecta el listado de proyectos completamente sanitizado dentro del componente reutilizable <ProjectList />
      */}
      <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50/30">
        <ProjectList projects={proyectos} />
      </main>
    </div>
  );
}