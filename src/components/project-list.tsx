'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Project } from '@/lib/types';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
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
import { Eye, ShieldAlert } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

// IMPORTACIONES DE SEGURIDAD
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type TrayectoFilter = 'all' | 'I' | 'II' | 'III' | 'IV';

export function ProjectList({ projects }: { projects: Project[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [trayectoFilter, setTrayectoFilter] = useState<TrayectoFilter>('all');
  const [localityFilter, setLocalityFilter] = useState('');
  const [esAuditor, setEsAuditor] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().rol === 'auditor') {
            setEsAuditor(true);
          } else {
            setEsAuditor(false);
          }
        } catch (error) {
          console.error("Error verificando rol en lista:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const uniqueLocalities = useMemo(() => {
    // Aquí usamos "parroquia" o "locality" dependiendo de lo que exista en el objeto
    const localities = new Set(projects.map((p: any) => p.parroquia || p.locality));
    return ['all', ...Array.from(localities)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (esAuditor) return [];

    return projects.map((p: any) => ({
      ...p,
      // Normalización: Si el campo existe en inglés úsalo, si no, intenta con español, si no, pon un valor por defecto
      id: p.id,
      title: p.title || p.titulo || "Sin título",
      description: p.description || p.descripcion || "Sin descripción",
      locality: p.locality || p.parroquia || "No especificado",
      trayecto: p.trayecto || "I",
      status: p.status || 'Completed',
      team: p.team || p.equipo || [] // Si no encuentra equipo, devuelve un arreglo vacío
    })).filter((project: any) => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTrayecto = trayectoFilter === 'all' || project.trayecto === trayectoFilter;
      const matchesLocality = localityFilter === '' || localityFilter === 'all' || project.locality === localityFilter;
      
      return matchesSearch && matchesTrayecto && matchesLocality;
    });
  }, [projects, searchTerm, trayectoFilter, localityFilter, esAuditor]);

  const statusVariant = (status: any): 'default' | 'secondary' | 'outline' => {
    switch(status) {
      case 'Completed': return 'default';
      case 'In Progress': return 'secondary';
      case 'Pending': return 'outline';
      default: return 'outline';
    }
  }

  if (esAuditor) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Panel de Control de Auditor</h3>
          <p className="text-muted-foreground text-center max-w-md mt-2">
            Tu acceso está restringido a la supervisión de seguridad y bitácoras.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ... (tus filtros se mantienen iguales) ... */}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project: any, index) => {
          const placeholder = PlaceHolderImages[index % PlaceHolderImages.length];
          // Normalizamos los datos aquí mismo
          const title = project.titulo || project.title || "Sin título";
          const desc = project.descripcion || project.description || "Sin descripción";
          const loc = project.parroquia || project.locality || "No especificado";

          return (
            <Card key={project.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader className="p-0 overflow-hidden rounded-t-lg">
                {placeholder && (
                  <div className="relative h-40 w-full">
                    <Image src={placeholder.imageUrl} alt={desc} fill style={{ objectFit: 'cover' }} sizes="100vw" />
                  </div>
                )}
                <div className="p-6 pb-0">
                  <CardTitle className="line-clamp-1">{title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Badge variant="outline">Trayecto {project.trayecto}</Badge>
                    <Badge variant={statusVariant(project.status)}>{project.status || 'Completado'}</Badge>
                  </div>
                  <CardDescription className="pt-2 line-clamp-3">{desc}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-6 pt-2">
                <p className="text-sm text-muted-foreground"><strong>Parroquia:</strong> {loc}</p>
                <p className="text-sm text-muted-foreground"><strong>Equipo:</strong> {project.team?.length || project.equipo?.length || 0} integrante(s)</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 p-6 pt-0">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}