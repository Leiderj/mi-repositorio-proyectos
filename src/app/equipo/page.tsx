'use client'; // Indica que el componente se ejecuta en el navegador (permite interactividad y el uso de librerías del lado del cliente)

import { useRouter } from 'next/navigation';
// Importación del componente que dibuja los códigos QR en un elemento <canvas> HTML5 de forma local
import { QRCodeCanvas } from 'qrcode.react'; 

// Componentes de interfaz (UI) de Shadcn para estructurar las tarjetas
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Colección de iconos vectoriales de Lucide React
import { ArrowLeft, Twitter, Instagram } from 'lucide-react';

export default function EquipoPage() {
  const router = useRouter();

  /**
   * MATRIZ DE DATOS (Array de Objetos)
   * Contiene la información estática de los integrantes del equipo.
   * Centralizar los datos aquí facilita añadir o editar miembros en el futuro sin tocar el HTML/JSX.
   */
  const integrantes = [
    {
      nombre: "Tu Nombre", // Aquí va tu nombre real al compilar
      rol: "Desarrollador Principal",
      descripcion: "Estudiante de Ingeniería en Informática en la UNEXCA Sede Altagracia. Encargado de la arquitectura de la base de datos y la lógica del sistema.",
      correo: "ing.leiderjimenezb@gmail.com",
      redSocial: "Instagram",
      enlaceQR: "https://www.instagram.com/ing.leiderjimenez", 
    },
    {
      nombre: "Rafael Guevara",
      rol: "Analista de Sistemas / Frontend",
      descripcion: "Encargado del diseño de la interfaz, experiencia de usuario y documentación del proyecto socio-tecnológico.",
      correo: "ing.rafaelnguevara@gmail.com",
      redSocial: "X",
      enlaceQR: "https://x.com/rafaeln_guevara",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Botón superior para regresar a la página anterior utilizando el historial del enrutador de Next.js */}
        <Button variant="ghost" onClick={() => router.back()} className="px-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
        </Button>

        {/* CONTENEDOR GRID
            Distribuye el espacio: 1 columna en pantallas móviles y 2 columnas (`md:grid-cols-2`) en pantallas medianas o grandes
        */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Iteración de la matriz: Genera una tarjeta `<Card>` independiente por cada objeto dentro de 'integrantes' */}
          {integrantes.map((persona, idx) => (
            <Card key={idx} className="border-t-4 border-t-primary shadow-sm flex flex-col">
              
              {/* Encabezado de la Tarjeta: Nombre, Rol y Enlace Directo al Correo Electrónico */}
              <CardHeader>
                <CardTitle>{persona.nombre}</CardTitle>
                <p className="text-sm text-slate-500">{persona.rol}</p>
                {/* El prefijo mailto: abre automáticamente el gestor de correos predeterminado del sistema operativo */}
                <a href={`mailto:${persona.correo}`} className="text-xs text-blue-600 hover:underline">
                  {persona.correo}
                </a>
              </CardHeader>
              
              {/* Cuerpo de la Tarjeta */}
              <CardContent className="flex flex-col items-center gap-4">
                <p className="text-sm text-slate-600">{persona.descripcion}</p>
                
                {/* CONTENEDOR DEL CÓDIGO QR
                    Generado localmente mediante operaciones matemáticas en el navegador, garantizando privacidad y velocidad
                */}
                <div className="bg-white p-2 border rounded-lg shadow-sm">
                  <QRCodeCanvas 
                    value={persona.enlaceQR} // El enlace o texto que codificará el QR
                    size={120}               // Tamaño del QR en píxeles (ancho y alto)
                    level={"H"}              // Nivel de Corrección de Errores Alto (High - ~30%). Permite que el QR funcione aunque esté ligeramente dañado o distorsionado
                    includeMargin={true}     // Añade un borde blanco de seguridad alrededor del QR para mejorar el escaneo
                  />
                </div>

                {/* SELECCIÓN DINÁMICA DE ICONO DE RED SOCIAL
                    Un operador ternario evalúa el string de 'persona.redSocial'.
                    Si es 'X', renderiza el icono de Twitter; de lo contrario, renderiza el de Instagram.
                */}
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  {persona.redSocial === 'X' ? <Twitter size={18} /> : <Instagram size={18} />}
                  {persona.redSocial}
                </div>
              </CardContent>

            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}