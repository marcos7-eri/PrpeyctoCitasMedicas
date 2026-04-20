import { useEffect, useMemo, useState } from 'react';
import AdminLayout, { styles } from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface UsuarioPerfil {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono?: string | null;
  rol: 'admin' | 'doctor' | 'paciente';
  estado: 'activo' | 'inactivo';
  creado_en?: string;
}

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioPerfil | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formRol, setFormRol] = useState<'admin' | 'doctor' | 'paciente'>('paciente');
  const [formEstado, setFormEstado] = useState<'activo' | 'inactivo'>('activo');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [nuevoRol, setNuevoRol] = useState<'admin' | 'doctor' | 'paciente'>('paciente');
  const [nuevoEstado, setNuevoEstado] = useState<'activo' | 'inactivo'>('activo');
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError('');

      const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, correo, telefono, rol, estado, creado_en')
        .order('creado_en', { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setUsuarios((data as UsuarioPerfil[]) || []);
    } catch {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoUsuario = async (usuario: UsuarioPerfil) => {
    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo';

    try {
      setProcesandoId(usuario.id);

      const { error } = await supabase
        .from('perfiles')
        .update({ estado: nuevoEstado })
        .eq('id', usuario.id);

      if (error) {
        alert('No se pudo actualizar el estado: ' + error.message);
        return;
      }

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, estado: nuevoEstado as 'activo' | 'inactivo' } : u
        )
      );
    } catch {
      alert('Ocurrió un error al cambiar el estado');
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirEdicion = (usuario: UsuarioPerfil) => {
    setUsuarioEditando(usuario);
    setFormNombre(usuario.nombre_completo || '');
    setFormTelefono(usuario.telefono || '');
    setFormRol(usuario.rol);
    setFormEstado(usuario.estado);
  };

  const cerrarEdicion = () => {
    setUsuarioEditando(null);
    setFormNombre('');
    setFormTelefono('');
    setFormRol('paciente');
    setFormEstado('activo');
  };

  const guardarEdicion = async () => {
    if (!usuarioEditando) return;

    try {
      setGuardandoEdicion(true);

      const { error } = await supabase
        .from('perfiles')
        .update({
          nombre_completo: formNombre,
          telefono: formTelefono,
          rol: formRol,
          estado: formEstado,
        })
        .eq('id', usuarioEditando.id);

      if (error) {
        alert('No se pudo actualizar el usuario: ' + error.message);
        return;
      }

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioEditando.id
            ? {
                ...u,
                nombre_completo: formNombre,
                telefono: formTelefono,
                rol: formRol,
                estado: formEstado,
              }
            : u
        )
      );

      cerrarEdicion();
    } catch {
      alert('Ocurrió un error al guardar');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const abrirModalNuevo = () => {
    setMostrarModalNuevo(true);
  };

  const cerrarModalNuevo = () => {
    setMostrarModalNuevo(false);
    setNuevoNombre('');
    setNuevoCorreo('');
    setNuevoTelefono('');
    setNuevaContrasena('');
    setNuevoRol('paciente');
    setNuevoEstado('activo');
  };

  const guardarNuevoUsuario = async () => {
    if (!nuevoNombre || !nuevoCorreo || !nuevaContrasena) {
      alert('Completa nombre, correo y contraseña');
      return;
    }

    if (nuevoRol === 'doctor') {
      alert('Los doctores deben registrarse desde el modulo Doctores');
      return;
    }

    try {
      setGuardandoNuevo(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert('No se encontro la sesion del administrador');
        return;
      }

      const { data, error } = await supabase.functions.invoke('crear-usuario', {
        body: {
          nombre_completo: nuevoNombre,
          correo: nuevoCorreo,
          telefono: nuevoTelefono,
          contrasena: nuevaContrasena,
          rol: nuevoRol,
          estado: nuevoEstado,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        alert('Error al crear usuario: ' + JSON.stringify(error));
        return;
      }

      if (data?.error) {
        alert('Error: ' + data.error);
        return;
      }

      alert('Usuario creado correctamente');
      cerrarModalNuevo();
      await cargarUsuarios();
    } catch {
      alert('Ocurrio un error al crear el usuario');
    } finally {
      setGuardandoNuevo(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        usuario.nombre_completo?.toLowerCase().includes(texto) ||
        usuario.correo?.toLowerCase().includes(texto) ||
        usuario.telefono?.toLowerCase().includes(texto);

      const coincideRol = filtroRol === 'todos' ? true : usuario.rol === filtroRol;
      const coincideEstado = filtroEstado === 'todos' ? true : usuario.estado === filtroEstado;

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const resumen = useMemo(() => {
    return {
      total: usuarios.length,
      admins: usuarios.filter((u) => u.rol === 'admin').length,
      doctores: usuarios.filter((u) => u.rol === 'doctor').length,
      pacientes: usuarios.filter((u) => u.rol === 'paciente').length,
    };
  }, [usuarios]);

  return (
    <AdminLayout
      titulo="Usuarios"
      subtitulo="Gestion de cuentas y control de acceso del sistema"
    >
      <section style={styles.gridCards}>
        <div style={styles.card}>
          <p style={styles.cardTitulo}>Total usuarios</p>
          <h3 style={styles.cardValor}>{resumen.total}</h3>
          <p style={styles.cardSubtitulo}>Usuarios registrados</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Administradores</p>
          <h3 style={styles.cardValor}>{resumen.admins}</h3>
          <p style={styles.cardSubtitulo}>Cuentas administrativas</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Doctores</p>
          <h3 style={styles.cardValor}>{resumen.doctores}</h3>
          <p style={styles.cardSubtitulo}>Usuarios con rol doctor</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Pacientes</p>
          <h3 style={styles.cardValor}>{resumen.pacientes}</h3>
          <p style={styles.cardSubtitulo}>Usuarios con rol paciente</p>
        </div>
      </section>

      <section style={localStyles.filtrosBox}>
        <div style={localStyles.filtrosFila}>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o telefono"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={localStyles.input}
          />

          <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} style={localStyles.select}>
            <option value="todos">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="doctor">Doctor</option>
            <option value="paciente">Paciente</option>
          </select>

          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={localStyles.select}>
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          <button style={styles.botonSecundario} onClick={cargarUsuarios}>
            Recargar
          </button>
        </div>
      </section>

      <section style={styles.tablaBox}>
        <div style={styles.tablaHeader}>
          <h3 style={styles.tablaTitulo}>Lista de usuarios</h3>
          <button style={styles.botonPrincipal} onClick={abrirModalNuevo}>
            Nuevo usuario
          </button>
        </div>

        {cargando ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div style={localStyles.estadoBox}>
            <p style={{ ...styles.emptyStateText, color: '#dc2626' }}>{error}</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={localStyles.estadoBox}>
            <p style={styles.emptyStateText}>No se encontraron usuarios</p>
          </div>
        ) : (
          <div style={localStyles.tablaResponsive}>
            <table style={localStyles.tabla}>
              <thead>
                <tr>
                  <th style={localStyles.th}>Nombre</th>
                  <th style={localStyles.th}>Correo</th>
                  <th style={localStyles.th}>Telefono</th>
                  <th style={localStyles.th}>Rol</th>
                  <th style={localStyles.th}>Estado</th>
                  <th style={localStyles.th}>Fecha</th>
                  <th style={localStyles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td style={localStyles.td}>{usuario.nombre_completo || 'Sin nombre'}</td>
                    <td style={localStyles.td}>{usuario.correo}</td>
                    <td style={localStyles.td}>{usuario.telefono || 'Sin telefono'}</td>
                    <td style={localStyles.td}>
                      <span style={obtenerBadgeRol(usuario.rol)}>{usuario.rol}</span>
                    </td>
                    <td style={localStyles.td}>
                      <span style={obtenerBadgeEstado(usuario.estado)}>{usuario.estado}</span>
                    </td>
                    <td style={localStyles.td}>
                      {usuario.creado_en ? new Date(usuario.creado_en).toLocaleDateString() : 'Sin fecha'}
                    </td>
                    <td style={localStyles.td}>
                      <div style={localStyles.accionesFila}>
                        <button style={localStyles.botonEditar} onClick={() => abrirEdicion(usuario)}>
                          Editar
                        </button>

                        <button
                          style={usuario.estado === 'activo' ? localStyles.botonDesactivar : localStyles.botonActivar}
                          onClick={() => cambiarEstadoUsuario(usuario)}
                          disabled={procesandoId === usuario.id}
                        >
                          {procesandoId === usuario.id
                            ? 'Guardando...'
                            : usuario.estado === 'activo'
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

      {usuarioEditando && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Editar usuario</h2>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Nombre completo</label>
              <input
                type="text"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Telefono</label>
              <input
                type="text"
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                style={localStyles.input}
              />
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Rol</label>
              <select value={formRol} onChange={(e) => setFormRol(e.target.value as any)} style={localStyles.select}>
                <option value="admin">Administrador</option>
                <option value="doctor">Doctor</option>
                <option value="paciente">Paciente</option>
              </select>
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Estado</label>
              <select value={formEstado} onChange={(e) => setFormEstado(e.target.value as any)} style={localStyles.select}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={cerrarEdicion}>
                Cancelar
              </button>
              <button style={styles.botonPrincipal} onClick={guardarEdicion} disabled={guardandoEdicion}>
                {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNuevo && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modal}>
            <h2 style={localStyles.modalTitulo}>Nuevo usuario</h2>

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
              <label style={localStyles.label}>Rol</label>
              <select
                value={nuevoRol}
                onChange={(e) => setNuevoRol(e.target.value as 'admin' | 'doctor' | 'paciente')}
                style={localStyles.select}
              >
                <option value="admin">Administrador</option>
                <option value="doctor">Doctor</option>
                <option value="paciente">Paciente</option>
              </select>
            </div>

            <div style={localStyles.formGrupo}>
              <label style={localStyles.label}>Estado</label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value as 'activo' | 'inactivo')}
                style={localStyles.select}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div style={localStyles.modalAcciones}>
              <button style={styles.botonSecundario} onClick={cerrarModalNuevo}>
                Cancelar
              </button>
              <button style={styles.botonPrincipal} onClick={guardarNuevoUsuario} disabled={guardandoNuevo}>
                {guardandoNuevo ? 'Guardando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function obtenerBadgeRol(rol: UsuarioPerfil['rol']): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  };

  if (rol === 'admin') return { ...base, background: '#DBEAFE', color: '#1D4ED8' };
  if (rol === 'doctor') return { ...base, background: '#DCFCE7', color: '#15803D' };
  return { ...base, background: '#F3E8FF', color: '#7E22CE' };
}

function obtenerBadgeEstado(estado: UsuarioPerfil['estado']): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  };

  if (estado === 'activo') return { ...base, background: '#DCFCE7', color: '#15803D' };
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
    gridTemplateColumns: '2fr 1fr 1fr auto',
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
    background: '#FFFFFF',
    boxSizing: 'border-box',
    color: '#0F172A',
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '520px',
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '28px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  },
  modalTitulo: {
    margin: '0 0 24px',
    fontSize: '22px',
    fontWeight: '700',
    color: '#0A2540',
  },
  formGrupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '18px',
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
    marginTop: '24px',
  },
};