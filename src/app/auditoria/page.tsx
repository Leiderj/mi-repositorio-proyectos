'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, orderBy, query, limit, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Activity, Lock, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

// IMPORTAMOS EL SIDEBAR (Que ya trae la Navbar adentro)
import { MainSidebar } from '@/components/main-sidebar';

export default function AuditoriaPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [verificandoRol, setVerificandoRol] = useState(true);
  const [accesoDenegado, setAccesoDenegado] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          // Permitimos acceso al Auditor Y al Administrador
          if (userDoc.exists() && (userData?.rol === 'auditor' || userData?.rol === 'admin')) {
            await cargarBitacora();
            setVerificandoRol(false);
          } else {
            setAccesoDenegado(true);
            setTimeout(() => router.push('/projects'), 3000);
          }
        } catch (error) {
          console.error("Error verificando permisos:", error);
          setAccesoDenegado(true);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const cargarBitacora = async () => {
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('fecha', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const historial: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        historial.push({ 
          id: doc.id, 
          ...data,
          // Convertimos el Timestamp de Firebase a Date de JS
          fechaFormateada: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha)
        });
      });
      setLogs(historial);
    } catch (error) {
      console.error("Error leyendo auditoría:", error);
    } finally {
      setCargando(false);
    }
  };

  const getBadgeColor = (accion: string) => {
    switch (accion) {
      case 'LOGIN': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CREAR_PROYECTO': return 'bg-green-100 text-green-800 border-green-200';
      case 'EDITAR_PROYECTO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ELIMINAR_PROYECTO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  if (accesoDenegado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Lock className="h-20 w-20 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-bold text-gray-900">Acceso Restringido</h1>
        <p className="text-muted-foreground mt-2 text-center">
          Tu cuenta no tiene privilegios para ver la bitácora. Serás redirigido al catálogo...
        </p>
      </div>
    );
  }

  return (
    <MainSidebar>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 text-slate-900">
        
        {/* 🖨️ CABECERA CON BOTÓN DE IMPRIMIR */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bitácora de Seguridad</h1>
              <p className="text-muted-foreground">Monitoreo de actividad del PNFI - UNEXCA.</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="bg-white border-slate-300 hover:bg-slate-100 shadow-sm"
          >
            <Printer className="h-4 w-4 mr-2" /> Exportar / Imprimir PDF
          </Button>
        </header>

        {/* TÍTULO EXCLUSIVO PARA EL PAPEL (Solo se ve al imprimir) */}
        <div className="hidden print:block mb-6 text-center">
          <h1 className="text-2xl font-bold uppercase">Reporte de Auditoría - ProjectHub</h1>
          <p className="text-sm text-gray-500">Generado el: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="shadow-md print:shadow-none print:border-none">
          <CardHeader className="bg-gray-50/50 print:hidden">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary"/> Historial de Eventos
            </CardTitle>
            <CardDescription>Auditoría en tiempo real de los últimos 50 movimientos.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 print:p-0">
            {cargando || verificandoRol ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 print:hidden">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Consultando registros seguros...</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden print:border-none">
                <Table>
                  <TableHeader className="bg-gray-100 print:bg-gray-200">
                    <TableRow>
                      <TableHead className="font-bold print:text-black">Fecha y Hora</TableHead>
                      <TableHead className="font-bold print:text-black">Usuario</TableHead>
                      <TableHead className="font-bold print:text-black">Acción</TableHead>
                      <TableHead className="font-bold print:text-black">Detalles del Evento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                          No se han registrado eventos de auditoría todavía.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors print:hover:bg-transparent">
                          <TableCell className="whitespace-nowrap font-medium text-xs">
                            {log.fechaFormateada ? log.fechaFormateada.toLocaleString('es-VE') : 'Error de fecha'}
                          </TableCell>
                          <TableCell className="text-sm print:text-xs">{log.usuarioEmail}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${getBadgeColor(log.accion)} font-bold print:border-none print:bg-transparent print:text-black`}>
                              {log.accion}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate md:max-w-none print:text-black print:whitespace-normal">
                            {log.detalles}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 🖨️ ESTILOS DE IMPRESIÓN CORREGIDOS */}
        <style>{`
          @media print {
            /* 1. Ocultamos SOLO la barra lateral y la cabecera con el botón */
            aside,
            header.print\\:hidden,
            nav {
              display: none !important;
            }

            /* 2. Liberamos los contenedores principales para que el contenido se vea */
            html, body, [data-sidebar="wrapper"], [data-sidebar="inset"], main {
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              display: block !important;
              background-color: white !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* 3. Aseguramos que la tabla y el texto sean de color negro puro */
            * {
              color: black !important;
            }

            /* 4. Estructura de la tabla */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            
            th, td {
              border: 1px solid #ccc !important;
              padding: 8px !important;
              white-space: normal !important;
            }
            
            /* 5. Limpiamos sombras y bordes de las tarjetas */
            .shadow-md, div {
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    </MainSidebar>
  );
}