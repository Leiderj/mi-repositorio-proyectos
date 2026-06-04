'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; 
import { registrarAuditoria } from '@/lib/audit';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Trash2, ArrowLeft, BookOpen, Target, 
  Users, Image as ImageIcon, Phone, Loader2, CheckCircle 
} from 'lucide-react';

export function ProjectForm() {
  const router = useRouter();
  
  // 1. Datos Básicos
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [trayecto, setTrayecto] = useState('IV');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [parroquia, setParroquia] = useState('');
  
  // 2. Datos del Contacto
  const [contacto, setContacto] = useState({ nombre: '', apellido: '', telefono: '', correo: '' });
  
  // 3. Aspectos Técnicos
  const [objetivoGeneral, setObjetivoGeneral] = useState('');
  const [objetivosEspecificos, setObjetivosEspecificos] = useState('');
  const [metodologias, setMetodologias] = useState('');

  // 4. Equipo de Proyecto
  const [equipo, setEquipo] = useState([{ nombre: '', apellido: '', cedula: '', email: '', redes: '' }]);

  // 5. Imágenes y Previsualización (NUEVO)
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Manejador de previsualización de imágenes
  const manejarSeleccionImagenes = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const archivos = Array.from(e.target.files);
      setImagenesSeleccionadas(archivos);
      
      // Crear URLs temporales para mostrar las miniaturas
      const urls = archivos.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  // Funciones Equipo
  const agregarMiembro = () => setEquipo([...equipo, { nombre: '', apellido: '', cedula: '', email: '', redes: '' }]);
  const eliminarMiembro = (index: number) => setEquipo(equipo.filter((_, i) => i !== index));
  const actualizarMiembro = (index: number, campo: string, valor: string) => {
    const nuevoEquipo = [...equipo];
    nuevoEquipo[index] = { ...nuevoEquipo[index], [campo]: valor };
    setEquipo(nuevoEquipo);
  };

  const guardarProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: 'info', texto: 'Iniciando registro...' });

    if (!auth.currentUser) {
      setMensaje({ tipo: 'error', texto: 'Error: Tu sesión expiró o no estás logueado.' });
      setCargando(false);
      return;
    }

    try {
      // PASO A: Subir las imágenes a ImgBB
      const urlsImagenes: string[] = [];
      if (imagenesSeleccionadas.length > 0) {
        setMensaje({ tipo: 'info', texto: 'Subiendo imágenes y evidencias...' });
        
        for (const imagen of imagenesSeleccionadas) {
          const formData = new FormData();
          formData.append('image', imagen);
          const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY; 
          
          const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          if (data.success) {
            urlsImagenes.push(data.data.url);
          } else {
            throw new Error("Error al subir la imagen a ImgBB");
          }
        }
      } 

      // PASO B: Guardar en Firestore
      setMensaje({ tipo: 'info', texto: 'Estructurando proyecto en la base de datos...' });
      
      await addDoc(collection(db, 'projects'), {
        userId: auth.currentUser.uid,
        titulo,
        descripcion,
        trayecto,
        fechaInicio,
        fechaFin,
        parroquia,
        contactoComunitario: contacto,
        objetivoGeneral,
        objetivosEspecificos: objetivosEspecificos.split('\n').filter(obj => obj.trim() !== ''),
        metodologias,
        equipo,
        imagenes: urlsImagenes,
        fecha_subida: serverTimestamp(),
        estatus: 'In Progress' // Por defecto empieza "En progreso"
      });
      
      await registrarAuditoria('CREAR_PROYECTO', `Registró el Trabajo de Grado: ${titulo}`);

      setMensaje({ tipo: 'exito', texto: '¡Proyecto de grado registrado exitosamente!' });
      
      setTimeout(() => {
        router.push('/projects');
      }, 2000);

    } catch (error: any) {
      console.error("🚨 Error detallado:", error);
      setMensaje({ tipo: 'error', texto: `Fallo en el sistema: ${error.message}` });
    } finally {
      setCargando(false); 
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* --- BOTÓN DE RETROCESO (NUEVO) --- */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="shadow-sm hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>

      <Card className="shadow-xl border-slate-200">
        <CardHeader className="bg-slate-50 border-b pb-6 rounded-t-xl">
          <CardTitle className="text-3xl text-slate-800">Registrar Trabajo de Grado</CardTitle>
          <CardDescription className="text-base text-slate-500">
            Completa todos los campos para añadir tu proyecto al repositorio formal del PNF-I.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={guardarProyecto}>
          <CardContent className="space-y-10 pt-8">
            
            {mensaje.texto && (
              <div className={`p-4 font-bold rounded-lg flex items-center gap-3 border ${
                mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border-green-200' : 
                mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {mensaje.tipo === 'exito' ? <CheckCircle className="h-5 w-5" /> : 
                 mensaje.tipo === 'error' ? <Trash2 className="h-5 w-5" /> : 
                 <Loader2 className="h-5 w-5 animate-spin" />}
                {mensaje.texto}
              </div>
            )}

            {/* --- SECCIÓN 1 --- */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-800">1. Datos Básicos del Proyecto</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="titulo">Título del Proyecto</Label>
                  <Input id="titulo" placeholder="Ej: Sistema web para el control de..." value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea id="descripcion" className="min-h-[80px]" placeholder="Breve resumen del proyecto..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trayecto">Trayecto</Label>
                  <select id="trayecto" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={trayecto} onChange={(e) => setTrayecto(e.target.value)}>
                    <option value="I">Trayecto I</option><option value="II">Trayecto II</option><option value="III">Trayecto III</option><option value="IV">Trayecto IV</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parroquia">Localidad (Parroquia)</Label>
                  <Input id="parroquia" placeholder="Ej: Altagracia" value={parroquia} onChange={(e) => setParroquia(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                  <Input id="fechaInicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha de Fin</Label>
                  <Input id="fechaFin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
                </div>
              </div>
            </section>

            {/* --- SECCIÓN 2 --- */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-2">
                <Phone className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-800">2. Enlace Comunitario</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 p-4 rounded-lg border">
                <div className="space-y-2"><Label>Nombre</Label><Input value={contacto.nombre} onChange={(e) => setContacto({...contacto, nombre: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Apellido</Label><Input value={contacto.apellido} onChange={(e) => setContacto({...contacto, apellido: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Teléfono</Label><Input placeholder="0414-1234567" value={contacto.telefono} onChange={(e) => setContacto({...contacto, telefono: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Correo Electrónico</Label><Input type="email" placeholder="ejemplo@correo.com" value={contacto.correo} onChange={(e) => setContacto({...contacto, correo: e.target.value})} required /></div>
              </div>
            </section>

            {/* --- SECCIÓN 3 --- */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-2">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-800">3. Aspectos Técnicos</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Objetivo General</Label>
                  <Textarea className="min-h-[60px]" value={objetivoGeneral} onChange={(e) => setObjetivoGeneral(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Objetivos Específicos (Uno por línea)</Label>
                  <Textarea className="min-h-[100px]" placeholder="- Levantar información...&#10;- Diseñar base de datos..." value={objetivosEspecificos} onChange={(e) => setObjetivosEspecificos(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Metodologías Implementadas</Label>
                  <Input placeholder="Ej: SCRUM, Investigación Acción Participativa (IAP)..." value={metodologias} onChange={(e) => setMetodologias(e.target.value)} required />
                </div>
              </div>
            </section>

            {/* --- SECCIÓN 4 --- */}
            <section className="space-y-6">
              <div className="flex justify-between items-end border-b pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-slate-800">4. Equipo de Proyecto</h2>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={agregarMiembro} className="shadow-sm">
                  <Plus className="h-4 w-4 mr-1" /> Añadir
                </Button>
              </div>
              
              <div className="space-y-4">
                {equipo.map((miembro, index) => (
                  <div key={index} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm relative group transition-all hover:shadow-md">
                    {equipo.length > 1 && (
                      <Button type="button" variant="destructive" size="icon" className="absolute top-3 right-3 h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity" onClick={() => eliminarMiembro(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Integrante {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Nombre</Label><Input value={miembro.nombre} onChange={(e) => actualizarMiembro(index, 'nombre', e.target.value)} required /></div>
                      <div className="space-y-2"><Label>Apellido</Label><Input value={miembro.apellido} onChange={(e) => actualizarMiembro(index, 'apellido', e.target.value)} required /></div>
                      <div className="space-y-2"><Label>Cédula</Label><Input value={miembro.cedula} onChange={(e) => actualizarMiembro(index, 'cedula', e.target.value)} required /></div>
                      <div className="space-y-2"><Label>Correo</Label><Input type="email" value={miembro.email} onChange={(e) => actualizarMiembro(index, 'email', e.target.value)} required /></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* --- SECCIÓN 5: IMÁGENES DINÁMICAS (NUEVO) --- */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-800">5. Evidencias Visuales</h2>
              </div>
              <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 text-center">
                <Label htmlFor="imagenes" className="cursor-pointer block">
                  <div className="bg-white border rounded-md p-4 max-w-sm mx-auto shadow-sm hover:bg-slate-100 transition-colors">
                    <ImageIcon className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <span className="text-primary font-medium">Haz clic para buscar fotos</span>
                    <p className="text-xs text-slate-500 mt-1">Soporta JPG, PNG (Puedes seleccionar varias)</p>
                  </div>
                </Label>
                <Input 
                  id="imagenes"
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={manejarSeleccionImagenes} 
                  className="hidden" // Ocultamos el input feo nativo
                />
                
                {/* GALERÍA DE PREVISUALIZACIÓN */}
                {previewUrls.length > 0 && (
                  <div className="pt-4">
                    <p className="text-sm font-medium text-slate-700 mb-3 text-left">Imágenes seleccionadas ({previewUrls.length}):</p>
                    <div className="flex flex-wrap gap-3">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-white shadow-md">
                          <img src={url} alt={`Preview ${i}`} className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

          </CardContent>
          
          <CardFooter className="bg-slate-50 p-6 border-t rounded-b-xl flex gap-4">
            <Button type="button" variant="outline" className="w-1/3 h-12" onClick={() => router.back()} disabled={cargando}>
              Cancelar
            </Button>
            <Button type="submit" className="w-2/3 text-lg h-12 shadow-md hover:shadow-lg transition-shadow" disabled={cargando}>
              {cargando ? (
                <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Procesando información...</>
              ) : 'Registrar Proyecto'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}