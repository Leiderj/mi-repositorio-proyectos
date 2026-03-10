import { ProjectForm } from '@/components/project-form';

export default function NewProjectPage() {
  return (
    <div className="p-4 md:p-6">
      <header className="pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Registrar Nuevo Proyecto</h1>
        <p className="text-muted-foreground">Complete los campos para registrar un nuevo proyecto de PNF-I.</p>
      </header>
      <ProjectForm />
    </div>
  );
}
