import { useEffect, useMemo, useState } from 'react';
import AdminLayout, { styles } from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface PacienteItem {
  id: string;
  perfil_id: string;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  direccion?: string | null;
  tipo_sangre?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
  perfiles: {
    id: string;
    nombre_completo: string;
    correo: string;
    telefono?: string | null;
    estado: 'activo' | 'inactivo';
    creado_en?: string;
  } | null;
}

interface CitaResumen {
  id: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
  motivo?: string | null;
  doctor_id?: string | null;
}

export default function PacientesAdmin() {
  const [pacientes, setPacientes] = useState<PacienteItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [pacienteEditando, setPacienteEditando] = useState<PacienteItem | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEstado, setFormEstado] = useState<'activo' | 'inactivo'>('activo');
  const [formFechaNacimiento, setFormFechaNacimiento] = useState('');
  const [formGenero, setFormGenero] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formTipoSangre, setFormTipoSangre] = useState('');
  const [formContactoNombre, setFormContactoNombre] = useState('');
  const [formContactoTelefono, setFormContactoTelefono] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [pacienteDetalle, setPacienteDetalle] = useState<PacienteItem | null>(null);
  const [citasDetalle, setCitasDetalle] = useState<CitaResumen[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      setCargando(true);
      setError('');

      const { data, error } = await supabase
        .from('pacientes')
        .select(`
          id,
          perfil_id,
          fecha_nacimiento,
          genero,
          direccion,
          tipo_sangre,
          contacto_emergencia_nombre,
          contacto_emergencia_telefono,
          perfiles (
            id,
            nombre_completo,
            correo,
            telefono,
            estado,
            creado_en
          )
        `);

      if (error) {
        setError(error.message);
        return;
      }

      setPacientes((data as unknown as PacienteItem[]) || []);
    } catch {
      setError('No se pudieron cargar los pacientes');
    } finally {
      setCargando(false);
    }
  };

  const pacientesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return pacientes.filter((p) => {
      const nombre = p.perfiles?.nombre_completo?.toLowerCase() || '';
      const correo = p.perfiles?.correo?.toLowerCase() || '';
      const telefono = p.perfiles?.telefono?.toLowerCase() || '';

      return (
        nombre.includes(texto) ||
        correo.includes(texto) ||
        telefono.includes(texto)
      );
    });
  }, [pacientes, busqueda]);

  const resumen = useMemo(() => {
    return {
      total: pacientes.length,
      activos: pacientes.filter((p) => p.perfiles?.estado === 'activo').length,
      inactivos: pacientes.filter((p) => p.perfiles?.estado === 'inactivo').length,
      conTipoSangre: pacientes.filter((p) => p.tipo_sangre && p.tipo_sangre.trim() !== '').length,
    };
  }, [pacientes]);

  const cambiarEstadoPaciente = async (paciente: PacienteItem) => {
    if (!paciente.perfiles?.id) return;

    const nuevoEstado = paciente.perfiles.estado === 'activo' ? 'inactivo' : 'activo';

    try {
      setProcesandoId(paciente.id);

      const { error } = await supabase
        .from('perfiles')
        .update({ estado: nuevoEstado })
        .eq('id', paciente.perfiles.id);

      if (error) {
        alert('No se pudo actualizar el estado: ' + error.message);
        return;
      }

      await cargarPacientes();
    } catch {
      alert('Ocurrió un error al cambiar el estado');
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirEdicion = (paciente: PacienteItem) => {
    setPacienteEditando(paciente);
    setFormNombre(paciente.perfiles?.nombre_completo || '');
    setFormTelefono(paciente.perfiles?.telefono || '');
    setFormEstado(paciente.perfiles?.estado || 'activo');
    setFormFechaNacimiento(paciente.fecha_nacimiento || '');
    setFormGenero(paciente.genero || '');
    setFormDireccion(paciente.direccion || '');
    setFormTipoSangre(paciente.tipo_sangre || '');
    setFormContactoNombre(paciente.contacto_emergencia_nombre || '');
    setFormContactoTelefono(paciente.contacto_emergencia_telefono || '');
  };

  const cerrarEdicion = () => {
    setPacienteEditando(null);
    setFormNombre('');
    setFormTelefono('');
    setFormEstado('activo');
    setFormFechaNacimiento('');
    setFormGenero('');
    setFormDireccion('');
    setFormTipoSangre('');
    setFormContactoNombre('');
    setFormContactoTelefono('');
  };

  const guardarEdicion = async () => {
    if (!pacienteEditando || !pacienteEditando.perfiles?.id) return;

    try {
      setGuardandoEdicion(true);

      const { error: errorPerfil } = await supabase
        .from('perfiles')
        .update({
          nombre_completo: formNombre,
          telefono: formTelefono,
          estado: formEstado,
        })
        .eq('id', pacienteEditando.perfiles.id);

      if (errorPerfil) {
        alert('No se pudo actualizar el perfil: ' + errorPerfil.message);
        return;
      }

      const { error: errorPaciente } = await supabase
        .from('pacientes')
        .update({
          fecha_nacimiento: formFechaNacimiento || null,
          genero: formGenero || null,
          direccion: formDireccion || null,
          tipo_sangre: formTipoSangre || null,
          contacto_emergencia_nombre: formContactoNombre || null,
          contacto_emergencia_telefono: formContactoTelefono || null,
        })
        .eq('id', pacienteEditando.id);

      if (errorPaciente) {
        alert('No se pudo actualizar el paciente: ' + errorPaciente.message);
        return;
      }

      if (pacienteDetalle && pacienteDetalle.id === pacienteEditando.id) {
        setPacienteDetalle({
          ...pacienteDetalle,
          fecha_nacimiento: formFechaNacimiento || null,
          genero: formGenero || null,
          direccion: formDireccion || null,
          tipo_sangre: formTipoSangre || null,
          contacto_emergencia_nombre: formContactoNombre || null,
          contacto_emergencia_telefono: formContactoTelefono || null,
          perfiles: pacienteDetalle.perfiles
            ? {
                ...pacienteDetalle.perfiles,
                nombre_completo: formNombre,
                telefono: formTelefono,
                estado: formEstado,
              }
            : null,
        });
      }

      alert('Paciente actualizado correctamente');
      cerrarEdicion();
      await cargarPacientes();
    } catch {
      alert('Ocurrió un error al guardar');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const verDetalle = async (paciente: PacienteItem) => {
    setPacienteDetalle(paciente);
    setCitasDetalle([]);
    setCargandoDetalle(true);

    try {
      const { data, error } = await supabase
        .from('citas')
        .select('id, fecha, hora_inicio, estado, motivo, doctor_id')
        .eq('paciente_id', paciente.id)
        .order('fecha', { ascending: false });

      if (error) {
        alert('No se pudieron cargar las citas: ' + error.message);
        return;
      }

      setCitasDetalle((data as CitaResumen[]) || []);
    } catch {
      alert('Ocurrió un error al cargar detalle');
    } finally {
      setCargandoDetalle(false);
    }
  };

  return (
    <AdminLayout
      titulo="Pacientes"
      subtitulo="Gestión de pacientes, datos personales e historial básico"
    >
      <section style={styles.gridCards}>
        <div style={styles.card}>
          <p style={styles.cardTitulo}>Total pacientes</p>
          <h3 style={styles.cardValor}>{resumen.total}</h3>
          <p style={styles.cardSubtitulo}>Pacientes registrados</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Activos</p>
          <h3 style={styles.cardValor}>{resumen.activos}</h3>
          <p style={styles.cardSubtitulo}>Con acceso al sistema</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Inactivos</p>
          <h3 style={styles.cardValor}>{resumen.inactivos}</h3>
          <p style={styles.cardSubtitulo}>Sin acceso al sistema</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Con tipo de sangre</p>
          <h3 style={styles.cardValor}>{resumen.conTipoSangre}</h3>
          <p style={styles.cardSubtitulo}>Ficha más completa</p>
        </div>
      </section>

      <section style={localStyles.filtrosBox}>
        <div style={localStyles.filtrosFila}>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={localStyles.input}
          />

          <button style={styles.botonSecundario} onClick={cargarPacientes}>
            Recargar
          </button>
        </div>
      </section>

      <section style={styles.tablaBox}>
        <div style={styles.tablaHeader}>
          <h3 style={styles.tablaTitulo}>Lista de pacientes</h3>
        </div>

        {cargando ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>Cargando pacientes...</p>
          </div>
        ) : error ? (
          <div style={localStyles.estadoBox}>
            <p style={{ ...styles.emptyStateText, color: '#dc2626' }}>{error}</p>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>No se encontraron pacientes</p>
          </div>
        ) : (
          <div style={localStyles.tablaResponsive}>
            <table style={localStyles.tabla}>
              <thead>
                <tr>
                  <th style={localStyles.th}>Nombre</th>
                  <th style={localStyles.th}>Correo</th>
                  <th style={localStyles.th}>Teléfono</th>
                  <th style={localStyles.th}>Tipo de sangre</th>
                  <th style={localStyles.th}>Estado</th>
                  <th style={localStyles.th}>Registro</th>
                  <th style={localStyles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.id}>
                    <td style={localStyles.td}>{paciente.perfiles?.nombre_completo || 'Sin nombre'}</td>
                    <td style={localStyles.td}>{paciente.perfiles?.correo || 'Sin correo'}</td>
                    <td style={localStyles.td}>{paciente.perfiles?.telefono || 'Sin teléfono'}</td>
                    <td style={localStyles.td}>{paciente.tipo_sangre || 'Sin dato'}</td>
                    <td style={localStyles.td}>
                      <span style={obtenerBadgeEstado(paciente.perfiles?.estado || 'inactivo')}>
                        {paciente.perfiles?.estado || 'inactivo'}
                      </span>
                    </td>
                    <td style={localStyles.td}>
                      {paciente.perfiles?.creado_en
                        ? new Date(paciente.perfiles.creado_en).toLocaleDateString()
                        : 'Sin fecha'}
                    </td>
                    <td style={localStyles.td}>
                      <div style={localStyles.accionesFila}>
                        <button style={localStyles.botonVer} onClick={() => verDetalle(paciente)}>
                          Ver
                        </button>

                        <button style={localStyles.botonEditar} onClick={() => abrirEdicion(paciente)}>
                          Editar
                        </button>

                        <button
                          style={
                            paciente.perfiles?.estado === 'activo'
                              ? localStyles.botonDesactivar
                              : localStyles.botonActivar
                          }
                          onClick={() => cambiarEstadoPaciente(paciente)}
                          disabled={procesandoId === paciente.id}
                        >
                          {procesandoId === paciente.id
                            ? 'Guardando...'
                            : paciente.perfiles?.estado === 'activo'
                            ? 'Inactivar'
                            : 'Activar'}
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

      {pacienteEditando && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Editar paciente</h2>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Nombre completo</label>
              <input
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Teléfono</label>
              <input
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Estado</label>
              <select
                value={formEstado}
                onChange={(e) => setFormEstado(e.target.value as 'activo' | 'inactivo')}
                style={localStyles.select}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Fecha de nacimiento</label>
              <input
                type="date"
                value={formFechaNacimiento}
                onChange={(e) => setFormFechaNacimiento(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Género</label>
              <input
                value={formGenero}
                onChange={(e) => setFormGenero(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Dirección</label>
              <input
                value={formDireccion}
                onChange={(e) => setFormDireccion(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Tipo de sangre</label>
              <input
                value={formTipoSangre}
                onChange={(e) => setFormTipoSangre(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Contacto de emergencia</label>
              <input
                value={formContactoNombre}
                onChange={(e) => setFormContactoNombre(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Teléfono emergencia</label>
              <input
                value={formContactoTelefono}
                onChange={(e) => setFormContactoTelefono(e.target.value)}
                style={localStyles.input}
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

      {pacienteDetalle && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modalGrande}>
            <h2 style={localStyles.modalTitulo}>Detalle del paciente</h2>

            <div style={localStyles.detalleGrid}>
              <div style={localStyles.detalleCard}>
                <h3 style={localStyles.subtituloDetalle}>Datos generales</h3>
                <p><b>Nombre:</b> {pacienteDetalle.perfiles?.nombre_completo || 'Sin nombre'}</p>
                <p><b>Correo:</b> {pacienteDetalle.perfiles?.correo || 'Sin correo'}</p>
                <p><b>Teléfono:</b> {pacienteDetalle.perfiles?.telefono || 'Sin teléfono'}</p>
                <p><b>Estado:</b> {pacienteDetalle.perfiles?.estado || 'inactivo'}</p>
                <p><b>Fecha nacimiento:</b> {pacienteDetalle.fecha_nacimiento || 'Sin dato'}</p>
                <p><b>Género:</b> {pacienteDetalle.genero || 'Sin dato'}</p>
                <p><b>Dirección:</b> {pacienteDetalle.direccion || 'Sin dato'}</p>
                <p><b>Tipo de sangre:</b> {pacienteDetalle.tipo_sangre || 'Sin dato'}</p>
                <p><b>Contacto emergencia:</b> {pacienteDetalle.contacto_emergencia_nombre || 'Sin dato'}</p>
                <p><b>Teléfono de emergencia:</b> {pacienteDetalle.contacto_emergencia_telefono || 'Sin dato'}</p>
              </div>

              <div style={localStyles.detalleCard}>
                <h3 style={localStyles.subtituloDetalle}>Citas del paciente</h3>

                {cargandoDetalle ? (
                  <p style={styles.emptyStateText}>Cargando citas...</p>
                ) : citasDetalle.length === 0 ? (
                  <p style={styles.emptyStateText}>No tiene citas registradas</p>
                ) : (
                  <div style={localStyles.listaCitas}>
                    <p><b>Total citas:</b> {citasDetalle.length}</p>
                    {citasDetalle.slice(0, 8).map((cita) => (
                      <div key={cita.id} style={localStyles.citaItem}>
                        <p><b>Fecha:</b> {cita.fecha}</p>
                        <p><b>Hora:</b> {cita.hora_inicio}</p>
                        <p><b>Estado:</b> {cita.estado}</p>
                        <p><b>Motivo:</b> {cita.motivo || 'Sin motivo'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={() => setPacienteDetalle(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function obtenerBadgeEstado(estado: 'activo' | 'inactivo'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  };

  if (estado === 'activo') {
    return { ...base, background: '#DCFCE7', color: '#15803D' };
  }

  return { ...base, background: '#FEE2E2', color: '#B91C1C' };
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
    gridTemplateColumns: '2fr auto',
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
  accionesFila: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
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
  botonEditar: {
    background: '#DBEAFE',
    color: '#1D4ED8',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  botonActivar: {
    background: '#DCFCE7',
    color: '#15803D',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  botonDesactivar: {
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
    maxWidth: '620px',
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalGrande: {
    width: '100%',
    maxWidth: '980px',
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
  detalleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  detalleCard: {
    background: '#F8FAFC',
    borderRadius: '18px',
    padding: '18px',
    color: '#334155',
    fontSize: '14px',
    lineHeight: 1.7,
  },
  subtituloDetalle: {
    margin: '0 0 12px',
    fontSize: '18px',
    fontWeight: '700',
    color: '#0A2540',
  },
  listaCitas: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  citaItem: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '12px',
  },
};