import { ProjectForm } from '@/components/project-form';

export default function NuevoProyectoPage() {
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <header className="pb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Registrar Trabajo de Grado
        </h1>
        <p className="text-muted-foreground mt-2">
          Completa todos los campos para registrar formalmente el proyecto en el repositorio del PNF-I.
        </p>
      </header>
      
      {/* Esto es lo que llama a tu Mega-Formulario nuevo */}
      <ProjectForm />
      
    </div>
  );
}