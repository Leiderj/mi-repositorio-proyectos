'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase'; 
import { registrarAuditoria } from '@/lib/audit';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, Users, Target, Loader2, MapPin, X, 
  Image as ImageIcon, Edit, Trash2, CheckCircle2, Phone, Mail, UserCircle 
} from 'lucide-react';

export default function ProyectoDetallePage() {
  const params = useParams();
  const router = useRouter();
  
  const [proyecto, setProyecto] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [rol, setRol] = useState<string | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUid(user.uid);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) setRol(userDoc.data().rol);
      }
    });

    const obtenerDetalle = async () => {
      if (!params.id) return;
      try {
        const docRef = doc(db, 'projects', params.id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
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
      } catch (error) { console.error(error); } 
      finally { setCargando(false); }
    };
    obtenerDetalle();
    return () => unsubscribe();
  }, [params.id]);

  const manejarEliminacion = async () => {
    if (confirm("¿Seguro que deseas eliminar este proyecto?")) {
      await deleteDoc(doc(db, 'projects', proyecto.id));
      await registrarAuditoria('ELIMINAR_PROYECTO', `Eliminó: ${proyecto.title}`);
      router.push('/projects');
    }
  };

  if (cargando) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!proyecto) return <div className="p-20 text-center">Proyecto no encontrado</div>;

  const puedeEditar = currentUid && (currentUid === proyecto.userId || rol === 'admin');

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* BARRA DE ACCIONES */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push('/projects')}><ArrowLeft className="mr-2" /> Volver</Button>
        <div className="flex gap-2">
          {puedeEditar && (
            <Button variant="outline" onClick={() => router.push(`/projects/${proyecto.id}/editar`)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
          )}
          {rol === 'admin' && (
            <Button variant="destructive" onClick={manejarEliminacion}>
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* CABECERA */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4">{proyecto.title}</h1>
        <p className="text-xl text-slate-500">{proyecto.description}</p>
      </div>

      {/* CUERPO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-md rounded-3xl">
            <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Target /> Aspectos Técnicos</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <p><strong>Objetivo General:</strong> {proyecto.generalObjective}</p>
              <h4 className="font-bold text-slate-400 uppercase text-xs">Objetivos Específicos</h4>
              <ul className="space-y-2">{proyecto.specificObjectives.map((o: string, i: number) => <li key={i} className="flex gap-2 text-slate-700"><CheckCircle2 className="text-green-500 h-4 w-4" /> {o}</li>)}</ul>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md rounded-3xl">
            <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Users /> Equipo</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {proyecto.team.map((m: any, i: number) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border">{m.nombre} {m.apellido} <p className="text-xs text-slate-500">C.I: {m.cedula}</p></div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-md rounded-3xl">
            <CardHeader><CardTitle className="text-sm uppercase text-slate-400">Ubicación</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-2"><MapPin className="text-primary" /> {proyecto.locality}</CardContent>
          </Card>
          
          {proyecto.contact && (
            <Card className="bg-primary text-white border-none shadow-md rounded-3xl">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><UserCircle /> Contacto</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="font-bold">{proyecto.contact.nombre} {proyecto.contact.apellido}</p>
                <p className="opacity-80 flex items-center gap-2"><Phone size={14}/> {proyecto.contact.telefono}</p>
                <p className="opacity-80 flex items-center gap-2"><Mail size={14}/> {proyecto.contact.correo}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* EVIDENCIAS */}
      {proyecto.images?.length > 0 && (
        <Card className="border-none shadow-md rounded-3xl">
          <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon /> Evidencias</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            {proyecto.images.map((url: string, i: number) => (
              <img key={i} src={url} className="rounded-xl cursor-pointer hover:opacity-80" onClick={() => setImagenAmpliada(url)} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* MODAL */}
      {imagenAmpliada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setImagenAmpliada(null)}>
          <Button variant="ghost" className="absolute top-4 right-4 text-white" onClick={() => setImagenAmpliada(null)}><X /></Button>
          <img src={imagenAmpliada} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}