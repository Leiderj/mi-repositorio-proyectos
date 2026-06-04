'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; 
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { ProjectList } from '@/components/project-list';
import Link from 'next/link';

export default function ProjectsPage() {
  const router = useRouter();
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [esAuditor, setEsAuditor] = useState(false);

  useEffect(() => {
    const obtenerProyectos = async () => {
      try {
        const q = query(collection(db, 'projects'));
        const querySnapshot = await getDocs(q);
        
        const lista: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          lista.push({ 
            id: doc.id, 
            ...data, // 1. PRIMERO traemos todo lo crudo de Firebase
            
            // 2. DESPUÉS normalizamos los nombres (esto sobrescribe cualquier error viejo)
            title: data.title || data.titulo || 'Sin título',
            description: data.description || data.descripcion || 'Sin descripción',
            trayecto: data.trayecto || 'IV', 
            locality: data.locality || data.parroquia || 'No especificado', 
            status: data.status || data.estatus || 'Completado', 
            team: data.team || data.equipo || [], // <- El arreglo de equipo corregido
            archivo_url: data.archivo_url || ''
          });
        });
        
        setProyectos(lista);
      } catch (error) {
        console.error("❌ Error obteniendo proyectos: ", error);
      } finally {
        setCargando(false);
      }
    };

    // EL VIGILANTE: Verifica sesión y ROL
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Verificamos el rol antes de mostrar nada
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists() && userDoc.data().rol === 'auditor') {
            // SI ES AUDITOR: No pertenece aquí, lo mandamos a su panel
            console.log("👮 Auditor detectado en zona de proyectos. Redirigiendo...");
            router.push('/auditoria');
          } else {
            // SI ES ESTUDIANTE: Cargamos el catálogo normal
            setEsAuditor(false);
            obtenerProyectos();
          }
        } catch (error) {
          console.error("Error validando rol:", error);
          setCargando(false);
        }
      } else {
        // Sin sesión, al login
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Si está cargando o si es auditor (mientras se redirige), mostramos el spinner
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
      <header className="flex items-center justify-between p-4 md:p-6 border-b bg-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos PNF</h1>
          <p className="text-sm text-muted-foreground">Explora los proyectos de la sede Altagracia.</p>
        </div>
        
        <Link href="/nuevo-proyecto">
          <Button className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </header>
      
      <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50/30">
        <ProjectList projects={proyectos} />
      </main>
    </div>
  );
}