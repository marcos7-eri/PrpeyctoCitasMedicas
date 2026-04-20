import { useEffect, useMemo, useState } from 'react';
import AdminLayout, { styles } from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface AuditoriaItem {
  id: string;
  tabla_afectada?: string | null;
  accion?: string | null;
  registro_id?: string | null;
  descripcion?: string | null;
  usuario_id?: string | null;
  fecha?: string | null;
  perfiles?: {
    nombre_completo: string;
    correo: string;
  } | null;
}

export default function AuditoriaAdmin() {
  const [registros, setRegistros] = useState<AuditoriaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('todos');
  const [detalle, setDetalle] = useState<AuditoriaItem | null>(null);

  useEffect(() => {
    cargarAuditoria();
  }, []);

  const cargarAuditoria = async () => {
    try {
      setCargando(true);
      setError('');

      const { data, error } = await supabase
        .from('auditoria')
        .select(`
          id,
          tabla_afectada,
          accion,
          registro_id,
          descripcion,
          usuario_id,
          fecha,
          perfiles (
            nombre_completo,
            correo
          )
        `)
        .order('fecha', { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setRegistros((data as unknown as AuditoriaItem[]) || []);
    } catch {
      setError('No se pudo cargar la auditoría');
    } finally {
      setCargando(false);
    }
  };

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return registros.filter((r) => {
      const tabla = r.tabla_afectada?.toLowerCase() || '';
      const accion = r.accion?.toLowerCase() || '';
      const descripcion = r.descripcion?.toLowerCase() || '';
      const usuario = r.perfiles?.nombre_completo?.toLowerCase() || '';

      const coincideBusqueda =
        tabla.includes(texto) ||
        accion.includes(texto) ||
        descripcion.includes(texto) ||
        usuario.includes(texto);

      const coincideAccion =
        filtroAccion === 'todos' ? true : (r.accion || '').toLowerCase() === filtroAccion;

      return coincideBusqueda && coincideAccion;
    });
  }, [registros, busqueda, filtroAccion]);

  const resumen = useMemo(() => {
    return {
      total: registros.length,
      inserts: registros.filter((r) => (r.accion || '').toLowerCase() === 'insert').length,
      updates: registros.filter((r) => (r.accion || '').toLowerCase() === 'update').length,
      deletes: registros.filter((r) => (r.accion || '').toLowerCase() === 'delete').length,
    };
  }, [registros]);

  return (
    <AdminLayout
      titulo="Auditoría"
      subtitulo="Historial de cambios y acciones del sistema"
    >
      <section style={styles.gridCards}>
        <div style={styles.card}>
          <p style={styles.cardTitulo}>Total registros</p>
          <h3 style={styles.cardValor}>{resumen.total}</h3>
          <p style={styles.cardSubtitulo}>Eventos auditados</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Inserciones</p>
          <h3 style={styles.cardValor}>{resumen.inserts}</h3>
          <p style={styles.cardSubtitulo}>Altas en el sistema</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Actualizaciones</p>
          <h3 style={styles.cardValor}>{resumen.updates}</h3>
          <p style={styles.cardSubtitulo}>Cambios realizados</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Eliminaciones</p>
          <h3 style={styles.cardValor}>{resumen.deletes}</h3>
          <p style={styles.cardSubtitulo}>Registros eliminados</p>
        </div>
      </section>

      <section style={localStyles.filtrosBox}>
        <div style={localStyles.filtrosFila}>
          <input
            type="text"
            placeholder="Buscar por tabla, acción, descripción o usuario"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={localStyles.input}
          />

          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            style={localStyles.select}
          >
            <option value="todos">Todas las acciones</option>
            <option value="insert">Insert</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>

          <button style={styles.botonSecundario} onClick={cargarAuditoria}>
            Recargar
          </button>
        </div>
      </section>

      <section style={styles.tablaBox}>
        <div style={styles.tablaHeader}>
          <h3 style={styles.tablaTitulo}>Registros de auditoría</h3>
        </div>

        {cargando ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>Cargando auditoría...</p>
          </div>
        ) : error ? (
          <div style={localStyles.estadoBox}>
            <p style={{ ...styles.emptyStateText, color: '#dc2626' }}>{error}</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>No se encontraron registros</p>
          </div>
        ) : (
          <div style={localStyles.tablaResponsive}>
            <table style={localStyles.tabla}>
              <thead>
                <tr>
                  <th style={localStyles.th}>Tabla</th>
                  <th style={localStyles.th}>Acción</th>
                  <th style={localStyles.th}>Registro ID</th>
                  <th style={localStyles.th}>Usuario</th>
                  <th style={localStyles.th}>Fecha</th>
                  <th style={localStyles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((r) => (
                  <tr key={r.id}>
                    <td style={localStyles.td}>{r.tabla_afectada || 'Sin tabla'}</td>
                    <td style={localStyles.td}>
                      <span style={obtenerBadgeAccion(r.accion || '')}>
                        {r.accion || 'Sin acción'}
                      </span>
                    </td>
                    <td style={localStyles.td}>{r.registro_id || 'Sin registro'}</td>
                    <td style={localStyles.td}>{r.perfiles?.nombre_completo || 'Sistema'}</td>
                    <td style={localStyles.td}>
                      {r.fecha ? new Date(r.fecha).toLocaleString() : 'Sin fecha'}
                    </td>
                    <td style={localStyles.td}>
                      <button style={localStyles.botonVer} onClick={() => setDetalle(r)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detalle && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Detalle de auditoría</h2>

            <div style={localStyles.detalleBox}>
              <p><b>Tabla:</b> {detalle.tabla_afectada || 'Sin tabla'}</p>
              <p><b>Acción:</b> {detalle.accion || 'Sin acción'}</p>
              <p><b>Registro ID:</b> {detalle.registro_id || 'Sin ID'}</p>
              <p><b>Usuario:</b> {detalle.perfiles?.nombre_completo || 'Sistema'}</p>
              <p><b>Correo:</b> {detalle.perfiles?.correo || 'Sin correo'}</p>
              <p><b>Fecha:</b> {detalle.fecha ? new Date(detalle.fecha).toLocaleString() : 'Sin fecha'}</p>
              <p><b>Descripción:</b> {detalle.descripcion || 'Sin descripción'}</p>
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={() => setDetalle(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function obtenerBadgeAccion(accion: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  };

  const valor = accion.toLowerCase();

  if (valor === 'insert') return { ...base, background: '#DCFCE7', color: '#15803D' };
  if (valor === 'update') return { ...base, background: '#DBEAFE', color: '#1D4ED8' };
  if (valor === 'delete') return { ...base, background: '#FEE2E2', color: '#B91C1C' };

  return { ...base, background: '#E5E7EB', color: '#374151' };
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
    gridTemplateColumns: '2fr 1fr auto',
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
  botonVer: {
    background: '#E0F2FE',
    color: '#0369A1',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: '600',
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
  detalleBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    color: '#334155',
    fontSize: '14px',
    lineHeight: 1.7,
  },
  modalAcciones: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
};