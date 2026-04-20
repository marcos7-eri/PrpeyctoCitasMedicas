import { useEffect, useMemo, useState } from 'react';
import AdminLayout, { styles } from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface PerfilBasico {
  nombre_completo: string;
  correo: string;
  telefono?: string | null;
}

interface PacienteRelacion {
  id: string;
  perfiles: PerfilBasico | null;
}

interface DoctorRelacion {
  id: string;
  perfiles: PerfilBasico | null;
  especialidades?: {
    nombre: string;
  } | null;
}

interface CitaItem {
  id: string;
  paciente_id: string;
  doctor_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin?: string | null;
  estado: string;
  motivo?: string | null;
  notas?: string | null;
  motivo_cancelacion?: string | null;
  creado_en?: string | null;
  pacientes: PacienteRelacion | null;
  doctores: DoctorRelacion | null;
}

interface PacienteOption {
  id: string;
  perfiles: {
    nombre_completo: string;
    correo: string;
  } | null;
}

interface DoctorOption {
  id: string;
  perfiles: {
    nombre_completo: string;
    correo: string;
  } | null;
  especialidades?: {
    nombre: string;
  } | null;
}

export default function CitasAdmin() {
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [doctores, setDoctores] = useState<DoctorOption[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [citaDetalle, setCitaDetalle] = useState<CitaItem | null>(null);

  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [guardandoNueva, setGuardandoNueva] = useState(false);

  const [nuevoPacienteId, setNuevoPacienteId] = useState('');
  const [nuevoDoctorId, setNuevoDoctorId] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHoraInicio, setNuevaHoraInicio] = useState('');
  const [nuevaHoraFin, setNuevaHoraFin] = useState('');
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [nuevasNotas, setNuevasNotas] = useState('');

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    await Promise.all([cargarCitas(), cargarPacientes(), cargarDoctores()]);
  };

  const cargarCitas = async () => {
    try {
      setCargando(true);
      setError('');

      const { data, error } = await supabase
        .from('citas')
        .select(`
          id,
          paciente_id,
          doctor_id,
          fecha,
          hora_inicio,
          hora_fin,
          estado,
          motivo,
          notas,
          motivo_cancelacion,
          creado_en,
          pacientes (
            id,
            perfiles (
              nombre_completo,
              correo,
              telefono
            )
          ),
          doctores (
            id,
            perfiles (
              nombre_completo,
              correo,
              telefono
            ),
            especialidades (
              nombre
            )
          )
        `)
        .order('fecha', { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setCitas((data as unknown as CitaItem[]) || []);
    } catch {
      setError('No se pudieron cargar las citas');
    } finally {
      setCargando(false);
    }
  };

  const cargarPacientes = async () => {
    const { data } = await supabase
      .from('pacientes')
      .select(`
        id,
        perfiles (
          nombre_completo,
          correo
        )
      `);

    setPacientes((data as unknown as PacienteOption[]) || []);
  };

  const cargarDoctores = async () => {
    const { data } = await supabase
      .from('doctores')
      .select(`
        id,
        perfiles (
          nombre_completo,
          correo
        ),
        especialidades (
          nombre
        )
      `);

    setDoctores((data as unknown as DoctorOption[]) || []);
  };

  const abrirModalNueva = () => {
    setMostrarModalNueva(true);
  };

  const cerrarModalNueva = () => {
    setMostrarModalNueva(false);
    setNuevoPacienteId('');
    setNuevoDoctorId('');
    setNuevaFecha('');
    setNuevaHoraInicio('');
    setNuevaHoraFin('');
    setNuevoMotivo('');
    setNuevasNotas('');
  };

  const crearCita = async () => {
    if (!nuevoPacienteId || !nuevoDoctorId || !nuevaFecha || !nuevaHoraInicio) {
      alert('Completa paciente, doctor, fecha y hora de inicio');
      return;
    }

    try {
      setGuardandoNueva(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const creadorId = sessionData.session?.user?.id || null;

      const payload: any = {
        paciente_id: nuevoPacienteId,
        doctor_id: nuevoDoctorId,
        fecha: nuevaFecha,
        hora_inicio: nuevaHoraInicio,
        hora_fin: nuevaHoraFin || null,
        estado: 'pendiente',
        motivo: nuevoMotivo || null,
        notas: nuevasNotas || null,
      };

      if (creadorId) {
        payload.creado_por = creadorId;
      }

      const { error } = await supabase.from('citas').insert(payload);

      if (error) {
        alert('No se pudo crear la cita: ' + error.message);
        return;
      }

      alert('Cita creada correctamente');
      cerrarModalNueva();
      await cargarCitas();
    } catch {
      alert('Ocurrió un error al crear la cita');
    } finally {
      setGuardandoNueva(false);
    }
  };

  const cambiarEstado = async (cita: CitaItem, nuevoEstado: string) => {
  try {
    setProcesandoId(cita.id);

    const { data, error } = await supabase
      .from('citas')
      .update({ estado: nuevoEstado })
      .eq('id', cita.id)
      .select();

    console.log('UPDATE CITA DATA:', data);
    console.log('UPDATE CITA ERROR:', error);

    if (error) {
      alert('No se pudo actualizar la cita: ' + error.message);
      return;
    }

    await cargarCitas();

    if (citaDetalle && citaDetalle.id === cita.id) {
      setCitaDetalle({
        ...citaDetalle,
        estado: nuevoEstado,
      });
    }
  } catch (e) {
    console.error(e);
    alert('Ocurrió un error al actualizar la cita');
  } finally {
    setProcesandoId(null);
  }
};
  const cancelarCita = async (cita: CitaItem) => {
  const motivo = window.prompt('Escribe el motivo de cancelación');
  if (motivo === null) return;

  try {
    setProcesandoId(cita.id);

    const { data, error } = await supabase
      .from('citas')
      .update({
        estado: 'cancelada',
        motivo_cancelacion: motivo || null,
      })
      .eq('id', cita.id)
      .select();

    console.log('CANCELAR CITA DATA:', data);
    console.log('CANCELAR CITA ERROR:', error);

    if (error) {
      alert('No se pudo cancelar la cita: ' + error.message);
      return;
    }

    await cargarCitas();

    if (citaDetalle && citaDetalle.id === cita.id) {
      setCitaDetalle({
        ...citaDetalle,
        estado: 'cancelada',
        motivo_cancelacion: motivo || null,
      });
    }
  } catch (e) {
    console.error(e);
    alert('Ocurrió un error al cancelar la cita');
  } finally {
    setProcesandoId(null);
  }
};

  const citasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return citas.filter((cita) => {
      const paciente = cita.pacientes?.perfiles?.nombre_completo?.toLowerCase() || '';
      const doctor = cita.doctores?.perfiles?.nombre_completo?.toLowerCase() || '';
      const motivo = cita.motivo?.toLowerCase() || '';

      const coincideBusqueda =
        paciente.includes(texto) ||
        doctor.includes(texto) ||
        motivo.includes(texto);

      const coincideEstado =
        filtroEstado === 'todos' ? true : cita.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [citas, busqueda, filtroEstado]);

  const resumen = useMemo(() => {
    return {
      total: citas.length,
      pendientes: citas.filter((c) => c.estado === 'pendiente').length,
      confirmados: citas.filter((c) => c.estado === 'confirmado').length,
      canceladas: citas.filter((c) => c.estado === 'cancelada').length,
    };
  }, [citas]);

  return (
    <AdminLayout
      titulo="Citas"
      subtitulo="Gestión general de citas médicas"
    >
      <section style={styles.gridCards}>
        <div style={styles.card}>
          <p style={styles.cardTitulo}>Total citas</p>
          <h3 style={styles.cardValor}>{resumen.total}</h3>
          <p style={styles.cardSubtitulo}>Citas registradas</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Pendientes</p>
          <h3 style={styles.cardValor}>{resumen.pendientes}</h3>
          <p style={styles.cardSubtitulo}>Por confirmar</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>confirmados</p>
          <h3 style={styles.cardValor}>{resumen.confirmados}</h3>
          <p style={styles.cardSubtitulo}>Citas activas</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Canceladas</p>
          <h3 style={styles.cardValor}>{resumen.canceladas}</h3>
          <p style={styles.cardSubtitulo}>No vigentes</p>
        </div>
      </section>

      <section style={localStyles.filtrosBox}>
        <div style={localStyles.filtrosFila}>
          <input
            type="text"
            placeholder="Buscar por paciente, doctor o motivo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={localStyles.input}
          />

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={localStyles.select}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">confirmado</option>
            <option value="cancelada">Cancelada</option>
            <option value="completada">Completada</option>
          </select>

          <button style={styles.botonSecundario} onClick={cargarCitas}>
            Recargar
          </button>

          <button style={styles.botonPrincipal} onClick={abrirModalNueva}>
            Nueva cita
          </button>
        </div>
      </section>

      <section style={styles.tablaBox}>
        <div style={styles.tablaHeader}>
          <h3 style={styles.tablaTitulo}>Lista de citas</h3>
        </div>

        {cargando ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>Cargando citas...</p>
          </div>
        ) : error ? (
          <div style={localStyles.estadoBox}>
            <p style={{ ...styles.emptyStateText, color: '#dc2626' }}>{error}</p>
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>No se encontraron citas</p>
          </div>
        ) : (
          <div style={localStyles.tablaResponsive}>
            <table style={localStyles.tabla}>
              <thead>
                <tr>
                  <th style={localStyles.th}>Paciente</th>
                  <th style={localStyles.th}>Doctor</th>
                  <th style={localStyles.th}>Fecha</th>
                  <th style={localStyles.th}>Hora</th>
                  <th style={localStyles.th}>Motivo</th>
                  <th style={localStyles.th}>Estado</th>
                  <th style={localStyles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.map((cita) => (
                  <tr key={cita.id}>
                    <td style={localStyles.td}>
                      {cita.pacientes?.perfiles?.nombre_completo || 'Sin paciente'}
                    </td>
                    <td style={localStyles.td}>
                      {cita.doctores?.perfiles?.nombre_completo || 'Sin doctor'}
                    </td>
                    <td style={localStyles.td}>{cita.fecha}</td>
                    <td style={localStyles.td}>
                      {cita.hora_inicio}
                      {cita.hora_fin ? ` - ${cita.hora_fin}` : ''}
                    </td>
                    <td style={localStyles.td}>{cita.motivo || 'Sin motivo'}</td>
                    <td style={localStyles.td}>
                      <span style={obtenerBadgeEstado(cita.estado)}>{cita.estado}</span>
                    </td>
                    <td style={localStyles.td}>
                      <div style={localStyles.accionesFila}>
                        <button
                          style={localStyles.botonVer}
                          onClick={() => setCitaDetalle(cita)}
                        >
                          Ver
                        </button>

                        <button
                          style={localStyles.botonConfirmar}
                          onClick={() => cambiarEstado(cita, 'confirmado')}
                          disabled={procesandoId === cita.id}
                        >
                          Confirmar
                        </button>

                        <button
                          style={localStyles.botonCompletar}
                          onClick={() => cambiarEstado(cita, 'completada')}
                          disabled={procesandoId === cita.id}
                        >
                          Completar
                        </button>

                        <button
                          style={localStyles.botonCancelar}
                          onClick={() => cancelarCita(cita)}
                          disabled={procesandoId === cita.id}
                        >
                          Cancelar
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
            <h2 style={localStyles.modalTitulo}>Nueva cita</h2>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Paciente</label>
              <select
                value={nuevoPacienteId}
                onChange={(e) => setNuevoPacienteId(e.target.value)}
                style={localStyles.select}
              >
                <option value="">Seleccione paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.perfiles?.nombre_completo || 'Sin nombre'} - {p.perfiles?.correo || 'Sin correo'}
                  </option>
                ))}
              </select>
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Doctor</label>
              <select
                value={nuevoDoctorId}
                onChange={(e) => setNuevoDoctorId(e.target.value)}
                style={localStyles.select}
              >
                <option value="">Seleccione doctor</option>
                {doctores.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.perfiles?.nombre_completo || 'Sin nombre'}
                    {d.especialidades?.nombre ? ` - ${d.especialidades.nombre}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Fecha</label>
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.dobleColumna}>
              <div style={localStyles.formGrupo}>
                <label style={localStyles.label}>Hora inicio</label>
                <input
                  type="time"
                  value={nuevaHoraInicio}
                  onChange={(e) => setNuevaHoraInicio(e.target.value)}
                  style={localStyles.input}
                />
              </div>

              <div style={localStyles.formGrupo}>
                <label style={localStyles.label}>Hora fin</label>
                <input
                  type="time"
                  value={nuevaHoraFin}
                  onChange={(e) => setNuevaHoraFin(e.target.value)}
                  style={localStyles.input}
                />
              </div>
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Motivo</label>
              <input
                type="text"
                value={nuevoMotivo}
                onChange={(e) => setNuevoMotivo(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Notas</label>
              <textarea
                value={nuevasNotas}
                onChange={(e) => setNuevasNotas(e.target.value)}
                style={localStyles.textarea}
              />
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={cerrarModalNueva}>
                Cancelar
              </button>
              <button
                style={styles.botonPrincipal}
                onClick={crearCita}
                disabled={guardandoNueva}
              >
                {guardandoNueva ? 'Guardando...' : 'Crear cita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {citaDetalle && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Detalle de la cita</h2>

            <div style={localStyles.detalleBox}>
              <p><b>Paciente:</b> {citaDetalle.pacientes?.perfiles?.nombre_completo || 'Sin paciente'}</p>
              <p><b>Correo paciente:</b> {citaDetalle.pacientes?.perfiles?.correo || 'Sin correo'}</p>
              <p><b>Doctor:</b> {citaDetalle.doctores?.perfiles?.nombre_completo || 'Sin doctor'}</p>
              <p><b>Correo doctor:</b> {citaDetalle.doctores?.perfiles?.correo || 'Sin correo'}</p>
              <p><b>Especialidad:</b> {citaDetalle.doctores?.especialidades?.nombre || 'Sin especialidad'}</p>
              <p><b>Fecha:</b> {citaDetalle.fecha}</p>
              <p><b>Hora inicio:</b> {citaDetalle.hora_inicio}</p>
              <p><b>Hora fin:</b> {citaDetalle.hora_fin || 'Sin hora fin'}</p>
              <p><b>Estado:</b> {citaDetalle.estado}</p>
              <p><b>Motivo:</b> {citaDetalle.motivo || 'Sin motivo'}</p>
              <p><b>Notas:</b> {citaDetalle.notas || 'Sin notas'}</p>
              <p><b>Motivo cancelación:</b> {citaDetalle.motivo_cancelacion || 'Sin dato'}</p>
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={() => setCitaDetalle(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function obtenerBadgeEstado(estado: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  };

  if (estado === 'pendiente') {
    return { ...base, background: '#FEF3C7', color: '#B45309' };
  }

  if (estado === 'confirmado') {
    return { ...base, background: '#DCFCE7', color: '#15803D' };
  }

  if (estado === 'cancelada') {
    return { ...base, background: '#FEE2E2', color: '#B91C1C' };
  }

  if (estado === 'completada') {
    return { ...base, background: '#DBEAFE', color: '#1D4ED8' };
  }

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
    gridTemplateColumns: '2fr 1fr auto auto',
    gap: '12px',
  },
  dobleColumna: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
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
    minHeight: '100px',
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
  botonConfirmar: {
    background: '#DCFCE7',
    color: '#15803D',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  botonCompletar: {
    background: '#DBEAFE',
    color: '#1D4ED8',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  botonCancelar: {
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
    maxWidth: '760px',
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