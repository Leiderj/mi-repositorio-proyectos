// Nota: Este archivo no lleva 'use client' porque no maneja estados (useState) ni efectos (useEffect) locales.
// Se comporta como un Server Component por defecto en Next.js, lo que mejora ligeramente el rendimiento de carga inicial.

// Importación del componente hijo que contiene toda la lógica, validaciones y campos del formulario de registro
import { ProjectForm } from '@/components/project-form';

export default function NuevoProyectoPage() {
  return (
    // CONTENEDOR PRINCIPAL: Establece el fondo gris claro y asegura que ocupe todo el alto de la pantalla (min-h-screen)
    // El padding cambia de forma responsiva: p-4 en móviles y p-6 en pantallas medianas o superiores (md:p-6)
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      
      {/* SECCIÓN DEL ENCABEZADO
          'max-w-4xl mx-auto' centra el contenido y le da un ancho máximo cómodo para la lectura, 
          alineándose perfectamente con el ancho que probablemente maneje el formulario interno.
      */}
      <header className="pb-8 max-w-4xl mx-auto">
        {/* Título Principal de la Acción */}
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Registrar Trabajo de Grado
        </h1>
        
        {/* Texto de soporte o bajada del título con color suavizado (text-muted-foreground) */}
        <p className="text-muted-foreground mt-2">
          Completa todos los campos para registrar formalmente el proyecto en el repositorio del PNF-I.
        </p>
      </header>
      
      {/* INYECCIÓN DEL MEGA-FORMULARIO
          Aquí se monta el componente que encapsula la lógica pesada del sistema:
          - Captura de datos (Título, autores, tutor, trayecto, línea de investigación).
          - Validación de campos obligatorios.
          - Conexión e inserción del documento en la colección de Firebase Firestore.
      */}
      <ProjectForm />
      
    </div>
  );
}