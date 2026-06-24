'use client'; // Convierte el archivo en un Client Component, habilitando el estado, efectos e interactividad del navegador

import { useEffect, useState } from 'react';
// Hooks para interceptar los parámetros dinámicos de la ruta (/projects/[id]) y controlar el enrutamiento
import { useParams, useRouter } from 'next/navigation';
// Métodos de Firestore para referenciar, leer y eliminar físicamente documentos de la base de datos
import { doc, getDoc, deleteDoc } from 'firebase/firestore'; 
// Observador para seguir el estado de la sesión de los usuarios en tiempo real
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase'; 
// Función nativa del sistema para auditar operaciones de borrado
import { registrarAuditoria } from '@/lib/audit';

// Componentes estructurales de Shadcn/ui para organizar la información en tarjetas cohesivas
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Set de iconos semánticos de Lucide React para enriquecer visualmente el perfil técnico del proyecto
import { 
  ArrowLeft, Users, Target, Loader2, MapPin, X, 
  Image as ImageIcon, Edit, Trash2, CheckCircle2, Phone, Mail, UserCircle 
} from 'lucide-react';

export default function ProyectoDetallePage() {
  const params = useParams(); // Captura el ID único del proyecto inyectado en la barra de direcciones
  const router = useRouter();
  
  // Estados locales para la gestión de datos, interfaz y sesión
  const [proyecto, setProyecto] = useState<any>(null);               // Almacena el objeto estructurado del proyecto
  const [cargando, setCargando] = useState(true);                   // Controla la pantalla global de espera
  const [rol, setRol] = useState<string | null>(null);               // Almacena el privilegio del usuario actual ('admin', 'auditor', etc.)
  const [currentUid, setCurrentUid] = useState<string | null>(null); // UID del usuario autenticado para validar autoría
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null); // Controla la URL de la imagen activa en el modal lightbox

  /**
   * EFECTO ÚNICO DE CARGA Y AUTENTICACIÓN
   * Sincroniza al usuario activo y descarga de forma asíncrona la data del proyecto.
   */
  useEffect(() => {
    // 1. Sincronización de Sesión y Rol
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUid(user.uid);
        // Extrae el rol institucional directo desde su perfil en la colección 'users'
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) setRol(userDoc.data().rol);
      }
    });

    // 2. Extracción Asíncrona del Proyecto
    const obtenerDetalle = async () => {
      if (!params.id) return;
      try {
        const docRef = doc(db, 'projects', params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // --- NORMALIZACIÓN DE ESQUEMAS DE DATOS (Retrocompatibilidad) ---
          // Mapea y unifica llaves que puedan estar escritas en inglés o español según la versión de registro
          setProyecto({ 
            id: docSnap.id, 
            ...data,
            title: data.title || data.titulo || 'Sin título',
            description: data.description || data.descripcion || '',
            generalObjective: data.generalObjective || data.objetivoGeneral || 'No definido',
            specificObjectives: data.specificObjectives || data.objetivosEspecificos || [],
            team: data.team || data.equipo || [],
            locality: data.locality || data.parroquia || 'No especificada',
            contact: data.contactPerson || data.contactoComunitario || null,
            images: data.imagenes || data.images || []
          });
        }
      } catch (error) { 
        console.error("Error al recuperar el detalle del proyecto:", error); 
      } finally { 
        setCargando(false); // Libera la interfaz apagando el spinner
      }
    };

    obtenerDetalle();
    
    // Cleanup del observador de autenticación al desmontar la vista
    return () => unsubscribe();
  }, [params.id]);

  /**
   * MANEJADOR DE ELIMINACIÓN DE REGISTROS
   * Solicita confirmación explícita nativa, remueve el documento en Firestore,
   * asienta la acción en la bitácora de auditoría e informa al Router.
   */
  const manejarEliminacion = async () => {
    if (confirm("¿Seguro que deseas eliminar este proyecto?")) {
      try {
        await deleteDoc(doc(db, 'projects', proyecto.id));
        // Registra el evento de borrado con fines de auditoría informática
        await registrarAuditoria('ELIMINAR_PROYECTO', `Eliminó: ${proyecto.title}`);
        router.push('/projects');
      } catch (error) {
        console.error("Error en la eliminación física del proyecto:", error);
      }
    }
  };

  // RENDERIZADO CONDICIONAL DE ENTRADA (Pantalla de carga o registro inexistente)
  if (cargando) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!proyecto) return <div className="p-20 text-center text-slate-500">Proyecto no encontrado</div>;

  /**
   * REGLA DE NEGOCIO PARA COMPORTAMIENTO DE UI (Lógica de Permisos)
   * Un usuario puede editar el contenido si: es el creador original del documento (`userId`) 
   * O posee el rango supremo de administrador global (`admin`).
   */
  const puedeEditar = currentUid && (currentUid === proyecto.userId || rol === 'admin');

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      
      {/* BARRA DE ACCIONES SUPERIOR */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push('/projects')}>
          <ArrowLeft className="mr-2" /> Volver
        </Button>
        <div className="flex gap-2">
          {/* Muestra el botón 'Editar' solo si pasa la validación de autoría o administración */}
          {puedeEditar && (
            <Button variant="outline" onClick={() => router.push(`/projects/${proyecto.id}/editar`)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
          )}
          {/* El botón 'Eliminar' queda estrictamente restringido al rol 'admin' */}
          {rol === 'admin' && (
            <Button variant="destructive" onClick={manejarEliminacion}>
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* CABECERA PRINCIPAL: TÍTULO Y RESUMEN DEL PROYECTO */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4">{proyecto.title}</h1>
        <p className="text-xl text-slate-500 leading-relaxed">{proyecto.description}</p>
      </div>

      {/* CUERPO PRINCIPAL (Layout Asimétrico: 2 Columnas de información técnica, 1 de metadatos laterales) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* BLOQUE IZQUIERDO: ASPECTOS TÉCNICOS Y INTEGRANTES */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Tarjeta 1: Objetivos del Trabajo de Grado */}
          <Card className="border-none shadow-md rounded-3xl bg-white">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Target /> Aspectos Técnicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-700"><strong>Objetivo General:</strong> {proyecto.generalObjective}</p>
              <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider">Objetivos Específicos</h4>
              <ul className="space-y-2">
                {proyecto.specificObjectives.map((o: string, i: number) => (
                  <li key={i} className="flex gap-2 text-slate-700 items-start">
                    <CheckCircle2 className="text-green-500 h-4 w-4 mt-1 shrink-0" /> 
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          {/* Tarjeta 2: Equipo de Estudiantes Desarrolladores */}
          <Card className="border-none shadow-md rounded-3xl bg-white">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Users /> Equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proyecto.team.map((m: any, i: number) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="font-medium text-slate-800">{m.nombre} {m.apellido}</span>
                  <p className="text-xs text-slate-500 mt-1">C.I: {m.cedula}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* BLOQUE DERECHO: METADATOS COMUNITARIOS */}
        <div className="space-y-8">
          {/* Tarjeta de Ubicación Geográfica del Proyecto */}
          <Card className="border-none shadow-md rounded-3xl bg-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase text-slate-400 tracking-wider">Ubicación / Parroquia</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-slate-700 font-medium">
              <MapPin className="text-primary shrink-0" /> {proyecto.locality}
            </CardContent>
          </Card>
          
          {/* Tarjeta de Contacto con el Vocero o Tutor Comunitario (Renderizado Condicional) */}
          {proyecto.contact && (
            <Card className="bg-primary text-white border-none shadow-md rounded-3xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserCircle /> Contacto Comunitario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-bold text-lg">{proyecto.contact.nombre} {proyecto.contact.apellido}</p>
                <p className="opacity-90 flex items-center gap-2 text-sm"><Phone size={14} className="shrink-0"/> {proyecto.contact.telefono}</p>
                <p className="opacity-90 flex items-center gap-2 text-sm"><Mail size={14} className="shrink-0"/> {proyecto.contact.correo}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* GALERÍA DE EVIDENCIAS FOTOGRÁFICAS (Mesa de Trabajo / Pruebas de Implantación) */}
      {proyecto.images?.length > 0 && (
        <Card className="border-none shadow-md rounded-3xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon /> Evidencias del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {proyecto.images.map((url: string, i: number) => (
              <div key={i} className="overflow-hidden rounded-xl aspect-video bg-slate-100 border">
                <img 
                  src={url} 
                  alt={`Evidencia ${i + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200" 
                  onClick={() => setImagenAmpliada(url)} // Monta la imagen en el visor ampliado
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* INTERFAZ MODAL (LIGHTBOX DE IMAGEN)
          Se renderiza fuera del flujo normal usando posicionamiento fijo en pantalla.
          Permite apreciar los diagramas o capturas de pantalla a tamaño completo.
      */}
      {imagenAmpliada && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200" 
          onClick={() => setImagenAmpliada(null)} // Cierra el modal al pulsar en cualquier sección del fondo oscuro
        >
          {/* Botón de Cierre */}
          <Button 
            variant="ghost" 
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full h-10 w-10 p-0" 
            onClick={() => setImagenAmpliada(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          {/* Contenedor de la imagen responsiva ampliada */}
          <img 
            src={imagenAmpliada} 
            alt="Evidencia Ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
          />
        </div>
      )}
    </div>
  );
}