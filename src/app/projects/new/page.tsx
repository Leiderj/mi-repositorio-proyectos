// Nota: Al no incluir la directiva 'use client', Next.js interpreta este archivo como un Server Component por defecto.
// Esto optimiza el rendimiento, ya que el HTML base del encabezado se genera en el servidor y no requiere JavaScript en el cliente.

// Importación del componente que encapsula todo el formulario real (campos, estados, validaciones e inserción en Firestore)
import { ProjectForm } from '@/components/project-form';

export default function NewProjectPage() {
  return (
    // CONTENEDOR PRINCIPAL: Define un espaciado (padding) adaptativo.
    // En dispositivos móviles aplica 'p-4' y en pantallas medianas o superiores escala a 'p-6' mediante el breakpoint 'md:'
    <div className="p-4 md:p-6">
      
      {/* SECCIÓN DEL ENCABEZADO (Semántica HTML5)
          Aplica un padding inferior (pb-6) para separar visualmente el título del inicio del formulario.
      */}
      <header className="pb-6">
        {/* Título de la página con tipografía grande (text-3xl), negrita (font-bold) y tracking condensado (tracking-tight) */}
        <h1 className="text-3xl font-bold tracking-tight">
          Registrar Nuevo Proyecto
        </h1>
        
        {/* Descripción secundaria estilizada con un color suavizado o atenuado (text-muted-foreground) */}
        <p className="text-muted-foreground">
          Complete los campos para registrar un nuevo proyecto de PNF-I.
        </p>
      </header>
      
      {/* INYECCIÓN DEL COMPONENTE FORMULARIO
          Aquí se procesa toda la carga interactiva: inputs de texto, selección de trayectos,
          adición de integrantes del equipo y el envío final de los datos hacia la base de datos de Firebase.
      */}
      <ProjectForm />
      
    </div>
  );
}