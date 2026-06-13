'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { api } from '@/lib/api';

interface PerfilRelacionado { id: string; nombre_completo: string; correo: string; rol?: string; }
interface NotificacionItem { id: number; usuario_id: string | null; titulo: string; mensaje: string; tipo: string; leido: boolean; fecha_envio?: string | null; perfiles?: PerfilRelacionado | null; }
interface UsuarioOption { id: string; nombre_completo: string; correo: string; rol: string; }

export default function NotificacionesAdmin() {
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroLeido, setFiltroLeido] = useState('todos');
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [guardandoNueva, setGuardandoNueva] = useState(false);
  const [nuevoUsuarioId, setNuevoUsuarioId] = useState('');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('general');
  const [notificacionEditando, setNotificacionEditando] = useState<NotificacionItem | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formMensaje, setFormMensaje] = useState('');
  const [formTipo, setFormTipo] = useState('general');
  const [formLeido, setFormLeido] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => { Promise.all([cargarNotificaciones(), cargarUsuarios()]); }, []);

  const cargarNotificaciones = async () => {
    try {
      setCargando(true); setError('');
      const data = await api.get<NotificacionItem[]>('/notificaciones');
      setNotificaciones(data || []);
    } catch (e: any) { setError(e.message || 'No se pudieron cargar las notificaciones'); } finally { setCargando(false); }
  };

  const cargarUsuarios = async () => {
    try {
      const data = await api.get<UsuarioOption[]>('/usuarios');
      setUsuarios((data || []).filter((u) => (u as any).estado === 'activo'));
    } catch { /* silencioso */ }
  };

  const notificacionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    return notificaciones.filter((n) => {
      const titulo = n.titulo?.toLowerCase() || '';
      const mensaje = n.mensaje?.toLowerCase() || '';
      const usuario = n.perfiles?.nombre_completo?.toLowerCase() || '';
      const correo = n.perfiles?.correo?.toLowerCase() || '';
      const coincideBusqueda = titulo.includes(texto) || mensaje.includes(texto) || usuario.includes(texto) || correo.includes(texto);
      const coincideTipo = filtroTipo === 'todos' ? true : (n.tipo || '').toLowerCase() === filtroTipo;
      const coincideLeido = filtroLeido === 'todos' ? true : filtroLeido === 'leido' ? n.leido === true : n.leido === false;
      return coincideBusqueda && coincideTipo && coincideLeido;
    });
  }, [notificaciones, busqueda, filtroTipo, filtroLeido]);

  const resumen = useMemo(() => ({
    total: notificaciones.length,
    leidas: notificaciones.filter((n) => n.leido).length,
    noLeidas: notificaciones.filter((n) => !n.leido).length,
    sistema: notificaciones.filter((n) => n.tipo === 'sistema').length,
  }), [notificaciones]);

  const cerrarModalNueva = () => { setMostrarModalNueva(false); setNuevoUsuarioId(''); setNuevoTitulo(''); setNuevoMensaje(''); setNuevoTipo('general'); };

  const crearNotificacion = async () => {
    if (!nuevoTitulo.trim() || !nuevoMensaje.trim()) { alert('Completa título y mensaje'); return; }
    try {
      setGuardandoNueva(true);
      await api.post('/notificaciones', { usuario_id: nuevoUsuarioId || null, titulo: nuevoTitulo.trim(), mensaje: nuevoMensaje.trim(), tipo: nuevoTipo });
      alert('Notificación creada correctamente'); cerrarModalNueva(); await cargarNotificaciones();
    } catch (e: any) { alert('No se pudo crear la notificación: ' + e.message); } finally { setGuardandoNueva(false); }
  };

  const abrirEdicion = (notificacion: NotificacionItem) => {
    setNotificacionEditando(notificacion);
    setFormTitulo(notificacion.titulo || ''); setFormMensaje(notificacion.mensaje || '');
    setFormTipo(notificacion.tipo || 'general'); setFormLeido(!!notificacion.leido);
  };

  const guardarEdicion = async () => {
    if (!notificacionEditando) return;
    if (!formTitulo.trim() || !formMensaje.trim()) { alert('Completa título y mensaje'); return; }
    try {
      setGuardandoEdicion(true);
      await api.put(`/notificaciones/${notificacionEditando.id}`, { titulo: formTitulo.trim(), mensaje: formMensaje.trim(), tipo: formTipo, leido: formLeido });
      alert('Notificación actualizada correctamente'); setNotificacionEditando(null); await cargarNotificaciones();
    } catch (e: any) { alert('No se pudo actualizar: ' + e.message); } finally { setGuardandoEdicion(false); }
  };

  const cambiarLeido = async (notificacion: NotificacionItem, valor: boolean) => {
    try {
      await api.put(`/notificaciones/${notificacion.id}`, { leido: valor });
      await cargarNotificaciones();
    } catch (e: any) { alert('No se pudo actualizar el estado: ' + e.message); }
  };

  const eliminarNotificacion = async (notificacion: NotificacionItem) => {
    if (!window.confirm(`¿Eliminar la notificación "${notificacion.titulo}"?`)) return;
    try {
      await api.delete(`/notificaciones/${notificacion.id}`);
      await cargarNotificaciones();
    } catch (e: any) { alert('No se pudo eliminar: ' + e.message); }
  };

  const getTipoBadge = (tipo: string): React.CSSProperties => {
    const t = (tipo || '').toLowerCase();
    if (t === 'sistema') return styles.badgeCancelada;
    if (t === 'recordatorio') return styles.badgePendiente;
    if (t === 'cita') return styles.badgeCompletada;
    if (t === 'confirmacion') return styles.badgeConfirmado;
    if (t === 'cancelacion') return styles.badgeCancelada;
    return styles.badgeConfirmado;
  };

  const getTipoIcono = (tipo: string): string => {
    const t = (tipo || '').toLowerCase();
    if (t === 'sistema') return '⚙';
    if (t === 'recordatorio') return '○';
    if (t === 'cita') return '◆';
    if (t === 'confirmacion') return '✓';
    if (t === 'cancelacion') return '✕';
    return '▶';
  };

  return (
    <>
      <div style={styles.cardsGrid}>
        <div style={styles.card}><p style={styles.cardTitle}>Total notificaciones</p><h3 style={styles.cardValue}>{resumen.total}</h3><p style={styles.cardSubtitle}>Mensajes registrados</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Leídas</p><h3 style={styles.cardValue}>{resumen.leidas}</h3><p style={styles.cardSubtitle}>Mensajes revisados</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>No leídas</p><h3 style={styles.cardValue}>{resumen.noLeidas}</h3><p style={styles.cardSubtitle}>Pendientes de revisar</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Tipo sistema</p><h3 style={styles.cardValue}>{resumen.sistema}</h3><p style={styles.cardSubtitle}>Alertas del sistema</p></div>
      </div>

      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input type="text" placeholder="Buscar por título, mensaje o usuario..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={styles.input} />
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={styles.select}>
            <option value="todos">Todos los tipos</option><option value="general">General</option>
            <option value="confirmacion">Confirmación</option><option value="cancelacion">Cancelación</option>
            <option value="sistema">Sistema</option><option value="recordatorio">Recordatorio</option><option value="cita">Cita</option>
          </select>
          <select value={filtroLeido} onChange={(e) => setFiltroLeido(e.target.value)} style={styles.select}>
            <option value="todos">Todas</option><option value="leido">Leídas</option><option value="no_leido">No leídas</option>
          </select>
          <button style={styles.btnSecondary} onClick={cargarNotificaciones}>Recargar</button>
          <button style={styles.btnPrimary} onClick={() => setMostrarModalNueva(true)}>+ Nueva notificación</button>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}><h3 style={styles.tableTitle}>Lista de notificaciones</h3></div>
        {cargando ? <div style={styles.emptyState}>Cargando notificaciones...</div>
        : error ? <div style={{ ...styles.emptyState, color: '#F87171' }}>{error}</div>
        : notificacionesFiltradas.length === 0 ? <div style={styles.emptyState}>No se encontraron notificaciones</div>
        : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Título</th><th style={styles.th}>Usuario</th><th style={styles.th}>Tipo</th><th style={styles.th}>Estado</th><th style={styles.th}>Fecha</th><th style={styles.th}>Acciones</th></tr></thead>
              <tbody>
                {notificacionesFiltradas.map((n) => (
                  <tr key={n.id} style={!n.leido ? { background: 'rgba(49,151,149,0.03)' } : {}}>
                    <td style={styles.td}>
                      <div>
                        <div style={{ fontWeight: !n.leido ? 600 : 400, color: !n.leido ? '#FFFFFF' : '#CBD5E1' }}>{n.titulo}</div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>{n.mensaje.length > 60 ? n.mensaje.substring(0, 60) + '...' : n.mensaje}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {n.perfiles?.nombre_completo ? (
                        <div><div style={{ fontWeight: 500 }}>{n.perfiles.nombre_completo}</div><div style={{ fontSize: '11px', color: '#94A3B8' }}>{n.perfiles.correo}</div></div>
                      ) : <span style={styles.badgeAdmin}>Global</span>}
                    </td>
                    <td style={styles.td}><span style={getTipoBadge(n.tipo)}>{getTipoIcono(n.tipo)} {n.tipo}</span></td>
                    <td style={styles.td}><span style={n.leido ? styles.badgeConfirmado : styles.badgePendiente}>{n.leido ? '✓ Leída' : '○ No leída'}</span></td>
                    <td style={styles.td}><div style={{ fontSize: '12px' }}>{n.fecha_envio ? new Date(n.fecha_envio).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div></td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button style={styles.btnEdit} onClick={() => abrirEdicion(n)}>Editar</button>
                        <button style={n.leido ? styles.btnSecondary : styles.btnView} onClick={() => cambiarLeido(n, !n.leido)}>{n.leido ? 'Marcar no leída' : 'Marcar leída'}</button>
                        <button style={styles.btnDelete} onClick={() => eliminarNotificacion(n)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarModalNueva && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Nueva notificación</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Usuario destino</label>
              <select value={nuevoUsuarioId} onChange={(e) => setNuevoUsuarioId(e.target.value)} style={styles.select}>
                <option value="">Global / Todos los usuarios</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre_completo} - {u.rol}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}><label style={styles.label}>Título *</label><input type="text" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Mensaje *</label><textarea value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} style={styles.textarea} rows={4} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tipo de notificación</label>
              <select value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} style={styles.select}>
                <option value="general">General</option><option value="confirmacion">Confirmación</option>
                <option value="cancelacion">Cancelación</option><option value="sistema">Sistema</option>
                <option value="recordatorio">Recordatorio</option><option value="cita">Cita médica</option>
              </select>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={cerrarModalNueva}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={crearNotificacion} disabled={guardandoNueva}>{guardandoNueva ? 'Creando...' : 'Crear notificación'}</button>
            </div>
          </div>
        </div>
      )}

      {notificacionEditando && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Editar notificación</h2>
            <div style={styles.formGroup}><label style={styles.label}>Título</label><input type="text" value={formTitulo} onChange={(e) => setFormTitulo(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Mensaje</label><textarea value={formMensaje} onChange={(e) => setFormMensaje(e.target.value)} style={styles.textarea} rows={4} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tipo</label>
              <select value={formTipo} onChange={(e) => setFormTipo(e.target.value)} style={styles.select}>
                <option value="general">General</option><option value="confirmacion">Confirmación</option>
                <option value="cancelacion">Cancelación</option><option value="sistema">Sistema</option>
                <option value="recordatorio">Recordatorio</option><option value="cita">Cita médica</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Estado</label>
              <select value={formLeido ? 'true' : 'false'} onChange={(e) => setFormLeido(e.target.value === 'true')} style={styles.select}>
                <option value="false">No leída</option><option value="true">Leída</option>
              </select>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setNotificacionEditando(null)}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={guardarEdicion} disabled={guardandoEdicion}>{guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
