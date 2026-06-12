'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { api } from '@/lib/api';

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

  useEffect(() => { cargarEspecialidades(); }, []);

  const cargarEspecialidades = async () => {
    try {
      setCargando(true); setError('');
      const data = await api.get<EspecialidadItem[]>('/especialidades');
      setEspecialidades(data || []);
    } catch (e: any) { setError(e.message || 'No se pudieron cargar las especialidades'); } finally { setCargando(false); }
  };

  const especialidadesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return especialidades.filter((e) => e.nombre?.toLowerCase().includes(texto) || e.descripcion?.toLowerCase().includes(texto));
  }, [especialidades, busqueda]);

  const cerrarModalNuevo = () => { setMostrarModalNuevo(false); setNuevoNombre(''); setNuevaDescripcion(''); };

  const guardarNuevaEspecialidad = async () => {
    if (!nuevoNombre.trim()) { alert('El nombre es obligatorio'); return; }
    try {
      setGuardandoNuevo(true);
      await api.post('/especialidades', { nombre: nuevoNombre.trim(), descripcion: nuevaDescripcion.trim() || null });
      alert('Especialidad creada correctamente'); cerrarModalNuevo(); await cargarEspecialidades();
    } catch (e: any) { alert('No se pudo crear la especialidad: ' + e.message); } finally { setGuardandoNuevo(false); }
  };

  const abrirEdicion = (especialidad: EspecialidadItem) => {
    setEspecialidadEditando(especialidad);
    setFormNombre(especialidad.nombre || '');
    setFormDescripcion(especialidad.descripcion || '');
  };

  const cerrarEdicion = () => { setEspecialidadEditando(null); setFormNombre(''); setFormDescripcion(''); };

  const guardarEdicion = async () => {
    if (!especialidadEditando) return;
    if (!formNombre.trim()) { alert('El nombre es obligatorio'); return; }
    try {
      setGuardandoEdicion(true);
      await api.put(`/especialidades/${especialidadEditando.id}`, { nombre: formNombre.trim(), descripcion: formDescripcion.trim() || null });
      alert('Especialidad actualizada correctamente'); cerrarEdicion(); await cargarEspecialidades();
    } catch (e: any) { alert('No se pudo actualizar: ' + e.message); } finally { setGuardandoEdicion(false); }
  };

  const eliminarEspecialidad = async (especialidad: EspecialidadItem) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la especialidad "${especialidad.nombre}"?`)) return;
    try {
      await api.delete(`/especialidades/${especialidad.id}`);
      alert('Especialidad eliminada correctamente'); await cargarEspecialidades();
    } catch (e: any) { alert('No se pudo eliminar: ' + e.message); }
  };

  return (
    <>
      <div style={styles.cardsGrid}>
        <div style={styles.card}><p style={styles.cardTitle}>Total especialidades</p><h3 style={styles.cardValue}>{especialidades.length}</h3><p style={styles.cardSubtitle}>Especialidades registradas</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Resultados filtrados</p><h3 style={styles.cardValue}>{especialidadesFiltradas.length}</h3><p style={styles.cardSubtitle}>Según la búsqueda actual</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Con descripción</p><h3 style={styles.cardValue}>{especialidades.filter((e) => e.descripcion && e.descripcion.trim() !== '').length}</h3><p style={styles.cardSubtitle}>Especialidades documentadas</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Sin descripción</p><h3 style={styles.cardValue}>{especialidades.filter((e) => !e.descripcion || e.descripcion.trim() === '').length}</h3><p style={styles.cardSubtitle}>Pendientes de completar</p></div>
      </div>

      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input type="text" placeholder="Buscar por nombre o descripción..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={styles.input} />
          <button style={styles.btnSecondary} onClick={cargarEspecialidades}>Recargar</button>
          <button style={styles.btnPrimary} onClick={() => setMostrarModalNuevo(true)}>+ Nueva especialidad</button>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}><h3 style={styles.tableTitle}>Lista de especialidades</h3></div>
        {cargando ? <div style={styles.emptyState}>Cargando especialidades...</div>
        : error ? <div style={{ ...styles.emptyState, color: '#F87171' }}>{error}</div>
        : especialidadesFiltradas.length === 0 ? <div style={styles.emptyState}>No se encontraron especialidades</div>
        : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Nombre</th><th style={styles.th}>Descripción</th><th style={styles.th}>Acciones</th></tr></thead>
              <tbody>
                {especialidadesFiltradas.map((especialidad) => (
                  <tr key={especialidad.id}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #319795 0%, #1a5a58 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>
                          {especialidad.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{especialidad.nombre}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {especialidad.descripcion ? <span style={{ color: '#CBD5E1' }}>{especialidad.descripcion}</span> : <span style={{ color: '#64748B', fontStyle: 'italic' }}>Sin descripción</span>}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button style={styles.btnEdit} onClick={() => abrirEdicion(especialidad)}>Editar</button>
                        <button style={styles.btnDelete} onClick={() => eliminarEspecialidad(especialidad)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarModalNuevo && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Nueva especialidad médica</h2>
            <div style={styles.formGroup}><label style={styles.label}>Nombre de la especialidad *</label><input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} style={styles.input} placeholder="Ej: Cardiología, Pediatría, Neurología..." /></div>
            <div style={styles.formGroup}><label style={styles.label}>Descripción</label><textarea value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} style={styles.textarea} rows={4} placeholder="Describe el alcance de esta especialidad médica..." /></div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={cerrarModalNuevo}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={guardarNuevaEspecialidad} disabled={guardandoNuevo}>{guardandoNuevo ? 'Creando...' : 'Crear especialidad'}</button>
            </div>
          </div>
        </div>
      )}

      {especialidadEditando && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Editar especialidad</h2>
            <div style={styles.formGroup}><label style={styles.label}>Nombre *</label><input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Descripción</label><textarea value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} style={styles.textarea} rows={4} /></div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={cerrarEdicion}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={guardarEdicion} disabled={guardandoEdicion}>{guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
