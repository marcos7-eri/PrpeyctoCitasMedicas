'use client';

import { useEffect, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface CitaItem {
  id: number;
  fecha: string;
  hora_inicio: string;
  motivo: string | null;
  paciente_nombre: string;
  paciente_id: string;
}

interface HistorialEntry {
  id: number;
  paciente_id: string;
  doctor_id: string;
  cita_id: number | null;
  sintomas: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
  fecha_registro: string;
  recetas: Receta[];
}

interface Receta {
  id: number;
  historial_id: number;
  medicamento: string;
  dosis: string | null;
  frecuencia: string | null;
  duracion: string | null;
  instrucciones: string | null;
}

const EMPTY_HISTORIAL = { sintomas: '', diagnostico: '', tratamiento: '', observaciones: '' };
const EMPTY_RECETA = { medicamento: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' };

export default function HistorialDoctor() {
  const [cargando, setCargando] = useState(true);
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [citaSel, setCitaSel] = useState<CitaItem | null>(null);
  const [historialSel, setHistorialSel] = useState<HistorialEntry | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [chatResumen, setChatResumen] = useState<string | null>(null);

  const [formHistorial, setFormHistorial] = useState(EMPTY_HISTORIAL);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [formReceta, setFormReceta] = useState(EMPTY_RECETA);
  const [mostrarFormReceta, setMostrarFormReceta] = useState(false);
  const [guardandoReceta, setGuardandoReceta] = useState(false);

  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null);

  useEffect(() => { obtenerDoctorId(); }, []);
  useEffect(() => { if (doctorId) cargarCitas(); }, [doctorId]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const ok = (msg: string) => setToast({ msg, tipo: 'ok' });
  const err = (msg: string) => setToast({ msg, tipo: 'err' });

  async function obtenerDoctorId() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const doctores = await api.get<any[]>(`/doctores?perfil_id=${user.id}`);
      if (doctores?.[0]) setDoctorId(doctores[0].id);
    } catch (e) { console.error(e); }
  }

  async function cargarCitas() {
    if (!doctorId) return;
    setCargando(true);
    try {
      const data = await api.get<any[]>(`/citas?doctor_id=${doctorId}`);
      const completadas = (data || [])
        .filter((c: any) => c.estado === 'completada')
        .sort((a: any, b: any) => b.fecha.localeCompare(a.fecha));
      setCitas(completadas.map((c: any) => ({
        id: c.id,
        fecha: c.fecha,
        hora_inicio: c.hora_inicio,
        motivo: c.motivo,
        paciente_nombre: c.pacientes?.perfiles?.nombre_completo || 'Paciente',
        paciente_id: c.paciente_id,
      })));
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  async function seleccionarCita(cita: CitaItem) {
    if (!doctorId) return;
    setCitaSel(cita);
    setHistorialSel(null);
    setFormHistorial(EMPTY_HISTORIAL);
    setFormReceta(EMPTY_RECETA);
    setModoEdicion(false);
    setMostrarFormReceta(false);
    setChatResumen(null);
    setToast(null);
    setCargandoDetalle(true);

    try {
      const [historiales, { data: sesion }] = await Promise.all([
        api.get<HistorialEntry[]>(`/historial-medico?paciente_id=${cita.paciente_id}&doctor_id=${doctorId}`),
        supabase
          .from('chat_sesiones')
          .select('resumen')
          .eq('paciente_id', cita.paciente_id)
          .not('resumen', 'is', null)
          .order('creado_en', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const found = (historiales || []).find(h => h.cita_id === cita.id) ?? null;
      if (found) {
        setHistorialSel({ ...found, recetas: found.recetas || [] });
        setFormHistorial({
          sintomas: found.sintomas || '',
          diagnostico: found.diagnostico || '',
          tratamiento: found.tratamiento || '',
          observaciones: found.observaciones || '',
        });
      }
      if ((sesion as any)?.resumen) setChatResumen((sesion as any).resumen);
    } catch (e) { console.error(e); }
    finally { setCargandoDetalle(false); }
  }

  async function guardarHistorial() {
    if (!citaSel || !doctorId) return;
    setGuardando(true);
    try {
      if (historialSel) {
        await api.put(`/historial-medico/${historialSel.id}`, formHistorial);
        setHistorialSel(prev => prev ? { ...prev, ...formHistorial } : prev);
        ok('Historial actualizado');
      } else {
        const created = await api.post<HistorialEntry>('/historial-medico', {
          paciente_id: citaSel.paciente_id,
          doctor_id: doctorId,
          cita_id: citaSel.id,
          ...formHistorial,
        });
        setHistorialSel({ ...created, recetas: [] });
        ok('Historial registrado correctamente');
      }
      setModoEdicion(false);
    } catch (e: any) { err(e.message); }
    finally { setGuardando(false); }
  }

  async function agregarReceta() {
    if (!historialSel || !formReceta.medicamento.trim()) return;
    setGuardandoReceta(true);
    try {
      const receta = await api.post<Receta>('/historial-medico/recetas', {
        historial_id: historialSel.id,
        ...formReceta,
      });
      setHistorialSel(prev => prev ? { ...prev, recetas: [...prev.recetas, receta] } : prev);
      setFormReceta(EMPTY_RECETA);
      setMostrarFormReceta(false);
      ok('Receta agregada');
    } catch (e: any) { err(e.message); }
    finally { setGuardandoReceta(false); }
  }

  async function eliminarReceta(id: number) {
    if (!window.confirm('¿Eliminar esta receta?')) return;
    try {
      await api.delete(`/historial-medico/recetas/${id}`);
      setHistorialSel(prev => prev ? { ...prev, recetas: prev.recetas.filter(r => r.id !== id) } : prev);
      ok('Receta eliminada');
    } catch (e: any) { err(e.message); }
  }

  const citasFiltradas = citas.filter(c =>
    c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.motivo?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)
  );

  const mostrarForm = !historialSel || modoEdicion;

  function imprimirReceta() {
    if (!citaSel || !historialSel || historialSel.recetas.length === 0) return;
    const perfilStr = typeof window !== 'undefined' ? localStorage.getItem('perfil') : null;
    const perfil = perfilStr ? JSON.parse(perfilStr) : null;
    const drNombre = perfil?.nombre_completo || 'Doctor';
    const fecha = new Date(citaSel.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    const filasMeds = historialSel.recetas.map(r => `
      <tr>
        <td>${r.medicamento}</td>
        <td>${r.dosis || '—'}</td>
        <td>${r.frecuencia || '—'}</td>
        <td>${r.duracion || '—'}</td>
        <td>${r.instrucciones || '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Receta Médica</title>
<style>
  body{font-family:Arial,sans-serif;margin:48px;color:#111;font-size:14px}
  h1{font-size:20px;border-bottom:2px solid #319795;padding-bottom:10px;margin-bottom:18px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:20px;font-size:13px}
  .meta span{color:#555;font-weight:bold}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#f3f4f6;padding:8px 12px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
  td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;vertical-align:top}
  .diag{margin-top:18px;padding:12px 16px;background:#f9fafb;border-left:3px solid #319795;font-size:13px}
  .footer{margin-top:64px;text-align:right}
  .firma{border-top:1px solid #333;display:inline-block;padding-top:8px;min-width:220px;text-align:center;font-size:13px}
  @media print{body{margin:24px}}
</style></head><body>
<h1>Receta Médica</h1>
<div class="meta">
  <div><span>Médico:</span> ${drNombre}</div>
  <div><span>Fecha:</span> ${fecha}</div>
  <div><span>Paciente:</span> ${citaSel.paciente_nombre}</div>
</div>
${historialSel.diagnostico ? `<div class="diag"><strong>Diagnóstico:</strong> ${historialSel.diagnostico}</div>` : ''}
<table>
  <thead><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Duración</th><th>Instrucciones</th></tr></thead>
  <tbody>${filasMeds}</tbody>
</table>
${historialSel.tratamiento ? `<p style="margin-top:16px;font-size:13px"><strong>Tratamiento indicado:</strong> ${historialSel.tratamiento}</p>` : ''}
<div class="footer"><div class="firma">${drNombre}<br/>Firma y sello</div></div>
</body></html>`;

    const win = window.open('', '_blank', 'width=820,height=640');
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 400); }
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.tipo === 'ok' ? 'rgba(34,197,94,0.92)' : 'rgba(239,68,68,0.92)',
          color: '#fff', padding: '12px 20px', borderRadius: '12px',
          fontSize: '14px', fontWeight: '600', maxWidth: '320px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast.tipo === 'ok' ? '' : ''} {toast.msg}
        </div>
      )}

      {/* Barra de búsqueda */}
      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input
            type="text"
            placeholder="Buscar por paciente o motivo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={styles.input}
          />
          <button style={styles.btnSecondary} onClick={cargarCitas}>Recargar</button>
        </div>
      </div>

      {/* Layout dos paneles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '20px', alignItems: 'start' }}>

        {/* PANEL IZQUIERDO — lista de citas */}
        <div style={styles.tableBox}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Citas completadas</h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>{citasFiltradas.length}</span>
          </div>
          {cargando ? (
            <div style={styles.emptyState}>Cargando...</div>
          ) : citasFiltradas.length === 0 ? (
            <div style={styles.emptyState}>Sin citas completadas</div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {citasFiltradas.map(cita => {
                const sel = citaSel?.id === cita.id;
                return (
                  <div
                    key={cita.id}
                    onClick={() => seleccionarCita(cita)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      borderLeft: sel ? '3px solid #319795' : '3px solid transparent',
                      background: sel ? 'rgba(49,151,149,0.12)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: '600', color: '#E2E8F0', fontSize: '14px' }}>
                      {cita.paciente_nombre}
                    </div>
                    <div style={{ color: '#64748B', fontSize: '12px', marginTop: '3px' }}>
                      {new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} · {cita.hora_inicio.substring(0, 5)}
                    </div>
                    {cita.motivo && (
                      <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cita.motivo}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PANEL DERECHO — detalle */}
        {!citaSel ? (
          <div style={{ ...styles.tableBox, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '420px' }}>
            <div style={{ textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}></div>
              <div style={{ fontSize: '14px' }}>Selecciona una cita para ver o registrar el historial clínico</div>
            </div>
          </div>
        ) : cargandoDetalle ? (
          <div style={{ ...styles.tableBox, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '420px' }}>
            <div style={{ color: '#64748B' }}>Cargando historial...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Cabecera del paciente */}
            <div style={styles.tableBox}>
              <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ ...styles.tableTitle, marginBottom: '6px' }}>{citaSel.paciente_nombre}</h3>
                  <div style={{ color: '#64748B', fontSize: '13px' }}>
                    {new Date(citaSel.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    {' · '}{citaSel.hora_inicio.substring(0, 5)}
                  </div>
                  {citaSel.motivo && (
                    <div style={{ color: '#94A3B8', fontSize: '13px', marginTop: '4px' }}>
                      Motivo: {citaSel.motivo}
                    </div>
                  )}
                </div>
                {historialSel && !modoEdicion && (
                  <button style={styles.btnEdit} onClick={() => setModoEdicion(true)}>
                    Editar historial
                  </button>
                )}
              </div>
            </div>

            {/* Resumen IA (si existe) */}
            {chatResumen && (
              <div style={{
                background: 'rgba(49,151,149,0.07)',
                border: '1px solid rgba(49,151,149,0.25)',
                borderRadius: '20px',
                padding: '16px 20px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#319795', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Resumen consulta IA (pre-cita)
                </div>
                <div style={{ color: '#CBD5E1', fontSize: '13px', lineHeight: '1.65' }}>{chatResumen}</div>
              </div>
            )}

            {/* Historial clínico */}
            <div style={styles.tableBox}>
              <div style={styles.tableHeader}>
                <h3 style={styles.tableTitle}>
                  {historialSel ? 'Historial clínico' : 'Registrar historial clínico'}
                </h3>
                {historialSel && !modoEdicion && (
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    {new Date(historialSel.fecha_registro).toLocaleDateString('es-ES')}
                  </span>
                )}
              </div>
              <div style={{ padding: '20px 24px' }}>
                {mostrarForm ? (
                  /* Formulario editable */
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Síntomas</label>
                      <textarea
                        rows={3}
                        style={styles.textarea}
                        placeholder="Describe los síntomas del paciente..."
                        value={formHistorial.sintomas}
                        onChange={e => setFormHistorial(p => ({ ...p, sintomas: e.target.value }))}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Diagnóstico</label>
                      <textarea
                        rows={2}
                        style={styles.textarea}
                        placeholder="Diagnóstico médico..."
                        value={formHistorial.diagnostico}
                        onChange={e => setFormHistorial(p => ({ ...p, diagnostico: e.target.value }))}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Tratamiento</label>
                      <textarea
                        rows={2}
                        style={styles.textarea}
                        placeholder="Plan de tratamiento indicado..."
                        value={formHistorial.tratamiento}
                        onChange={e => setFormHistorial(p => ({ ...p, tratamiento: e.target.value }))}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Observaciones</label>
                      <textarea
                        rows={2}
                        style={styles.textarea}
                        placeholder="Notas adicionales..."
                        value={formHistorial.observaciones}
                        onChange={e => setFormHistorial(p => ({ ...p, observaciones: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      {modoEdicion && (
                        <button style={styles.btnSecondary} onClick={() => {
                          setModoEdicion(false);
                          if (historialSel) setFormHistorial({
                            sintomas: historialSel.sintomas || '',
                            diagnostico: historialSel.diagnostico || '',
                            tratamiento: historialSel.tratamiento || '',
                            observaciones: historialSel.observaciones || '',
                          });
                        }}>
                          Cancelar
                        </button>
                      )}
                      <button
                        style={{ ...styles.btnPrimary, opacity: guardando ? 0.7 : 1 }}
                        onClick={guardarHistorial}
                        disabled={guardando}
                      >
                        {guardando ? 'Guardando...' : historialSel ? 'Guardar cambios' : 'Registrar historial'}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Vista de solo lectura */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {[
                      { label: 'Síntomas', value: historialSel?.sintomas },
                      { label: 'Diagnóstico', value: historialSel?.diagnostico },
                      { label: 'Tratamiento', value: historialSel?.tratamiento },
                      { label: 'Observaciones', value: historialSel?.observaciones },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px 16px' }}>
                        <div style={{ ...styles.label, marginBottom: '8px' }}>{label}</div>
                        <div style={{ color: value ? '#E2E8F0' : '#475569', fontSize: '13px', lineHeight: '1.6' }}>
                          {value || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recetas (solo si existe historial) */}
            {historialSel && (
              <div style={styles.tableBox}>
                <div style={styles.tableHeader}>
                  <h3 style={styles.tableTitle}>Recetas médicas</h3>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {historialSel.recetas.length > 0 && (
                      <button style={styles.btnSecondary} onClick={imprimirReceta}>
                        Imprimir receta
                      </button>
                    )}
                    <button
                      style={mostrarFormReceta ? styles.btnSecondary : styles.btnPrimary}
                      onClick={() => { setMostrarFormReceta(v => !v); setFormReceta(EMPTY_RECETA); }}
                    >
                      {mostrarFormReceta ? 'Cancelar' : '+ Agregar receta'}
                    </button>
                  </div>
                </div>

                {/* Formulario nueva receta */}
                {mostrarFormReceta && (
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={styles.rowTwoColumns}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Medicamento *</label>
                        <input
                          style={styles.input}
                          placeholder="Nombre del medicamento"
                          value={formReceta.medicamento}
                          onChange={e => setFormReceta(p => ({ ...p, medicamento: e.target.value }))}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Dosis</label>
                        <input
                          style={styles.input}
                          placeholder="Ej: 500 mg"
                          value={formReceta.dosis}
                          onChange={e => setFormReceta(p => ({ ...p, dosis: e.target.value }))}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Frecuencia</label>
                        <input
                          style={styles.input}
                          placeholder="Ej: Cada 8 horas"
                          value={formReceta.frecuencia}
                          onChange={e => setFormReceta(p => ({ ...p, frecuencia: e.target.value }))}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Duración</label>
                        <input
                          style={styles.input}
                          placeholder="Ej: 7 días"
                          value={formReceta.duracion}
                          onChange={e => setFormReceta(p => ({ ...p, duracion: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Instrucciones adicionales</label>
                      <textarea
                        rows={2}
                        style={styles.textarea}
                        placeholder="Tomar con alimentos, evitar alcohol..."
                        value={formReceta.instrucciones}
                        onChange={e => setFormReceta(p => ({ ...p, instrucciones: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button style={styles.btnSecondary} onClick={() => setMostrarFormReceta(false)}>
                        Cancelar
                      </button>
                      <button
                        style={{ ...styles.btnPrimary, opacity: (guardandoReceta || !formReceta.medicamento.trim()) ? 0.6 : 1 }}
                        onClick={agregarReceta}
                        disabled={guardandoReceta || !formReceta.medicamento.trim()}
                      >
                        {guardandoReceta ? 'Guardando...' : 'Agregar receta'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de recetas */}
                {historialSel.recetas.length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                    No hay recetas registradas para esta consulta
                  </div>
                ) : (
                  <div>
                    {historialSel.recetas.map((receta, idx) => (
                      <div
                        key={receta.id}
                        style={{
                          padding: '14px 20px',
                          borderBottom: idx < historialSel.recetas.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#E2E8F0', fontSize: '14px' }}>
                            {receta.medicamento}
                          </div>
                          <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '4px' }}>
                            {[receta.dosis, receta.frecuencia, receta.duracion].filter(Boolean).join(' · ') || '—'}
                          </div>
                          {receta.instrucciones && (
                            <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>
                              {receta.instrucciones}
                            </div>
                          )}
                        </div>
                        <button style={styles.btnDelete} onClick={() => eliminarReceta(receta.id)}>
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
