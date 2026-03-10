'use client';

import { useState, useMemo } from 'react';
import type { Project } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from './ui/button';
import { Eye, Pencil } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

type TrayectoFilter = 'all' | 'I' | 'II' | 'III' | 'IV';

export function ProjectList({ projects }: { projects: Project[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [trayectoFilter, setTrayectoFilter] = useState<TrayectoFilter>('all');
  const [localityFilter, setLocalityFilter] = useState('');
  
  const uniqueLocalities = useMemo(() => {
    const localities = new Set(projects.map(p => p.locality));
    return ['all', ...Array.from(localities)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesTrayecto =
        trayectoFilter === 'all' || project.trayecto === trayectoFilter;
      const matchesLocality =
        localityFilter === '' || localityFilter === 'all' || project.locality === localityFilter;
      return matchesSearch && matchesTrayecto && matchesLocality;
    });
  }, [projects, searchTerm, trayectoFilter, localityFilter]);

  const statusVariant = (status: Project['status']): 'default' | 'secondary' | 'outline' => {
      switch(status) {
          case 'Completed': return 'default';
          case 'In Progress': return 'secondary';
          case 'Pending': return 'outline';
          default: return 'outline';
      }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Buscar por título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-4">
          <Select
            value={trayectoFilter}
            onValueChange={(value: TrayectoFilter) => setTrayectoFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Trayecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Trayectos</SelectItem>
              <SelectItem value="I">Trayecto I</SelectItem>
              <SelectItem value="II">Trayecto II</SelectItem>
              <SelectItem value="III">Trayecto III</SelectItem>
              <SelectItem value="IV">Trayecto IV</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={localityFilter}
            onValueChange={(value: string) => setLocalityFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Parroquia" />
            </SelectTrigger>
            <SelectContent>
              {uniqueLocalities.map(locality => (
                <SelectItem key={locality} value={locality}>{locality === 'all' ? 'Todas las Parroquias' : locality}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project, index) => {
          const placeholder = PlaceHolderImages[index % PlaceHolderImages.length];
          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                {placeholder && (
                   <div className="relative h-40 w-full mb-4 rounded-t-lg overflow-hidden">
                    <Image
                      src={placeholder.imageUrl}
                      alt={placeholder.description}
                      fill
                      style={{ objectFit: 'cover' }}
                      data-ai-hint={placeholder.imageHint}
                    />
                  </div>
                )}
                <CardTitle>{project.title}</CardTitle>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">Trayecto {project.trayecto}</Badge>
                    <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
                </div>
                <CardDescription className="pt-2 line-clamp-3">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground"><strong>Parroquia:</strong> {project.locality}</p>
                 <p className="text-sm text-muted-foreground"><strong>Equipo:</strong> {project.team.length} integrante(s)</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                 <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
       {filteredProjects.length === 0 && (
          <div className="text-center text-muted-foreground col-span-full py-12">
            No se encontraron proyectos con los filtros actuales.
          </div>
        )}
    </div>
  );
}
