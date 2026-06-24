'use client'; // Convierte el componente en un Client Component para usar hooks de estado, efectos y eventos del navegador

import { useEffect, useState } from 'react';
// Hooks para interceptar los parámetros dinámicos de la ruta de Next.js y controlar el enrutamiento físico
import { useParams, useRouter } from 'next/navigation';
// Métodos de Firestore para apuntar a un documento específico, leerlo o actualizar sus campos parcialmente
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
// Utilidad institucional para asentar la edición total en la bitácora de auditoría
import { registrarAuditoria } from '@/lib/audit';

// Componentes estructurales y atómicos basados en Radix UI y Tailwind (Shadcn/ui)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// Hook para gatillar alertas emergentes temporales en la interfaz
import { useToast } from '@/hooks/use-toast';

// Iconografía de soporte para acciones dinámicas
import { Save, X, Loader2, Plus, Trash2 } from 'lucide-react';

export default function EditarProyectoPage() {
  const params = useParams(); // Extrae el ID del proyecto de la URL dinámica
  const router = useRouter();
  const { toast } = useToast();

  // Estados booleanos para controlar los flujos de espera visual en la pantalla
  const [cargando, setCargando] = useState(true);   // Bloquea los inputs mientras descarga el documento inicial
  const [guardando, setGuardando] = useState(false); // Deshabilita botones durante el envío de datos a Firebase
  
  /**
   * ESTADO GLOBAL DEL FORMULARIO EXPANDIDO
   * Contiene absolutamente todos los campos primitivos, así como las estructuras
   * de datos complejas (arreglos y objetos) para permitir una edición 100% integral.
   */
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    generalObjective: '',
    specificObjectives: '', 
    developmentMethod: '',
    startDate: '',
    endDate: '',
    locality: '',
    trayecto: 'IV',
    status: 'In Progress',
    // Estructuras de datos añadidas para la gestión total:
    team: [] as Array<{ nombre: string; apellido: string; cedula: string }>, // Listado de estudiantes
    contact: { nombre: '', apellido: '', telefono: '', correo: '' },        // Datos del vocero comunitario
    images: [] as string[] // Conserva las referencias URL de las evidencias fotográficas ya cargadas
  });

  /**
   * EFECTO DE RECUPERACIÓN INICIAL (Hydration)
   * Descarga la data del documento de Firestore y mapea de forma segura todas las variables.
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const docRef = doc(db, 'projects', params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Retrocompatibilidad lingüística: Une los objetivos si vienen en array desde la Base de Datos
          const rawSpecificObj = data.specificObjectives || data.objetivosEspecificos || [];
          const specificObjString = Array.isArray(rawSpecificObj) ? rawSpecificObj.join('\n') : rawSpecificObj;

          // Setea el estado unificado con los datos recuperados o con valores por defecto seguros
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
            status: data.status || data.estatus || 'In Progress',
            // Recupera las colecciones y objetos anidados mapeando variantes de versiones antiguas
            team: data.team || data.equipo || [],
            contact: data.contact || data.contactPerson || data.contactoComunitario || { nombre: '', apellido: '', telefono: '', correo: '' },
            images: data.images || data.imagenes || []
          });
        } else {
          // Si el ID es inválido o no existe, notifica y expulsa al usuario
          toast({ variant: "destructive", title: "Error", description: "Proyecto no encontrado" });
          router.push('/projects');
        }
      } catch (error) {
        console.error("Error al cargar el documento:", error);
      } finally {
        setCargando(false); // Apaga el spinner global de carga
      }
    };

    cargarDatos();
  }, [params.id, router, toast]);

  // =========================================================================
  // --- MANEJADORES DINÁMICOS PARA EL EQUIPO DE ESTUDIANTES (ARRAYS) ---
  // =========================================================================

  /**
   * Actualiza una propiedad específica (nombre, apellido, cédula) de un integrante indexado.
   */
  const cambiarMiembroEquipo = (index: number, campo: string, valor: string) => {
    const nuevoEquipo = [...formData.team]; // Clona el arreglo actual para evitar mutación directa del estado
    nuevoEquipo[index] = { ...nuevoEquipo[index], [campo]: valor }; // Sobrescribe el campo específico del estudiante
    setFormData({ ...formData, team: nuevoEquipo }); // Actualiza el estado principal
  };

  /**
   * Agrega un nuevo objeto de estudiante vacío al arreglo del equipo.
   */
  const agregarMiembroEquipo = () => {
    setFormData({
      ...formData,
      team: [...formData.team, { nombre: '', apellido: '', cedula: '' }] // Desestructura el equipo previo e inyecta un molde limpio
    });
  };

  /**
   * Elimina un estudiante del equipo basándose en su índice de posición.
   */
  const eliminarMiembroEquipo = (index: number) => {
    // Filtra el arreglo excluyendo el elemento cuyo índice coincide con el seleccionado
    const nuevoEquipo = formData.team.filter((_, i) => i !== index);
    setFormData({ ...formData, team: nuevoEquipo });
  };

  // =========================================================================
  // --- PROCESAMIENTO Y ENVÍO DE DATOS DE VUELTA A FIRESTORE ---
  // =========================================================================
  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault(); // Cancela la recarga nativa de la página al enviar el formulario
    setGuardando(true);  // Enciende el spinner visual en el botón de submit

    try {
      const docRef = doc(db, 'projects', params.id as string);
      
      // Procesa y limpia las entradas de texto antes de impactar la base de datos
      const datosAActualizar = {
        title: formData.title,
        description: formData.description,
        generalObjective: formData.generalObjective,
        // Convierte el texto libre del textarea de objetivos en un Array real de JavaScript separado por líneas
        specificObjectives: formData.specificObjectives.split('\n').filter(obj => obj.trim() !== ''),
        developmentMethod: formData.developmentMethod,
        startDate: formData.startDate,
        endDate: formData.endDate,
        locality: formData.locality,
        trayecto: formData.trayecto,
        status: formData.status,
        team: formData.team,         // Persiste los cambios dinámicos hechos en el equipo
        contact: formData.contact,   // Persiste los datos modificados del contacto comunitario
        images: formData.images,     // Mantiene intacto el arreglo de urls de imágenes existentes
        
        // Metadatos de auditoría institucional para saber cuándo y quién actualizó
        ultimaModificacion: new Date().toISOString(),
        modificadoPor: auth.currentUser?.email
      };

      // Sobrescribe únicamente los campos declarados en el documento de Firestore sin borrar propiedades externas
      await updateDoc(docRef, datosAActualizar);
      // Asienta la acción de modificación masiva en la bitácora del sistema
      await registrarAuditoria('UPDATE' as any, `Editó por completo el proyecto: ${formData.title}`);

      toast({ title: "¡Éxito!", description: "Proyecto actualizado con todos sus campos correctamente." });
      router.push(`/projects/${params.id}`); // Redirige de vuelta a la vista de detalle para ver los cambios
    } catch (error) {
      console.error("Error al actualizar el proyecto global:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
      setGuardando(false); // Libera los botones
    }
  };

  // Renderizado condicional de bloqueo mientras se espera la respuesta asíncrona de Firebase
  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Editar Proyecto Global</CardTitle>
          <CardDescription>Modifica absolutamente todos los campos e información técnica del proyecto.</CardDescription>
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

            {/* --- SECCIÓN 3: INTEGRANTES DEL EQUIPO FASE DINÁMICA --- */}
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-lg text-slate-800">Estudiantes Integrantes</h3>
                {/* Al pulsar, inyecta una nueva fila vacía en la UI */}
                <Button type="button" size="sm" variant="outline" onClick={agregarMiembroEquipo} className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Añadir Integrante
                </Button>
              </div>

              {formData.team.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No hay integrantes registrados en este equipo.</p>
              ) : (
                <div className="space-y-4">
                  {/* Mapea dinámicamente cada estudiante inyectado en el estado del componente */}
                  {formData.team.map((miembro, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end bg-slate-50 p-3 rounded-xl border relative">
                      <div>
                        <Label className="text-xs">Nombre</Label>
                        <Input value={miembro.nombre} onChange={(e) => cambiarMiembroEquipo(index, 'nombre', e.target.value)} required />
                      </div>
                      <div>
                        <Label className="text-xs">Apellido</Label>
                        <Input value={miembro.apellido} onChange={(e) => cambiarMiembroEquipo(index, 'apellido', e.target.value)} required />
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Label className="text-xs">Cédula</Label>
                          <Input value={miembro.cedula} onChange={(e) => cambiarMiembroEquipo(index, 'cedula', e.target.value)} required />
                        </div>
                        {/* Botón de remoción física de la fila */}
                        <Button type="button" variant="ghost" size="icon" onClick={() => eliminarMiembroEquipo(index)} className="text-red-500 hover:text-red-700 mt-5">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- SECCIÓN 4: CONTACTO / VOCERO COMUNITARIO (GESTIÓN ANIDADA) --- */}
            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-lg border-b pb-2 text-slate-800">Contacto / Vocero Comunitario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cada campo de esta sección desestructura el objeto contact previo para modificar sólo la llave correspondiente */}
                <div className="space-y-2">
                  <Label htmlFor="contactNombre">Nombre Vocero</Label>
                  <Input 
                    id="contactNombre" 
                    value={formData.contact.nombre} 
                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, nombre: e.target.value } })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactApellido">Apellido Vocero</Label>
                  <Input 
                    id="contactApellido" 
                    value={formData.contact.apellido} 
                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, apellido: e.target.value } })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactTelefono">Teléfono de Contacto</Label>
                  <Input 
                    id="contactTelefono" 
                    placeholder="04XX-XXXXXXX"
                    value={formData.contact.telefono} 
                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, telefono: e.target.value } })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactCorreo">Correo Electrónico</Label>
                  <Input 
                    id="contactCorreo" 
                    type="email"
                    value={formData.contact.correo} 
                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, correo: e.target.value } })} 
                  />
                </div>
              </div>
            </div>

            {/* --- BOTONES DE CONTROL GENERAL --- */}
            <div className="flex gap-4 pt-6">
              {/* Bloquea el envío si se está procesando en segundo plano para evitar spam duplicado a Firebase */}
              <Button type="submit" className="flex-1" disabled={guardando}>
                {guardando ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios Totales
              </Button>
              {/* Retorna al usuario al historial de navegación previo sin guardar alteraciones */}
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