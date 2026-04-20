import { useEffect, useMemo, useState } from 'react';
import AdminLayout, { styles } from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface DoctorItem {
  id: string;
  perfil_id: string;
  especialidad_id: number | null;
  numero_licencia: string | null;
  anios_experiencia: number | null;
  costo_consulta: number | null;
  biografia: string | null;
  perfiles: {
    id: string;
    nombre_completo: string;
    correo: string;
    telefono?: string | null;
    estado: 'activo' | 'inactivo';
  } | null;
  especialidades: {
    id: number;
    nombre: string;
  } | null;
}

interface EspecialidadItem {
  id: number;
  nombre: string;
}

export default function DoctoresAdmin() {
  const [doctores, setDoctores] = useState<DoctorItem[]>([]);
  const [especialidades, setEspecialidades] = useState<EspecialidadItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas');

  const [doctorEditando, setDoctorEditando] = useState<DoctorItem | null>(null);
  const [formLicencia, setFormLicencia] = useState('');
  const [formExperiencia, setFormExperiencia] = useState('');
  const [formCosto, setFormCosto] = useState('');
  const [formBiografia, setFormBiografia] = useState('');
  const [formEspecialidadId, setFormEspecialidadId] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState<DoctorItem | null>(null);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [nuevaLicencia, setNuevaLicencia] = useState('');
  const [nuevaExperiencia, setNuevaExperiencia] = useState('');
  const [nuevoCosto, setNuevoCosto] = useState('');
  const [nuevaBiografia, setNuevaBiografia] = useState('');
  const [nuevaEspecialidadId, setNuevaEspecialidadId] = useState('');
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  useEffect(() => {
    cargarDoctores();
    cargarEspecialidades();
  }, []);

  const cargarDoctores = async () => {
    try {
      setCargando(true);
      setError('');

      const { data, error } = await supabase
        .from('doctores')
        .select(`
          id,
          perfil_id,
          especialidad_id,
          numero_licencia,
          anios_experiencia,
          costo_consulta,
          biografia,
          perfiles (
            id,
            nombre_completo,
            correo,
            telefono,
            estado
          ),
          especialidades (
            id,
            nombre
          )
        `);

      if (error) {
        setError(error.message);
        return;
      }

      setDoctores((data as unknown as DoctorItem[]) || []);
    } catch {
      setError('No se pudieron cargar los doctores');
    } finally {
      setCargando(false);
    }
  };

  const cargarEspecialidades = async () => {
    const { data } = await supabase
      .from('especialidades')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    setEspecialidades((data as EspecialidadItem[]) || []);
  };

  const abrirEdicion = (doctor: DoctorItem) => {
    setDoctorEditando(doctor);
    setFormLicencia(doctor.numero_licencia || '');
    setFormExperiencia(doctor.anios_experiencia ? String(doctor.anios_experiencia) : '');
    setFormCosto(doctor.costo_consulta ? String(doctor.costo_consulta) : '');
    setFormBiografia(doctor.biografia || '');
    setFormEspecialidadId(doctor.especialidad_id ? String(doctor.especialidad_id) : '');
  };

  const cerrarEdicion = () => {
    setDoctorEditando(null);
    setFormLicencia('');
    setFormExperiencia('');
    setFormCosto('');
    setFormBiografia('');
    setFormEspecialidadId('');
  };

  const guardarEdicion = async () => {
    if (!doctorEditando) return;

    try {
      setGuardandoEdicion(true);

      const { error } = await supabase
        .from('doctores')
        .update({
          numero_licencia: formLicencia,
          anios_experiencia: formExperiencia ? Number(formExperiencia) : null,
          costo_consulta: formCosto ? Number(formCosto) : null,
          biografia: formBiografia,
          especialidad_id: formEspecialidadId ? Number(formEspecialidadId) : null,
        })
        .eq('id', doctorEditando.id);

      if (error) {
        alert('No se pudo actualizar el doctor: ' + error.message);
        return;
      }

      await cargarDoctores();
      cerrarEdicion();
    } catch {
      alert('Ocurrió un error al guardar los cambios');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const abrirNuevo = () => setMostrarModalNuevo(true);

  const cerrarNuevo = () => {
    setMostrarModalNuevo(false);
    setNuevoNombre('');
    setNuevoCorreo('');
    setNuevoTelefono('');
    setNuevaContrasena('');
    setNuevaLicencia('');
    setNuevaExperiencia('');
    setNuevoCosto('');
    setNuevaBiografia('');
    setNuevaEspecialidadId('');
  };

  const guardarNuevoDoctor = async () => {
  if (!nuevoNombre || !nuevoCorreo || !nuevaContrasena) {
    alert('Completa nombre, correo y contraseña');
    return;
  }

  try {
    setGuardandoNuevo(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert('No se encontró la sesión del usuario administrador');
      return;
    }

    const { data, error } = await supabase.functions.invoke('crear-doctor', {
      body: {
        nombre_completo: nuevoNombre,
        correo: nuevoCorreo,
        telefono: nuevoTelefono,
        contrasena: nuevaContrasena,
        estado: 'activo',
        especialidad_id: nuevaEspecialidadId || null,
        numero_licencia: nuevaLicencia,
        anios_experiencia: nuevaExperiencia || null,
        costo_consulta: nuevoCosto || null,
        biografia: nuevaBiografia,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
    },
    });

    console.log('RESPUESTA FUNCIÓN:', data);

    if (error) {
      console.error('ERROR EDGE FUNCTION:', error);
      alert('Error al crear doctor: ' + JSON.stringify(error));
      return;
    }

    if (data?.error) {
      alert('Error: ' + data.error);
      return;
    }

    alert('Doctor creado correctamente');
    cerrarNuevo();
    await cargarDoctores();
  } catch (err) {
    console.error(err);
    alert('Ocurrió un error al crear el doctor');
  } finally {
    setGuardandoNuevo(false);
  }
};

  const doctoresFiltrados = useMemo(() => {
    return doctores.filter((doctor) => {
      const nombre = doctor.perfiles?.nombre_completo?.toLowerCase() || '';
      const correo = doctor.perfiles?.correo?.toLowerCase() || '';
      const telefono = doctor.perfiles?.telefono?.toLowerCase() || '';
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        nombre.includes(texto) ||
        correo.includes(texto) ||
        telefono.includes(texto) ||
        (doctor.numero_licencia || '').toLowerCase().includes(texto);

      const coincideEspecialidad =
        filtroEspecialidad === 'todas'
          ? true
          : String(doctor.especialidad_id || '') === filtroEspecialidad;

      return coincideBusqueda && coincideEspecialidad;
    });
  }, [doctores, busqueda, filtroEspecialidad]);

  const resumen = useMemo(() => {
    return {
      total: doctores.length,
      activos: doctores.filter((d) => d.perfiles?.estado === 'activo').length,
      inactivos: doctores.filter((d) => d.perfiles?.estado === 'inactivo').length,
      conEspecialidad: doctores.filter((d) => d.especialidades?.nombre).length,
    };
  }, [doctores]);

  return (
    <AdminLayout
      titulo="Doctores"
      subtitulo="Registro y gestion de informacion profesional de los doctores"
    >
      <section style={styles.gridCards}>
        <div style={styles.card}>
          <p style={styles.cardTitulo}>Total doctores</p>
          <h3 style={styles.cardValor}>{resumen.total}</h3>
          <p style={styles.cardSubtitulo}>Doctores registrados</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Activos</p>
          <h3 style={styles.cardValor}>{resumen.activos}</h3>
          <p style={styles.cardSubtitulo}>Disponibles en el sistema</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Inactivos</p>
          <h3 style={styles.cardValor}>{resumen.inactivos}</h3>
          <p style={styles.cardSubtitulo}>Sin acceso al sistema</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Con especialidad</p>
          <h3 style={styles.cardValor}>{resumen.conEspecialidad}</h3>
          <p style={styles.cardSubtitulo}>Perfil profesional completo</p>
        </div>
      </section>

      <section style={localStyles.filtrosBox}>
        <div style={localStyles.filtrosFila}>
          <input
            type="text"
            placeholder="Buscar por nombre, correo, telefono o licencia"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={localStyles.input}
          />

          <select
            value={filtroEspecialidad}
            onChange={(e) => setFiltroEspecialidad(e.target.value)}
            style={localStyles.select}
          >
            <option value="todas">Todas las especialidades</option>
            {especialidades.map((esp) => (
              <option key={esp.id} value={esp.id}>
                {esp.nombre}
              </option>
            ))}
          </select>

          <button style={styles.botonSecundario} onClick={cargarDoctores}>
            Recargar
          </button>
        </div>
      </section>

      <section style={styles.tablaBox}>
        <div style={styles.tablaHeader}>
          <h3 style={styles.tablaTitulo}>Lista de doctores</h3>
          <button style={styles.botonPrincipal} onClick={abrirNuevo}>
            Nuevo doctor
          </button>
        </div>

        {cargando ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>Cargando doctores...</p>
          </div>
        ) : error ? (
          <div style={localStyles.estadoBox}>
            <p style={{ ...styles.emptyStateText, color: '#dc2626' }}>{error}</p>
          </div>
        ) : doctoresFiltrados.length === 0 ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>No se encontraron doctores</p>
          </div>
        ) : (
          <div style={localStyles.tablaResponsive}>
            <table style={localStyles.tabla}>
              <thead>
                <tr>
                  <th style={localStyles.th}>Nombre</th>
                  <th style={localStyles.th}>Correo</th>
                  <th style={localStyles.th}>Telefono</th>
                  <th style={localStyles.th}>Especialidad</th>
                  <th style={localStyles.th}>Licencia</th>
                  <th style={localStyles.th}>Experiencia</th>
                  <th style={localStyles.th}>Consulta</th>
                  <th style={localStyles.th}>Estado</th>
                  <th style={localStyles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {doctoresFiltrados.map((doctor) => (
                  <tr key={doctor.id}>
                    <td style={localStyles.td}>{doctor.perfiles?.nombre_completo || 'Sin nombre'}</td>
                    <td style={localStyles.td}>{doctor.perfiles?.correo || 'Sin correo'}</td>
                    <td style={localStyles.td}>{doctor.perfiles?.telefono || 'Sin telefono'}</td>
                    <td style={localStyles.td}>{doctor.especialidades?.nombre || 'Sin especialidad'}</td>
                    <td style={localStyles.td}>{doctor.numero_licencia || 'Sin licencia'}</td>
                    <td style={localStyles.td}>
                      {doctor.anios_experiencia !== null && doctor.anios_experiencia !== undefined
                        ? `${doctor.anios_experiencia} años`
                        : 'Sin dato'}
                    </td>
                    <td style={localStyles.td}>
                      {doctor.costo_consulta !== null && doctor.costo_consulta !== undefined
                        ? `Bs ${doctor.costo_consulta}`
                        : 'Sin costo'}
                    </td>
                    <td style={localStyles.td}>
                      <span style={obtenerBadgeEstado(doctor.perfiles?.estado || 'inactivo')}>
                        {doctor.perfiles?.estado || 'inactivo'}
                      </span>
                    </td>
                    <td style={localStyles.td}>
                      <div style={localStyles.accionesFila}>
                        <button
                          style={localStyles.botonVer}
                          onClick={() => setMostrarDetalle(doctor)}
                        >
                          Ver
                        </button>

                        <button
                          style={localStyles.botonEditar}
                          onClick={() => abrirEdicion(doctor)}
                        >
                          Editar
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

      {doctorEditando && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Editar doctor</h2>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Especialidad</label>
              <select
                value={formEspecialidadId}
                onChange={(e) => setFormEspecialidadId(e.target.value)}
                style={localStyles.select}
              >
                <option value="">Seleccione especialidad</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.id}>
                    {esp.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Numero de licencia</label>
              <input
                type="text"
                value={formLicencia}
                onChange={(e) => setFormLicencia(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Años de experiencia</label>
              <input
                type="number"
                value={formExperiencia}
                onChange={(e) => setFormExperiencia(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Costo de consulta</label>
              <input
                type="number"
                value={formCosto}
                onChange={(e) => setFormCosto(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Biografia</label>
              <textarea
                value={formBiografia}
                onChange={(e) => setFormBiografia(e.target.value)}
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

      {mostrarModalNuevo && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Nuevo doctor</h2>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Nombre completo</label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Correo</label>
              <input
                type="email"
                value={nuevoCorreo}
                onChange={(e) => setNuevoCorreo(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Telefono</label>
              <input
                type="text"
                value={nuevoTelefono}
                onChange={(e) => setNuevoTelefono(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Contraseña</label>
              <input
                type="password"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Especialidad</label>
              <select
                value={nuevaEspecialidadId}
                onChange={(e) => setNuevaEspecialidadId(e.target.value)}
                style={localStyles.select}
              >
                <option value="">Seleccione especialidad</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.id}>
                    {esp.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Licencia</label>
              <input
                type="text"
                value={nuevaLicencia}
                onChange={(e) => setNuevaLicencia(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Experiencia</label>
              <input
                type="number"
                value={nuevaExperiencia}
                onChange={(e) => setNuevaExperiencia(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Costo consulta</label>
              <input
                type="number"
                value={nuevoCosto}
                onChange={(e) => setNuevoCosto(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Biografia</label>
              <textarea
                value={nuevaBiografia}
                onChange={(e) => setNuevaBiografia(e.target.value)}
                style={localStyles.textarea}
              />
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={cerrarNuevo}>
                Cancelar
              </button>
              <button style={styles.botonPrincipal} onClick={guardarNuevoDoctor}>
                {guardandoNuevo ? 'Guardando...' : 'Crear doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarDetalle && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Detalle del doctor</h2>

            <div style={localStyles.detalleBox}>
              <p><b>Nombre:</b> {mostrarDetalle.perfiles?.nombre_completo || 'Sin nombre'}</p>
              <p><b>Correo:</b> {mostrarDetalle.perfiles?.correo || 'Sin correo'}</p>
              <p><b>Telefono:</b> {mostrarDetalle.perfiles?.telefono || 'Sin telefono'}</p>
              <p><b>Estado:</b> {mostrarDetalle.perfiles?.estado || 'inactivo'}</p>
              <p><b>Especialidad:</b> {mostrarDetalle.especialidades?.nombre || 'Sin especialidad'}</p>
              <p><b>Licencia:</b> {mostrarDetalle.numero_licencia || 'Sin licencia'}</p>
              <p><b>Experiencia:</b> {mostrarDetalle.anios_experiencia ?? 'Sin dato'} años</p>
              <p><b>Costo:</b> {mostrarDetalle.costo_consulta ?? 'Sin dato'}</p>
              <p><b>Biografia:</b> {mostrarDetalle.biografia || 'Sin biografia'}</p>
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={() => setMostrarDetalle(null)}>
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
  textarea: {
    width: '100%',
    minHeight: '110px',
    padding: '14px 16px',
    border: '1px solid #CBD5E1',
    borderRadius: '14px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxSizing: 'border-box',
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
  detalleBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    color: '#334155',
    fontSize: '14px',
  },
};