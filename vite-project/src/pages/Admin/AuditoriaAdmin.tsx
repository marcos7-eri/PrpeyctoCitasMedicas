import { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminStyles as styles } from './admin';
import { supabase } from '../../lib/supabase';

interface PerfilItem {
  id: string;
  nombre_completo: string;
  correo: string;
}

interface AuditoriaItem {
  id: number;
  tabla?: string | null;
  accion?: string | null;
  registro_id?: string | null;
  detalles?: any;
  usuario_id?: string | null;
  creado_en?: string | null;
  perfil?: PerfilItem | null;
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

      const { data: auditoriaData, error: auditoriaError } = await supabase
        .from('auditoria')
        .select(`
          id,
          usuario_id,
          accion,
          tabla,
          registro_id,
          detalles,
          creado_en
        `)
        .order('creado_en', { ascending: false });

      if (auditoriaError) {
        setError(auditoriaError.message);
        return;
      }

      const auditoria = auditoriaData || [];

      const usuariosIds = [
        ...new Set(
          auditoria
            .map((item) => item.usuario_id)
            .filter((id): id is string => !!id)
        ),
      ];

      let perfilesMap = new Map<string, PerfilItem>();

      if (usuariosIds.length > 0) {
        const { data: perfilesData, error: perfilesError } = await supabase
          .from('perfiles')
          .select('id, nombre_completo, correo')
          .in('id', usuariosIds);

        if (perfilesError) {
          setError(perfilesError.message);
          return;
        }

        perfilesMap = new Map(
          (perfilesData || []).map((perfil) => [perfil.id, perfil])
        );
      }

      const auditoriaConPerfiles: AuditoriaItem[] = auditoria.map((item) => ({
        ...item,
        perfil: item.usuario_id ? perfilesMap.get(item.usuario_id) || null : null,
      }));

