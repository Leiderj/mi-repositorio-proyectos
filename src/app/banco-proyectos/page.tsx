'use client'; // Permite el uso de hooks de React y la interactividad en el lado del cliente (Next.js)

import { useEffect, useState } from 'react';
// Importaciones de Firestore para bases de datos en tiempo real y consultas por ID
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
// Importación del observador de sesiones de Firebase Auth
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

// Componentes de interfaz (UI) de Shadcn
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Iconos de Lucide React
import { Lightbulb, Code2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Componente hijo encargado de renderizar y procesar el formulario de creación de ideas
import { FormularioIdea } from '@/components/FormularioIdea';

export default function BancoProyectosPage() {
  const router = useRouter();
  
  // Estado para almacenar la lista de ideas obtenidas de Firestore
  const [ideas, setIdeas] = useState<any[]>([]);
  // Estado para guardar el rol del usuario logueado (ej: 'admin', 'user', etc.)
  const [rol, setRol] = useState<string | null>(null);

  /**
   * EFECTO PRINCIPAL
   * Configura las escuchas activas (Listeners) al cargar la página.
   */
  useEffect(() => {
    // 1. CARGAR IDEAS EN TIEMPO REAL
    // Se crea una consulta para apuntar a la colección 'banco_ideas' ordenada por la fecha de creación ('createdAt') descendente
    const q = query(collection(db, 'banco_ideas'), orderBy('createdAt', 'desc'));
    
    // onSnapshot abre un canal "web socket" con Firestore. Cada vez que una idea cambie, se añada o se elimine, 
    // la base de datos enviará una nueva captura (snapshot) automáticamente.
    const unsubscribeIdeas = onSnapshot(q, (snapshot) => {
      // Mapeamos los documentos en tiempo real y actualizamos el estado
      setIdeas(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })));
    });

    // 2. VERIFICAR ROL DEL USUARIO LOGUEADO
    // Escucha activamente si el usuario inicia o cierra sesión
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Si hay un usuario autenticado, busca su información extendida en la colección 'users' usando su UID
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        // Si el documento existe en la base de datos, extraemos y guardamos su rol en el estado
        if (userDoc.exists()) {
          setRol(userDoc.data().rol);
        }
      }
    });

    // FUNCIÓN DE LIMPIEZA (CLEANUP)
    // Es crítico retornar esto. Cuando el usuario cambia de página, React ejecuta estas funciones
    // para apagar las escuchas activas de Auth y Firestore, evitando fugas de memoria y cobros innecesarios en Firebase.
    return () => { 
      unsubscribeIdeas(); 
      unsubscribeAuth(); 
    };
  }, []); // El array vacío asegura que este efecto solo se configure una vez al montar el componente

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Botón superior para navegar hacia la página anterior en el historial del navegador */}
      <Button variant="ghost" onClick={() => router.back()} className="px-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      {/* Título de la sección */}
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Lightbulb className="text-yellow-500" /> Banco de Ideas
      </h1>

      {/* RENDERIZADO CONDICIONAL POR ROL
        Esta es la validación visual. El formulario de creación SOLO se renderizará e inyectará 
        en el DOM si el estado `rol` es exactamente igual a 'admin'. Los usuarios comunes no lo verán.
      */}
      {rol === 'admin' && (
        <div className="bg-slate-50 p-4 border border-dashed rounded-xl">
          <FormularioIdea />
        </div>
      )}

      {/* LISTA DE IDEAS EXISTENTES */}
      <div className="grid gap-4">
        {/* Iteramos sobre el array de ideas para pintar una tarjeta de Shadcn por cada una */}
        {ideas.map((idea) => (
          <Card key={idea.id}>
            <CardHeader>
              <CardTitle className="text-lg">{idea.titulo}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Descripción del problema que resuelve la idea */}
              <p className="text-sm"><strong>Problema:</strong> {idea.problema}</p>
              
              {/* Tecnologías sugeridas para su desarrollo */}
              <p className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                <Code2 size={16} /> {idea.tecnologias}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}