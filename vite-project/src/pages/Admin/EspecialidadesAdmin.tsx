import { useEffect, useMemo, useState } from 'react';
import AdminLayout, { styles } from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface EspecialidadItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export default function EspecialidadesAdmin() {
  const [especialidades, setEspecialidades] = useState<EspecialidadItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  const [especialidadEditando, setEspecialidadEditando] = useState<EspecialidadItem | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    cargarEspecialidades();
  }, []);

  const cargarEspecialidades = async () => {
    try {
      setCargando(true);
      setError('');

      const { data, error } = await supabase
        .from('especialidades')
        .select('id, nombre, descripcion')
        .order('nombre', { ascending: true });

      if (error) {
        setError(error.message);
        return;
      }

      setEspecialidades((data as EspecialidadItem[]) || []);
    } catch {
      setError('No se pudieron cargar las especialidades');
    } finally {
      setCargando(false);
    }
  };

  const especialidadesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return especialidades.filter((e) =>
      e.nombre?.toLowerCase().includes(texto) ||
      e.descripcion?.toLowerCase().includes(texto)
    );
  }, [especialidades, busqueda]);

  const abrirModalNuevo = () => {
    setMostrarModalNuevo(true);
  };

  const cerrarModalNuevo = () => {
    setMostrarModalNuevo(false);
    setNuevoNombre('');
    setNuevaDescripcion('');
  };

  const guardarNuevaEspecialidad = async () => {
    if (!nuevoNombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    try {
      setGuardandoNuevo(true);

      const { error } = await supabase
        .from('especialidades')
        .insert({
          nombre: nuevoNombre.trim(),
          descripcion: nuevaDescripcion.trim() || null,
        });

      if (error) {
        alert('No se pudo crear la especialidad: ' + error.message);
        return;
      }

      alert('Especialidad creada correctamente');
      cerrarModalNuevo();
      await cargarEspecialidades();
    } catch {
      alert('Ocurrió un error al crear la especialidad');
    } finally {
      setGuardandoNuevo(false);
    }
  };

  const abrirEdicion = (especialidad: EspecialidadItem) => {
    setEspecialidadEditando(especialidad);
    setFormNombre(especialidad.nombre || '');
    setFormDescripcion(especialidad.descripcion || '');
  };

  const cerrarEdicion = () => {
    setEspecialidadEditando(null);
    setFormNombre('');
    setFormDescripcion('');
  };

  const guardarEdicion = async () => {
    if (!especialidadEditando) return;

    if (!formNombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    try {
      setGuardandoEdicion(true);

      const { error } = await supabase
        .from('especialidades')
        .update({
          nombre: formNombre.trim(),
          descripcion: formDescripcion.trim() || null,
        })
        .eq('id', especialidadEditando.id);

      if (error) {
        alert('No se pudo actualizar: ' + error.message);
        return;
      }

      alert('Especialidad actualizada correctamente');
      cerrarEdicion();
      await cargarEspecialidades();
    } catch {
      alert('Ocurrió un error al guardar');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const eliminarEspecialidad = async (especialidad: EspecialidadItem) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la especialidad "${especialidad.nombre}"?`
    );

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('especialidades')
        .delete()
        .eq('id', especialidad.id);

      if (error) {
        alert('No se pudo eliminar: ' + error.message);
        return;
      }

      alert('Especialidad eliminada correctamente');
      await cargarEspecialidades();
    } catch {
      alert('Ocurrió un error al eliminar');
    }
  };

  return (
    <AdminLayout
      titulo="Especialidades"
      subtitulo="Gestión de especialidades médicas"
    >
      <section style={styles.gridCards}>
        <div style={styles.card}>
          <p style={styles.cardTitulo}>Total especialidades</p>
          <h3 style={styles.cardValor}>{especialidades.length}</h3>
          <p style={styles.cardSubtitulo}>Especialidades registradas</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Resultados filtrados</p>
          <h3 style={styles.cardValor}>{especialidadesFiltradas.length}</h3>
          <p style={styles.cardSubtitulo}>Según la búsqueda actual</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Con descripción</p>
          <h3 style={styles.cardValor}>
            {especialidades.filter((e) => e.descripcion && e.descripcion.trim() !== '').length}
          </h3>
          <p style={styles.cardSubtitulo}>Especialidades documentadas</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Sin descripción</p>
          <h3 style={styles.cardValor}>
            {especialidades.filter((e) => !e.descripcion || e.descripcion.trim() === '').length}
          </h3>
          <p style={styles.cardSubtitulo}>Pendientes de completar</p>
        </div>
      </section>

      <section style={localStyles.filtrosBox}>
        <div style={localStyles.filtrosFila}>
          <input
            type="text"
            placeholder="Buscar por nombre o descripción"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={localStyles.input}
          />

          <button style={styles.botonSecundario} onClick={cargarEspecialidades}>
            Recargar
          </button>

          <button style={styles.botonPrincipal} onClick={abrirModalNuevo}>
            Nueva especialidad
          </button>
        </div>
      </section>

      <section style={styles.tablaBox}>
        <div style={styles.tablaHeader}>
          <h3 style={styles.tablaTitulo}>Lista de especialidades</h3>
        </div>

        {cargando ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>Cargando especialidades...</p>
          </div>
        ) : error ? (
          <div style={localStyles.estadoBox}>
            <p style={{ ...styles.emptyStateText, color: '#dc2626' }}>{error}</p>
          </div>
        ) : especialidadesFiltradas.length === 0 ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>No se encontraron especialidades</p>
          </div>
        ) : (
          <div style={localStyles.tablaResponsive}>
            <table style={localStyles.tabla}>
              <thead>
                <tr>
                  <th style={localStyles.th}>Nombre</th>
                  <th style={localStyles.th}>Descripción</th>
                  <th style={localStyles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {especialidadesFiltradas.map((especialidad) => (
                  <tr key={especialidad.id}>
                    <td style={localStyles.td}>{especialidad.nombre}</td>
                    <td style={localStyles.td}>
                      {especialidad.descripcion || 'Sin descripción'}
                    </td>
                    <td style={localStyles.td}>
                      <div style={localStyles.accionesFila}>
                        <button
                          style={localStyles.botonEditar}
                          onClick={() => abrirEdicion(especialidad)}
                        >
                          Editar
                        </button>

                        <button
                          style={localStyles.botonEliminar}
                          onClick={() => eliminarEspecialidad(especialidad)}
                        >
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

      {mostrarModalNuevo && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Nueva especialidad</h2>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Nombre</label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Descripción</label>
              <textarea
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                style={localStyles.textarea}
              />
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={cerrarModalNuevo}>
                Cancelar
              </button>
              <button
                style={styles.botonPrincipal}
                onClick={guardarNuevaEspecialidad}
                disabled={guardandoNuevo}
              >
                {guardandoNuevo ? 'Guardando...' : 'Crear especialidad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {especialidadEditando && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Editar especialidad</h2>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Nombre</label>
              <input
                type="text"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Descripción</label>
              <textarea
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                style={localStyles.textarea}
              />
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

const localStyles: Record<string, React.CSSProperties> = {
  filtrosBox: {
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  filtrosFila: {
    display: 'grid',
    gridTemplateColumns: '2fr auto auto',
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
  botonEliminar: {
    background: '#FEE2E2',
    color: '#B91C1C',
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
    maxWidth: '560px',
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