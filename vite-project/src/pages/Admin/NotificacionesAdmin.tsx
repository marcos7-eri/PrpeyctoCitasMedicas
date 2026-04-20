import { useEffect, useMemo, useState } from 'react';
import AdminLayout, { styles } from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface NotificacionItem {
  id: string;
  perfil_id: string | null;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  creado_en?: string | null;
  perfiles?: {
    nombre_completo: string;
    correo: string;
  } | null;
}

interface UsuarioOption {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: string;
}

export default function NotificacionesAdmin() {
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroLeida, setFiltroLeida] = useState('todos');

  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [guardandoNueva, setGuardandoNueva] = useState(false);
  const [nuevoPerfilId, setNuevoPerfilId] = useState('');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('general');

  const [notificacionEditando, setNotificacionEditando] = useState<NotificacionItem | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formMensaje, setFormMensaje] = useState('');
  const [formTipo, setFormTipo] = useState('general');
  const [formLeida, setFormLeida] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    await Promise.all([cargarNotificaciones(), cargarUsuarios()]);
  };

  const cargarNotificaciones = async () => {
    try {
      setCargando(true);
      setError('');

      const { data, error } = await supabase
        .from('notificaciones')
        .select(`
          id,
          perfil_id,
          titulo,
          mensaje,
          tipo,
          leida,
          creado_en,
          perfiles (
            nombre_completo,
            correo
          )
        `)
        .order('creado_en', { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setNotificaciones((data as unknown as NotificacionItem[]) || []);
    } catch {
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuarios = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, correo, rol')
      .eq('estado', 'activo')
      .order('nombre_completo', { ascending: true });

    setUsuarios((data as UsuarioOption[]) || []);
  };

  const notificacionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return notificaciones.filter((n) => {
      const titulo = n.titulo?.toLowerCase() || '';
      const mensaje = n.mensaje?.toLowerCase() || '';
      const usuario = n.perfiles?.nombre_completo?.toLowerCase() || '';
      const correo = n.perfiles?.correo?.toLowerCase() || '';

      const coincideBusqueda =
        titulo.includes(texto) ||
        mensaje.includes(texto) ||
        usuario.includes(texto) ||
        correo.includes(texto);

      const coincideTipo = filtroTipo === 'todos' ? true : n.tipo === filtroTipo;

      const coincideLeida =
        filtroLeida === 'todos'
          ? true
          : filtroLeida === 'leida'
          ? n.leida === true
          : n.leida === false;

      return coincideBusqueda && coincideTipo && coincideLeida;
    });
  }, [notificaciones, busqueda, filtroTipo, filtroLeida]);

  const resumen = useMemo(() => {
    return {
      total: notificaciones.length,
      leidas: notificaciones.filter((n) => n.leida).length,
      noLeidas: notificaciones.filter((n) => !n.leida).length,
      sistema: notificaciones.filter((n) => n.tipo === 'sistema').length,
    };
  }, [notificaciones]);

  const abrirModalNueva = () => {
    setMostrarModalNueva(true);
  };

  const cerrarModalNueva = () => {
    setMostrarModalNueva(false);
    setNuevoPerfilId('');
    setNuevoTitulo('');
    setNuevoMensaje('');
    setNuevoTipo('general');
  };

  const crearNotificacion = async () => {
    if (!nuevoTitulo.trim() || !nuevoMensaje.trim()) {
      alert('Completa título y mensaje');
      return;
    }

    try {
      setGuardandoNueva(true);

      const payload = {
        perfil_id: nuevoPerfilId || null,
        titulo: nuevoTitulo.trim(),
        mensaje: nuevoMensaje.trim(),
        tipo: nuevoTipo,
        leida: false,
      };

      const { error } = await supabase
        .from('notificaciones')
        .insert(payload);

      if (error) {
        alert('No se pudo crear la notificación: ' + error.message);
        return;
      }

      alert('Notificación creada correctamente');
      cerrarModalNueva();
      await cargarNotificaciones();
    } catch {
      alert('Ocurrió un error al crear la notificación');
    } finally {
      setGuardandoNueva(false);
    }
  };

  const abrirEdicion = (notificacion: NotificacionItem) => {
    setNotificacionEditando(notificacion);
    setFormTitulo(notificacion.titulo || '');
    setFormMensaje(notificacion.mensaje || '');
    setFormTipo(notificacion.tipo || 'general');
    setFormLeida(!!notificacion.leida);
  };

  const cerrarEdicion = () => {
    setNotificacionEditando(null);
    setFormTitulo('');
    setFormMensaje('');
    setFormTipo('general');
    setFormLeida(false);
  };

  const guardarEdicion = async () => {
    if (!notificacionEditando) return;

    if (!formTitulo.trim() || !formMensaje.trim()) {
      alert('Completa título y mensaje');
      return;
    }

    try {
      setGuardandoEdicion(true);

      const { error } = await supabase
        .from('notificaciones')
        .update({
          titulo: formTitulo.trim(),
          mensaje: formMensaje.trim(),
          tipo: formTipo,
          leida: formLeida,
        })
        .eq('id', notificacionEditando.id);

      if (error) {
        alert('No se pudo actualizar: ' + error.message);
        return;
      }

      alert('Notificación actualizada correctamente');
      cerrarEdicion();
      await cargarNotificaciones();
    } catch {
      alert('Ocurrió un error al guardar');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const cambiarLeida = async (notificacion: NotificacionItem, valor: boolean) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: valor })
      .eq('id', notificacion.id);

    if (error) {
      alert('No se pudo actualizar el estado: ' + error.message);
      return;
    }

    await cargarNotificaciones();
  };

  const eliminarNotificacion = async (notificacion: NotificacionItem) => {
    const confirmar = window.confirm(`¿Eliminar la notificación "${notificacion.titulo}"?`);
    if (!confirmar) return;

    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .eq('id', notificacion.id);

    if (error) {
      alert('No se pudo eliminar: ' + error.message);
      return;
    }

    await cargarNotificaciones();
  };

  return (
    <AdminLayout
      titulo="Notificaciones"
      subtitulo="Gestión de avisos y mensajes del sistema"
    >
      <section style={styles.gridCards}>
        <div style={styles.card}>
          <p style={styles.cardTitulo}>Total notificaciones</p>
          <h3 style={styles.cardValor}>{resumen.total}</h3>
          <p style={styles.cardSubtitulo}>Mensajes registrados</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Leídas</p>
          <h3 style={styles.cardValor}>{resumen.leidas}</h3>
          <p style={styles.cardSubtitulo}>Mensajes revisados</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>No leídas</p>
          <h3 style={styles.cardValor}>{resumen.noLeidas}</h3>
          <p style={styles.cardSubtitulo}>Pendientes de revisar</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Tipo sistema</p>
          <h3 style={styles.cardValor}>{resumen.sistema}</h3>
          <p style={styles.cardSubtitulo}>Alertas del sistema</p>
        </div>
      </section>

      <section style={localStyles.filtrosBox}>
        <div style={localStyles.filtrosFila}>
          <input
            type="text"
            placeholder="Buscar por título, mensaje o usuario"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={localStyles.input}
          />

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={localStyles.select}
          >
            <option value="todos">Todos los tipos</option>
            <option value="general">General</option>
            <option value="sistema">Sistema</option>
            <option value="recordatorio">Recordatorio</option>
            <option value="cita">Cita</option>
          </select>

          <select
            value={filtroLeida}
            onChange={(e) => setFiltroLeida(e.target.value)}
            style={localStyles.select}
          >
            <option value="todos">Todas</option>
            <option value="leida">Leídas</option>
            <option value="no_leida">No leídas</option>
          </select>

          <button style={styles.botonSecundario} onClick={cargarNotificaciones}>
            Recargar
          </button>

          <button style={styles.botonPrincipal} onClick={abrirModalNueva}>
            Nueva notificación
          </button>
        </div>
      </section>

      <section style={styles.tablaBox}>
        <div style={styles.tablaHeader}>
          <h3 style={styles.tablaTitulo}>Lista de notificaciones</h3>
        </div>

        {cargando ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>Cargando notificaciones...</p>
          </div>
        ) : error ? (
          <div style={localStyles.estadoBox}>
            <p style={{ ...styles.emptyStateText, color: '#dc2626' }}>{error}</p>
          </div>
        ) : notificacionesFiltradas.length === 0 ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>No se encontraron notificaciones</p>
          </div>
        ) : (
          <div style={localStyles.tablaResponsive}>
            <table style={localStyles.tabla}>
              <thead>
                <tr>
                  <th style={localStyles.th}>Título</th>
                  <th style={localStyles.th}>Usuario</th>
                  <th style={localStyles.th}>Tipo</th>
                  <th style={localStyles.th}>Estado</th>
                  <th style={localStyles.th}>Fecha</th>
                  <th style={localStyles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {notificacionesFiltradas.map((n) => (
                  <tr key={n.id}>
                    <td style={localStyles.td}>{n.titulo}</td>
                    <td style={localStyles.td}>
                      {n.perfiles?.nombre_completo || 'Global'}
                    </td>
                    <td style={localStyles.td}>
                      <span style={obtenerBadgeTipo(n.tipo)}>{n.tipo}</span>
                    </td>
                    <td style={localStyles.td}>
                      <span style={n.leida ? localStyles.badgeLeida : localStyles.badgeNoLeida}>
                        {n.leida ? 'Leída' : 'No leída'}
                      </span>
                    </td>
                    <td style={localStyles.td}>
                      {n.creado_en ? new Date(n.creado_en).toLocaleDateString() : 'Sin fecha'}
                    </td>
                    <td style={localStyles.td}>
                      <div style={localStyles.accionesFila}>
                        <button style={localStyles.botonEditar} onClick={() => abrirEdicion(n)}>
                          Editar
                        </button>

                        <button
                          style={n.leida ? localStyles.botonMarcar : localStyles.botonMarcarLeida}
                          onClick={() => cambiarLeida(n, !n.leida)}
                        >
                          {n.leida ? 'No leída' : 'Marcar leída'}
                        </button>

                        <button style={localStyles.botonEliminar} onClick={() => eliminarNotificacion(n)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {mostrarModalNueva && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Nueva notificación</h2>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Usuario destino</label>
              <select
                value={nuevoPerfilId}
                onChange={(e) => setNuevoPerfilId(e.target.value)}
                style={localStyles.select}
              >
                <option value="">Global / todos</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre_completo} - {u.rol}
                  </option>
                ))}
              </select>
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Título</label>
              <input
                type="text"
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Mensaje</label>
              <textarea
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                style={localStyles.textarea}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Tipo</label>
              <select
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value)}
                style={localStyles.select}
              >
                <option value="general">General</option>
                <option value="sistema">Sistema</option>
                <option value="recordatorio">Recordatorio</option>
                <option value="cita">Cita</option>
              </select>
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={cerrarModalNueva}>
                Cancelar
              </button>
              <button
                style={styles.botonPrincipal}
                onClick={crearNotificacion}
                disabled={guardandoNueva}
              >
                {guardandoNueva ? 'Guardando...' : 'Crear notificación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notificacionEditando && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Editar notificación</h2>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Título</label>
              <input
                type="text"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Mensaje</label>
              <textarea
                value={formMensaje}
                onChange={(e) => setFormMensaje(e.target.value)}
                style={localStyles.textarea}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Tipo</label>
              <select
                value={formTipo}
                onChange={(e) => setFormTipo(e.target.value)}
                style={localStyles.select}
              >
                <option value="general">General</option>
                <option value="sistema">Sistema</option>
                <option value="recordatorio">Recordatorio</option>
                <option value="cita">Cita</option>
              </select>
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Estado</label>
              <select
                value={formLeida ? 'true' : 'false'}
                onChange={(e) => setFormLeida(e.target.value === 'true')}
                style={localStyles.select}
              >
                <option value="false">No leída</option>
                <option value="true">Leída</option>
              </select>
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={cerrarEdicion}>
                Cancelar
              </button>
              <button
                style={styles.botonPrincipal}
                onClick={guardarEdicion}
                disabled={guardandoEdicion}
              >
                {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function obtenerBadgeTipo(tipo: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  };

  if (tipo === 'sistema') return { ...base, background: '#FEE2E2', color: '#B91C1C' };
  if (tipo === 'recordatorio') return { ...base, background: '#FEF3C7', color: '#B45309' };
  if (tipo === 'cita') return { ...base, background: '#DBEAFE', color: '#1D4ED8' };
  return { ...base, background: '#DCFCE7', color: '#15803D' };
}

const localStyles: Record<string, React.CSSProperties> = {
  filtrosBox: {
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  filtrosFila: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr auto auto',
    gap: '12px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #CBD5E1',
    borderRadius: '14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #CBD5E1',
    borderRadius: '14px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    padding: '14px 16px',
    border: '1px solid #CBD5E1',
    borderRadius: '14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    resize: 'vertical',
  },
  estadoBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
  },
  tablaResponsive: {
    overflowX: 'auto',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '16px',
    color: '#64748B',
    background: '#F8FAFC',
    fontSize: '13px',
    fontWeight: '600',
    borderBottom: '1px solid #E2E8F0',
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid #F1F5F9',
    color: '#334155',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  accionesFila: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  botonEditar: {
    background: '#DBEAFE',
    color: '#1D4ED8',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  botonMarcarLeida: {
    background: '#DCFCE7',
    color: '#15803D',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  botonMarcar: {
    background: '#FEF3C7',
    color: '#B45309',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  botonEliminar: {
    background: '#FEE2E2',
    color: '#B91C1C',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  badgeLeida: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    background: '#DCFCE7',
    color: '#15803D',
  },
  badgeNoLeida: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    background: '#FEE2E2',
    color: '#B91C1C',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '720px',
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitulo: {
    margin: '0 0 20px',
    fontSize: '22px',
    fontWeight: '700',
    color: '#0A2540',
  },
  formGrupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
  },
  modalAcciones: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
};