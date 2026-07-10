import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UNEXCA PNF-I ProjectHub',
    short_name: 'UNEXCA PNF-I',
    description: 'Sistema de Registro y Gestión de Proyectos Socio-Tecnológicos PNF Informática',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#020617', // Color oscuro que combina con tu interfaz
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}