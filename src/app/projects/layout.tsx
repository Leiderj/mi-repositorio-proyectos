// Al no incluir 'use client', este archivo se procesa en el servidor (Server Component), 
// lo que ayuda a que la estructura compartida cargue de forma ultra rápida.

// Importación del componente que renderiza la barra de navegación lateral de la aplicación (ProjectHub)
import { MainSidebar } from '@/components/main-sidebar';

/**
 * COMPONENTE DE DISEÑO (LAYOUT) DE PROYECTOS
 * * Recibe una propiedad especial de React llamada 'children' (los componentes hijos).
 * TypeScript requiere que definamos su tipo explicitando que es un 'React.ReactNode'.
 */
export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode; // Representa a cualquier elemento válido de React (páginas, contenedores, etc.)
}) {
  return (
    /* ENCAPSULAMIENTO DE LA INTERFAZ:
      Envolvemos las páginas secundarias dentro del contenedor 'MainSidebar'.
      
      Esto significa que pantallas como /projects, /projects/nuevo o /projects/[id] 
      se inyectarán automáticamente en el lugar donde está la palabra '{children}', 
      manteniendo la barra lateral fija en su lugar a la izquierda de la pantalla.
    */
    <MainSidebar>
      {children} 
    </MainSidebar>
  );
}