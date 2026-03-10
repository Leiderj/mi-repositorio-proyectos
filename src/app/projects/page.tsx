import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { projects } from '@/lib/data';
import { ProjectList } from '@/components/project-list';

export default function ProjectsPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 md:p-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </header>
      <main className="flex-1 overflow-auto">
        <ProjectList projects={projects} />
      </main>
    </div>
  );
}
