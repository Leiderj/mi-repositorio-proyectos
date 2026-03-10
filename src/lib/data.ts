import type { Project } from './types';

export const projects: Project[] = [
  {
    id: 'proj-001',
    title: 'Sistema de Gestión de Biblioteca',
    description:
      'Desarrollo de un sistema web para la gestión de préstamos, devoluciones y catálogo de libros de la biblioteca de la UNEXCA.',
    generalObjective:
      'Optimizar la gestión de la biblioteca de la UNEXCA mediante un sistema web.',
    specificObjectives: [
      'Analizar los requerimientos del personal de la biblioteca.',
      'Diseñar la arquitectura del sistema y la base de datos.',
      'Implementar los módulos de gestión de libros y usuarios.',
      'Realizar pruebas y desplegar el sistema.',
    ],
    developmentMethod: 'Metodología ágil Scrum',
    locality: 'Altagracia',
    contactPerson: {
      name: 'Maria Rodriguez',
      phone: '04121234567',
      email: 'm.rodriguez@unexca.edu.ve',
    },
    startDate: '2023-09-15',
    endDate: '2024-03-15',
    team: [
      {
        id: 'mem-01',
        name: 'Juan Pérez',
        cedula: '25123456',
        phone: '04141112233',
        email: 'juan.perez@email.com',
      },
      {
        id: 'mem-02',
        name: 'Ana García',
        cedula: '26789012',
        phone: '04164445566',
        email: 'ana.garcia@email.com',
      },
    ],
    files: [],
    trayecto: 'IV',
    status: 'Completed',
  },
  {
    id: 'proj-002',
    title: 'Plataforma de E-learning para PNF-I',
    description:
      'Creación de una plataforma de e-learning para apoyar las materias del Programa Nacional de Formación en Informática.',
    generalObjective:
      'Facilitar el acceso a material de estudio y la interacción entre docentes y estudiantes del PNF-I.',
    specificObjectives: [
      'Desarrollar un módulo para la carga y descarga de material educativo.',
      'Implementar foros de discusión por materia.',
      'Crear un sistema de evaluaciones en línea.',
    ],
    developmentMethod: 'Prototipado Evolutivo',
    locality: 'La Candelaria',
    contactPerson: {
      name: 'Carlos Mendez',
      phone: '04249876543',
      email: 'c.mendez@unexca.edu.ve',
    },
    startDate: '2024-01-20',
    endDate: '2024-07-20',
    team: [
      {
        id: 'mem-03',
        name: 'Luis Martinez',
        cedula: '27123456',
        phone: '04127778899',
        email: 'luis.martinez@email.com',
      },
    ],
    files: [],
    trayecto: 'III',
    status: 'In Progress',
  },
  {
    id: 'proj-003',
    title: 'App Móvil para Reporte Ciudadano',
    description:
      'Aplicación móvil para que los habitantes de la parroquia San Juan puedan reportar incidencias de servicios públicos.',
    generalObjective:
      'Mejorar la comunicación entre los ciudadanos y los entes gubernamentales locales.',
    specificObjectives: [
      'Diseñar una interfaz intuitiva para el reporte de incidencias.',
      'Desarrollar el backend para la recepción y gestión de reportes.',
      'Integrar un mapa para la geolocalización de las incidencias.',
    ],
    developmentMethod: 'Desarrollo Orientado a Objetos',
    locality: 'San Juan',
    contactPerson: {
      name: 'Sofia Castillo',
      phone: '04161239876',
      email: 's.castillo@unexca.edu.ve',
    },
    startDate: '2024-04-01',
    endDate: '2024-10-01',
    team: [
      {
        id: 'mem-04',
        name: 'Pedro Gómez',
        cedula: '28123456',
        phone: '04261112233',
        email: 'pedro.gomez@email.com',
      },
       {
        id: 'mem-05',
        name: 'Laura Fernandez',
        cedula: '27555666',
        phone: '04142223344',
        email: 'laura.fernandez@email.com',
      },
    ],
    files: [],
    trayecto: 'II',
    status: 'Pending',
  },
];
