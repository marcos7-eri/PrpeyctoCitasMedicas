'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError('');
      const { data, error } = await supabase.from('perfiles').select('id, nombre_completo, correo, telefono, rol, estado, creado_en').order('creado_en', { ascending: false });
      if (error) { setError(error.message); return; }
      setUsuarios((data as UsuarioPerfil[]) || []);
    } catch { setError('No se pudieron cargar los usuarios'); } finally { setCargando(false); }
  };

  const cambiarEstadoUsuario = async (usuario: UsuarioPerfil) => {
    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      setProcesandoId(usuario.id);
      const { error } = await supabase.from('perfiles').update({ estado: nuevoEstado }).eq('id', usuario.id);
      if (error) { alert('No se pudo actualizar el estado: ' + error.message); return; }
      setUsuarios((prev) => prev.map((u) => u.id === usuario.id ? { ...u, estado: nuevoEstado as 'activo' | 'inactivo' } : u));
    } catch { alert('Ocurrió un error al cambiar el estado'); } finally { setProcesandoId(null); }
  };

  const abrirEdicion = (usuario: UsuarioPerfil) => {
    setUsuarioEditando(usuario);
    setFormNombre(usuario.nombre_completo || '');
    setFormTelefono(usuario.telefono || '');
    setFormRol(usuario.rol);
    setFormEstado(usuario.estado);
  };

  const guardarEdicion = async () => {
    if (!usuarioEditando) return;
    try {
      setGuardandoEdicion(true);
      const { error } = await supabase.from('perfiles').update({ nombre_completo: formNombre, telefono: formTelefono, rol: formRol, estado: formEstado }).eq('id', usuarioEditando.id);
      if (error) { alert('No se pudo actualizar el usuario: ' + error.message); return; }
      setUsuarios((prev) => prev.map((u) => u.id === usuarioEditando.id ? { ...u, nombre_completo: formNombre, telefono: formTelefono, rol: formRol, estado: formEstado } : u));
      setUsuarioEditando(null);
    } catch { alert('Ocurrió un error al guardar'); } finally { setGuardandoEdicion(false); }
  };

  const guardarNuevoUsuario = async () => {
    if (!nuevoNombre || !nuevoCorreo || !nuevaContrasena) { alert('Completa nombre, correo y contraseña'); return; }
    if (nuevoRol === 'doctor') { alert('Los doctores deben registrarse desde el módulo Doctores'); return; }
    try {
      setGuardandoNuevo(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { alert('No se encontró la sesión del administrador'); return; }
      const { data, error } = await supabase.functions.invoke('crear-usuario', {
        body: { nombre_completo: nuevoNombre, correo: nuevoCorreo, telefono: nuevoTelefono, contrasena: nuevaContrasena, rol: nuevoRol, estado: nuevoEstado },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || data?.error) { alert('Error al crear usuario: ' + (data?.error || error?.message)); return; }
      alert('Usuario creado correctamente');
      setMostrarModalNuevo(false);
      setNuevoNombre(''); setNuevoCorreo(''); setNuevoTelefono(''); setNuevaContrasena('');
      await cargarUsuarios();
    } catch { alert('Ocurrió un error al crear el usuario'); } finally { setGuardandoNuevo(false); }
  };

  const usuariosFiltrados = useMemo(() => usuarios.filter((usuario) => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda = usuario.nombre_completo?.toLowerCase().includes(texto) || usuario.correo?.toLowerCase().includes(texto) || usuario.telefono?.toLowerCase().includes(texto);
    const coincideRol = filtroRol === 'todos' ? true : usuario.rol === filtroRol;
    const coincideEstado = filtroEstado === 'todos' ? true : usuario.estado === filtroEstado;
    return coincideBusqueda && coincideRol && coincideEstado;
  }), [usuarios, busqueda, filtroRol, filtroEstado]);

  const resumen = useMemo(() => ({
    total: usuarios.length,
    admins: usuarios.filter((u) => u.rol === 'admin').length,
    doctores: usuarios.filter((u) => u.rol === 'doctor').length,
    pacientes: usuarios.filter((u) => u.rol === 'paciente').length,
  }), [usuarios]);

  const getRolStyle = (rol: string): React.CSSProperties => {
    if (rol === 'admin') return styles.badgeAdmin;
    if (rol === 'doctor') return styles.badgeDoctor;
    return styles.badgePaciente;
  };

  return (
    <>
      <div style={styles.cardsGrid}>
        <div style={styles.card}><p style={styles.cardTitle}>Total usuarios</p><h3 style={styles.cardValue}>{resumen.total}</h3><p style={styles.cardSubtitle}>Usuarios registrados</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Administradores</p><h3 style={styles.cardValue}>{resumen.admins}</h3><p style={styles.cardSubtitle}>Cuentas administrativas</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Doctores</p><h3 style={styles.cardValue}>{resumen.doctores}</h3><p style={styles.cardSubtitle}>Usuarios con rol doctor</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Pacientes</p><h3 style={styles.cardValue}>{resumen.pacientes}</h3><p style={styles.cardSubtitle}>Usuarios con rol paciente</p></div>
      </div>

      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input type="text" placeholder="Buscar por nombre, correo o teléfono" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={styles.input} />
          <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} style={styles.select}>
            <option value="todos">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="doctor">Doctor</option>
            <option value="paciente">Paciente</option>
          </select>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={styles.select}>
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <button style={styles.btnSecondary} onClick={cargarUsuarios}>Recargar</button>
          <button style={styles.btnPrimary} onClick={() => setMostrarModalNuevo(true)}>+ Nuevo usuario</button>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}><h3 style={styles.tableTitle}>Lista de usuarios</h3></div>
        {cargando ? (
          <div style={styles.emptyState}>Cargando usuarios...</div>
        ) : error ? (
          <div style={{ ...styles.emptyState, color: '#F87171' }}>{error}</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={styles.emptyState}>No se encontraron usuarios</div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre</th><th style={styles.th}>Correo</th><th style={styles.th}>Teléfono</th>
                  <th style={styles.th}>Rol</th><th style={styles.th}>Estado</th><th style={styles.th}>Fecha</th><th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td style={styles.td}>{usuario.nombre_completo || 'Sin nombre'}</td>
                    <td style={styles.td}>{usuario.correo}</td>
                    <td style={styles.td}>{usuario.telefono || '—'}</td>
                    <td style={styles.td}><span style={getRolStyle(usuario.rol)}>{usuario.rol}</span></td>
                    <td style={styles.td}><span style={usuario.estado === 'activo' ? styles.badgeActive : styles.badgeInactive}>{usuario.estado}</span></td>
                    <td style={styles.td}>{usuario.creado_en ? new Date(usuario.creado_en).toLocaleDateString() : '—'}</td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button style={styles.btnEdit} onClick={() => abrirEdicion(usuario)}>Editar</button>
                        <button style={usuario.estado === 'activo' ? styles.btnDelete : styles.btnEdit} onClick={() => cambiarEstadoUsuario(usuario)} disabled={procesandoId === usuario.id}>
                          {usuario.estado === 'activo' ? 'Inactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {usuarioEditando && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Editar usuario</h2>
            <div style={styles.formGroup}><label style={styles.label}>Nombre completo</label><input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Teléfono</label><input type="text" value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Rol</label>
              <select value={formRol} onChange={(e) => setFormRol(e.target.value as any)} style={styles.select}>
                <option value="admin">Administrador</option><option value="doctor">Doctor</option><option value="paciente">Paciente</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Estado</label>
              <select value={formEstado} onChange={(e) => setFormEstado(e.target.value as any)} style={styles.select}>
                <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setUsuarioEditando(null)}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={guardarEdicion} disabled={guardandoEdicion}>{guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNuevo && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Nuevo usuario</h2>
            <div style={styles.formGroup}><label style={styles.label}>Nombre completo</label><input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Correo</label><input type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Teléfono</label><input type="text" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Contraseña</label><input type="password" value={nuevaContrasena} onChange={(e) => setNuevaContrasena(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Rol</label>
              <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as any)} style={styles.select}>
                <option value="admin">Administrador</option><option value="paciente">Paciente</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Estado</label>
              <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value as any)} style={styles.select}>
                <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setMostrarModalNuevo(false)}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={guardarNuevoUsuario} disabled={guardandoNuevo}>{guardandoNuevo ? 'Guardando...' : 'Crear usuario'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
