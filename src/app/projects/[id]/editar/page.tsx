'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { registrarAuditoria } from '@/lib/audit';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Loader2 } from 'lucide-react';

export default function EditarProyectoPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Estado para el formulario expandido
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    generalObjective: '',
    specificObjectives: '', // Se maneja como string en el textarea y se convierte a array al guardar
    developmentMethod: '',
    startDate: '',
    endDate: '',
    locality: '',
    trayecto: 'IV',
    status: 'In Progress'
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const docRef = doc(db, 'projects', params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Llenamos el formulario normalizando los datos de la base de datos
          const rawSpecificObj = data.specificObjectives || data.objetivosEspecificos || [];
          const specificObjString = Array.isArray(rawSpecificObj) ? rawSpecificObj.join('\n') : rawSpecificObj;

          setFormData({
            title: data.title || data.titulo || '',
            description: data.description || data.descripcion || '',
            generalObjective: data.generalObjective || data.objetivoGeneral || '',
            specificObjectives: specificObjString,
            developmentMethod: data.developmentMethod || data.metodologias || data.metodologia || '',
            startDate: data.startDate || data.fechaInicio || '',
            endDate: data.endDate || data.fechaFin || '',
            locality: data.locality || data.parroquia || '',
            trayecto: data.trayecto || 'IV',
            status: data.status || data.estatus || 'In Progress'
          });
        } else {
          toast({ variant: "destructive", title: "Error", description: "Proyecto no encontrado" });
          router.push('/projects');
        }
      } catch (error) {
        console.error("Error al cargar:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [params.id, router, toast]);

  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const docRef = doc(db, 'projects', params.id as string);
      
      // Preparamos los datos antes de guardar (convertir objetivos a array)
      const datosAActualizar = {
        title: formData.title,
        description: formData.description,
        generalObjective: formData.generalObjective,
        specificObjectives: formData.specificObjectives.split('\n').filter(obj => obj.trim() !== ''),
        developmentMethod: formData.developmentMethod,
        startDate: formData.startDate,
        endDate: formData.endDate,
        locality: formData.locality,
        trayecto: formData.trayecto,
        status: formData.status,
        ultimaModificacion: new Date().toISOString(),
        modificadoPor: auth.currentUser?.email
      };

      await updateDoc(docRef, datosAActualizar);
      await registrarAuditoria('UPDATE' as any, `Editó el proyecto: ${formData.title}`);

      toast({ title: "¡Éxito!", description: "Proyecto actualizado correctamente." });
      router.push(`/projects/${params.id}`); 
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Editar Proyecto</CardTitle>
          <CardDescription>Modifica los datos del proyecto y la información técnica.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarGuardar} className="space-y-6">
            
            {/* --- SECCIÓN 1: DATOS BÁSICOS --- */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 text-slate-800">Datos Básicos</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">Título del Proyecto</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción Corta</Label>
                <Textarea id="description" className="min-h-[80px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locality">Parroquia / Localidad</Label>
                  <Input id="locality" value={formData.locality} onChange={(e) => setFormData({...formData, locality: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trayecto">Trayecto</Label>
                  <select 
                    id="trayecto" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.trayecto} 
                    onChange={(e) => setFormData({...formData, trayecto: e.target.value})}
                  >
                    <option value="I">Trayecto I</option>
                    <option value="II">Trayecto II</option>
                    <option value="III">Trayecto III</option>
                    <option value="IV">Trayecto IV</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estatus del Proyecto</Label>
                  <select 
                    id="status" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="In Progress">En Progreso</option>
                    <option value="Pending">Pendiente</option>
                    <option value="Completed">Completado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* --- SECCIÓN 2: ASPECTOS TÉCNICOS --- */}
            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-lg border-b pb-2 text-slate-800">Aspectos Técnicos</h3>
              
              <div className="space-y-2">
                <Label htmlFor="generalObjective">Objetivo General</Label>
                <Textarea id="generalObjective" value={formData.generalObjective} onChange={(e) => setFormData({...formData, generalObjective: e.target.value})} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specificObjectives">Objetivos Específicos (Uno por línea)</Label>
                <Textarea 
                  id="specificObjectives" 
                  className="min-h-[100px]" 
                  placeholder="- Levantar información...&#10;- Diseñar base de datos..." 
                  value={formData.specificObjectives} 
                  onChange={(e) => setFormData({...formData, specificObjectives: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="developmentMethod">Metodología Implementada</Label>
                <Input id="developmentMethod" placeholder="Ej: SCRUM, IAP..." value={formData.developmentMethod} onChange={(e) => setFormData({...formData, developmentMethod: e.target.value})} />
              </div>
            </div>

            {/* --- BOTONES --- */}
            <div className="flex gap-4 pt-6">
              <Button type="submit" className="flex-1" disabled={guardando}>
                {guardando ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}