      setRegistros(auditoriaConPerfiles);
    } catch {
      setError('No se pudo cargar la auditoría');
    } finally {
      setCargando(false);
    }
  };

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return registros.filter((r) => {
      const tabla = r.tabla?.toLowerCase() || '';
      const accion = r.accion?.toLowerCase() || '';
      const usuario = r.perfil?.nombre_completo?.toLowerCase() || '';
      const correo = r.perfil?.correo?.toLowerCase() || '';
      const detallesTexto =
        typeof r.detalles === 'string'
          ? r.detalles.toLowerCase()
          : JSON.stringify(r.detalles || {}).toLowerCase();

      const coincideBusqueda =
        tabla.includes(texto) ||
        accion.includes(texto) ||
        usuario.includes(texto) ||
        correo.includes(texto) ||
        detallesTexto.includes(texto);

      const coincideAccion =
        filtroAccion === 'todos'
          ? true
          : (r.accion || '').toLowerCase() === filtroAccion;

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

  const getAccionBadge = (accion: string): React.CSSProperties => {
    const accionLower = accion.toLowerCase();
    if (accionLower === 'insert') return styles.badgeActive;
    if (accionLower === 'update') return styles.badgeConfirmado;
    if (accionLower === 'delete') return styles.badgeCancelada;
    return styles.badgePendiente;
  };

  const getAccionText = (accion: string): string => {
    const accionLower = accion.toLowerCase();
    if (accionLower === 'insert') return 'CREACIÓN';
    if (accionLower === 'update') return 'ACTUALIZACIÓN';
    if (accionLower === 'delete') return 'ELIMINACIÓN';
    return accion ? accion.toUpperCase() : '—';
  };

  const formatearDetalles = (detalles: any) => {
    if (!detalles) return 'No se proporcionaron detalles';
    if (typeof detalles === 'string') return detalles;

    try {
      return JSON.stringify(detalles, null, 2);
    } catch {
      return 'No se pudieron mostrar los detalles';
    }
  };

  return (
    <AdminLayout
      titulo="Auditoría"
      subtitulo="Historial de cambios y acciones del sistema"
    >
      <div style={styles.cardsGrid}>
        <div style={styles.card}>
          <p style={styles.cardTitle}>Total registros</p>
          <h3 style={styles.cardValue}>{resumen.total}</h3>
          <p style={styles.cardSubtitle}>Eventos auditados</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Inserciones</p>
          <h3 style={styles.cardValue}>{resumen.inserts}</h3>
          <p style={styles.cardSubtitle}>Altas en el sistema</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Actualizaciones</p>
          <h3 style={styles.cardValue}>{resumen.updates}</h3>
          <p style={styles.cardSubtitle}>Cambios realizados</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Eliminaciones</p>
          <h3 style={styles.cardValue}>{resumen.deletes}</h3>
          <p style={styles.cardSubtitle}>Registros eliminados</p>
        </div>
      </div>

      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input
            type="text"
            placeholder="Buscar por tabla, acción, usuario o detalles"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.input}
          />

          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            style={styles.select}
          >
            <option value="todos">Todas las acciones</option>
            <option value="insert">Insertar</option>
            <option value="update">Actualizar</option>
            <option value="delete">Eliminar</option>
          </select>

          <button style={styles.btnSecondary} onClick={cargarAuditoria}>
            Recargar
          </button>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Registros de auditoría</h3>
        </div>

        {cargando ? (
          <div style={styles.emptyState}>Cargando auditoría...</div>
        ) : error ? (
          <div style={{ ...styles.emptyState, color: '#F87171' }}>{error}</div>
        ) : registrosFiltrados.length === 0 ? (
          <div style={styles.emptyState}>No se encontraron registros</div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tabla</th>
                  <th style={styles.th}>Acción</th>
                  <th style={styles.th}>Registro ID</th>
                  <th style={styles.th}>Usuario</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((r) => (
                  <tr key={r.id}>
                    <td style={styles.td}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          background: 'rgba(255,255,255,0.05)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {r.tabla || '—'}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <span style={getAccionBadge(r.accion || '')}>
                        {getAccionText(r.accion || '')}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {r.registro_id || '—'}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {r.perfil?.nombre_completo || 'Sistema'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                          {r.perfil?.correo || ''}
                        </div>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={{ fontSize: '12px' }}>
                        {r.creado_en
                          ? new Date(r.creado_en).toLocaleString()
                          : '—'}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <button style={styles.btnView} onClick={() => setDetalle(r)}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detalle && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Detalle de auditoría</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'rgba(49,151,149,0.1)',
                  padding: '16px',
                  borderRadius: '16px',
                  borderLeft: `4px solid ${
                    detalle.accion?.toLowerCase() === 'delete'
                      ? '#F87171'
                      : detalle.accion?.toLowerCase() === 'insert'
                      ? '#4ADE80'
                      : '#60A5FA'
                  }`,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                      Tabla afectada
                    </p>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        margin: '4px 0 0',
                        fontFamily: 'monospace',
                      }}
                    >
                      {detalle.tabla || '—'}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                      Acción
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', margin: '4px 0 0' }}>
                      <span style={getAccionBadge(detalle.accion || '')}>
                        {getAccionText(detalle.accion || '')}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                      Registro ID
                    </p>
                    <p
                      style={{
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        color: '#FFFFFF',
                        margin: '4px 0 0',
                      }}
                    >
                      {detalle.registro_id || '—'}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                      Fecha y hora
                    </p>
                    <p style={{ fontSize: '14px', color: '#FFFFFF', margin: '4px 0 0' }}>
                      {detalle.creado_en
                        ? new Date(detalle.creado_en).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '16px',
                  borderRadius: '16px',
                }}
              >
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                  Usuario que realizó la acción
                </p>
                <p style={{ fontSize: '15px', fontWeight: 500, color: '#FFFFFF', margin: '4px 0 0' }}>
                  {detalle.perfil?.nombre_completo || 'Sistema'}
                </p>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0' }}>
                  {detalle.perfil?.correo || 'sistema@clinica.com'}
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '16px',
                  borderRadius: '16px',
                }}
              >
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                  Detalles del cambio
                </p>
                <pre
                  style={{
                    fontSize: '13px',
                    color: '#E2E8F0',
                    margin: '8px 0 0',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                  }}
                >
                  {formatearDetalles(detalle.detalles)}
                </pre>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setDetalle(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}