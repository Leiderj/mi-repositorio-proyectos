'use client'; // Indica que este es un Client Component de Next.js (permite usar hooks como useState y useEffect)

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Importaciones de Firebase Firestore para la base de datos
import { collection, getDocs, orderBy, query, limit, doc, getDoc } from 'firebase/firestore';
// Importación de Firebase Auth para controlar el estado de la sesión
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

// Componentes de interfaz de usuario (UI) basados en Shadcn/ui
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MainSidebar } from '@/components/main-sidebar';

// Iconos de la librería Lucide React
import { ShieldAlert, Printer, Loader2 } from 'lucide-react';

export default function AuditoriaPage() {
  const router = useRouter();
  // Estado para almacenar los registros (logs) obtenidos de la base de datos
  const [logs, setLogs] = useState<any[]>([]);
  // Estado para manejar el indicador de carga (spinner)
  const [cargando, setCargando] = useState(true);

  /**
   * FUNCIÓN DE IMPRESIÓN AISLADA
   * Extrae el contenido HTML de la tabla y lo renderiza en una nueva ventana limpia
   * optimizada exclusivamente para impresión física o PDF.
   */
  const imprimirReporte = () => {
    // Captura el HTML interno del contenedor de la tabla
    const contenido = document.getElementById("printable-content")?.innerHTML;
    // Abre una ventana emergente en el navegador con dimensiones específicas
    const ventanaImpresion = window.open('', '', 'height=700,width=900');
    
    if (ventanaImpresion) {
      // 1. CAMBIO AQUÍ: Título de la pestaña del navegador
      ventanaImpresion.document.write('<html><head><title>Bitácora de Seguridad - UNEXCA</title>');
      ventanaImpresion.document.write(`
        <style>
          body { background-color: #ffffff !important; color: #000000 !important; font-family: sans-serif; padding: 20px; }
          h1 { text-align: center; color: #000; margin-bottom: 20px; font-size: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; } 
          th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f3f4f6 !important; }
        </style>
      `);
      ventanaImpresion.document.write('</head><body>');
      
      // 2. CAMBIO AQUÍ: Título principal impreso en la hoja
      ventanaImpresion.document.write('<h1>Bitácora de Seguridad de Sistemas - PNF Informática</h1>');
      
      ventanaImpresion.document.write(contenido || ''); // Inserta el HTML clonado de la tabla
      ventanaImpresion.document.write('</body></html>');
      ventanaImpresion.document.close(); // Cierra el flujo de escritura del documento
      
      // Espera 500ms para asegurar que el navegador procese el HTML y los estilos antes de abrir el diálogo de impresión
      setTimeout(() => {
        ventanaImpresion.print(); // Abre el cuadro de diálogo de impresión del sistema
        ventanaImpresion.close(); // Cierra automáticamente la ventana emergente tras imprimir/cancelar
      }, 500);
    }
  };

  /**
   * EFECTO DE CONTROL DE ACCESO Y CARGA DE DATOS
   * Se ejecuta al montar el componente. Escucha cambios en la autenticación, 
   * valida que el usuario sea administrador/auditor y descarga los logs de seguridad.
   */
  useEffect(() => {
    // Suscripción al observador de Firebase Auth para saber si hay un usuario logueado
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // 1. Redirección si no está autenticado
      if (!user) { 
        router.push('/login'); 
        return; 
      }
      
      // 2. Control de Roles: Busca el documento del usuario en la colección 'users' usando su UID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const rol = userDoc.data()?.rol;
      
      // Si el usuario no es 'auditor' ni 'admin', se le deniega el acceso y se le redirige
      if (rol !== 'auditor' && rol !== 'admin') { 
        router.push('/projects'); 
        return; 
      }
      
      // 3. Carga de Datos: Construye la consulta para traer los últimos 50 logs de auditoría ordenados por fecha
      const q = query(collection(db, 'audit_logs'), orderBy('fecha', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      // Mapea los documentos de Firebase Firestore a un array de objetos manipulable en JavaScript
      setLogs(snapshot.docs.map(doc => ({ 
        id: doc.id, // ID del documento
        ...doc.data(), // Resto de campos (usuarioEmail, accion, detalles, etc.)
        // Convierte el Timestamp de Firebase a un string de fecha local de Venezuela ('es-VE')
        fechaFormateada: doc.data().fecha?.toDate?.().toLocaleString('es-VE') 
      })));
      
      // Finaliza el estado de carga para mostrar la tabla
      setCargando(false);
    });
    
    // Función de limpieza (cleanup) para cancelar la suscripción de Firebase Auth cuando el componente se desmonte
    return () => unsubscribe();
  }, [router]);

  return (
    <MainSidebar>
      <div className="p-8">
        {/* Encabezado de la página */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-red-600" /> Bitácora de Seguridad
          </h1>
          {/* Botón para disparar el método de impresión */}
          <Button onClick={imprimirReporte}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir Reporte
          </Button>
        </header>

        {/* CONTENEDOR QUE SE EXTRAE PARA IMPRIMIR (Identificado por ID) */}
        <div id="printable-content">
          {cargando ? (
            // Renderizado condicional: Muestra un spinner animado mientras "cargando" sea true
            <div className="flex justify-center p-10">
              <Loader2 className="animate-spin h-8 w-8" />
            </div>
          ) : (
            // Renderizado condicional: Muestra la tabla de datos cuando la carga finaliza
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Renderiza dinámicamente una fila por cada log en el estado */}
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        {/* Muestra la fecha pre-formateada en el useEffect */}
                        <TableCell className="text-xs">{log.fechaFormateada}</TableCell>
                        <TableCell>{log.usuarioEmail}</TableCell>
                        <TableCell>
                          {/* Muestra la acción realizada dentro de un componente Badge estilizado */}
                          <Badge variant="outline">{log.accion}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{log.detalles}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainSidebar>
  );
}