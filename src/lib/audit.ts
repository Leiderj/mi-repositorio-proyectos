import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

// Tipos de acciones permitidas para mantener orden
export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREAR_PROYECTO' | 'EDITAR_PROYECTO' | 'ELIMINAR_PROYECTO';

export const registrarAuditoria = async (accion: AuditAction, detalles: string) => {
  try {
    const usuarioActual = auth.currentUser;
    
    // Si no hay usuario (ej. fallo al iniciar sesión), no registramos o registramos como anónimo
    const emailUsuario = usuarioActual?.email || 'Sistema/Desconocido';
    const uidUsuario = usuarioActual?.uid || 'N/A';

    await addDoc(collection(db, 'audit_logs'), {
      usuarioId: uidUsuario,
      usuarioEmail: emailUsuario,
      accion: accion,
      detalles: detalles,
      fecha: serverTimestamp(),
    });
    
    console.log(`[Auditoría] Registrado: ${accion}`);
  } catch (error) {
    console.error("Error guardando en bitácora de auditoría:", error);
  }
};