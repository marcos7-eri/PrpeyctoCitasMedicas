'use client';

import { useEffect, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';

interface Notificacion {
  id: number;
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leido: boolean;
  fecha_envio: string;
}

export default function NotificacionesDoctor() {
  const [cargando, setCargando] = useState(true);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  useEffect(() => { obtenerUsuarioId(); }, []);
  useEffect(() => { if (usuarioId) cargarNotificaciones(); }, [usuarioId]);

  const obtenerUsuarioId = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) setUsuarioId(userData.user.id);
      else setCargando(false);
    } catch { setCargando(false); }
  };

  const cargarNotificaciones = async () => {
    if (!usuarioId) return;
    try {
      setCargando(true);
      const { data, error } = await supabase.from('notificaciones').select('id, usuario_id, titulo, mensaje, tipo, leido, fecha_envio').eq('usuario_id', usuarioId).order('fecha_envio', { ascending: false });
      if (error) throw error;
      setNotificaciones((data as Notificacion[]) || []);
    } catch (error) { console.error('Error cargando notificaciones:', error); } finally { setCargando(false); }
  };

  const marcarComoLeida = async (id: number, leido: boolean) => {
    try {
      const { error } = await supabase.from('notificaciones').update({ leido: !leido }).eq('id', id);
      if (error) throw error;
      await cargarNotificaciones();
    } catch (error) { console.error('Error actualizando notificacion:', error); }
  };

  const eliminarNotificacion = async (id: number) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    try {
      const { error } = await supabase.from('notificaciones').delete().eq('id', id);
      if (error) throw error;
      await cargarNotificaciones();
    } catch (error) { console.error('Error eliminando notificación:', error); }
  };

  const getTipoBadge = (tipo: string): React.CSSProperties => {
    if (tipo === 'sistema') return styles.badgeCancelada;
    if (tipo === 'recordatorio') return styles.badgePendiente;
    if (tipo === 'cita') return styles.badgeCompletada;
    return styles.badgeConfirmado;
  };

  return (
    <div style={styles.tableBox}>
      <div style={styles.tableHeader}>
        <h3 style={styles.tableTitle}>Mis notificaciones</h3>
        <button style={styles.btnSecondary} onClick={cargarNotificaciones}>Recargar</button>
      </div>
      {cargando ? (
        <div style={styles.emptyState}>Cargando notificaciones...</div>
      ) : notificaciones.length === 0 ? (
        <div style={styles.emptyState}>No hay notificaciones</div>
      ) : (
        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Título</th><th style={styles.th}>Mensaje</th><th style={styles.th}>Tipo</th><th style={styles.th}>Estado</th><th style={styles.th}>Fecha</th><th style={styles.th}>Acciones</th></tr></thead>
            <tbody>
              {notificaciones.map((notif) => (
                <tr key={notif.id} style={!notif.leido ? { background: 'rgba(49,151,149,0.05)' } : {}}>
                  <td style={styles.td}><strong>{notif.titulo}</strong></td>
                  <td style={styles.td}>{notif.mensaje.length > 60 ? notif.mensaje.substring(0, 60) + '...' : notif.mensaje}</td>
                  <td style={styles.td}><span style={getTipoBadge(notif.tipo)}>{notif.tipo}</span></td>
                  <td style={styles.td}><span style={notif.leido ? styles.badgeConfirmado : styles.badgePendiente}>{notif.leido ? 'Leída' : 'No leída'}</span></td>
                  <td style={styles.td}>{notif.fecha_envio ? new Date(notif.fecha_envio).toLocaleDateString('es-ES') : 'Sin fecha'}</td>
                  <td style={styles.td}>
                    <div style={styles.actionsRow}>
                      <button style={styles.btnEdit} onClick={() => marcarComoLeida(notif.id, notif.leido)}>{notif.leido ? 'No leída' : 'Leída'}</button>
                      <button style={styles.btnDelete} onClick={() => eliminarNotificacion(notif.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
