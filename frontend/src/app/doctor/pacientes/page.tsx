'use client';

import { useEffect, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface Paciente {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  total_citas: number;
}

interface HistorialEntry {
  id: number;
  cita_id: number | null;
  fecha_registro: string;
  sintomas: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
  recetas: Receta[];
  doctores?: { perfiles?: { nombre_completo?: string }; especialidades?: { nombre?: string } };
}

interface Receta {
  id: number;
  medicamento: string;
  dosis: string | null;
  frecuencia: string | null;
  duracion: string | null;
  instrucciones: string | null;
}

export default function PacientesDoctor() {
  const [cargando,      setCargando]      = useState(true);
  const [pacientes,     setPacientes]     = useState<Paciente[]>([]);
  const [doctorId,      setDoctorId]      = useState<string | null>(null);
  const [busqueda,      setBusqueda]      = useState('');

  const [pacienteSel,   setPacienteSel]   = useState<Paciente | null>(null);
  const [historial,     setHistorial]     = useState<HistorialEntry[]>([]);
  const [cargandoHist,  setCargandoHist]  = useState(false);
  const [entradaOpen,   setEntradaOpen]   = useState<number | null>(null);

  useEffect(() => { obtenerDoctorId(); }, []);
  useEffect(() => { if (doctorId) cargarPacientes(); }, [doctorId]);

  async function obtenerDoctorId() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const doctores = await api.get<any[]>(`/doctores?perfil_id=${user.id}`);
      if (doctores?.[0]) setDoctorId(doctores[0].id);
    } catch (e) { console.error(e); }
  }

  async function cargarPacientes() {
    if (!doctorId) return;
    setCargando(true);
    try {
      const citas = await api.get<any[]>(`/citas?doctor_id=${doctorId}`);
      const map = new Map<string, Paciente>();
      (citas || []).forEach((c: any) => {
        const perfil = c.pacientes?.perfiles;
        if (!perfil) return;
        const pid = c.paciente_id;
        if (!map.has(pid)) {
          map.set(pid, { id: pid, nombre_completo: perfil.nombre_completo || 'Paciente', correo: perfil.correo || '', telefono: perfil.telefono || null, total_citas: 1 });
        } else {
          map.get(pid)!.total_citas++;
        }
      });
      setPacientes(Array.from(map.values()));
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  async function verHistorial(paciente: Paciente) {
    if (pacienteSel?.id === paciente.id) { setPacienteSel(null); setHistorial([]); return; }
    setPacienteSel(paciente);
    setHistorial([]);
    setEntradaOpen(null);
    setCargandoHist(true);
    try {
      const data = await api.get<HistorialEntry[]>(`/historial-medico?paciente_id=${paciente.id}`);
      setHistorial(data || []);
    } catch (e) { console.error(e); }
    finally { setCargandoHist(false); }
  }

  const filtrados = pacientes.filter(p =>
    p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={styles.input}
          />
          <button style={styles.btnSecondary} onClick={cargarPacientes}>Recargar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: pacienteSel ? '1fr 1.1fr' : '1fr', gap: 20, alignItems: 'start' }}>

        {/* Tabla de pacientes */}
        <div style={styles.tableBox}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Mis pacientes</h3>
            <span style={{ fontSize: 12, color: '#64748B' }}>{filtrados.length} pacientes</span>
          </div>
          {cargando ? (
            <div style={styles.emptyState}>Cargando pacientes...</div>
          ) : filtrados.length === 0 ? (
            <div style={styles.emptyState}>No hay pacientes registrados</div>
          ) : (
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Paciente</th>
                    <th style={styles.th}>Correo</th>
                    <th style={styles.th}>Teléfono</th>
                    <th style={styles.th}>Citas</th>
                    <th style={styles.th}>Historial</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(p => {
                    const activo = pacienteSel?.id === p.id;
                    return (
                      <tr key={p.id} style={{ background: activo ? 'rgba(49,151,149,0.08)' : 'transparent' }}>
                        <td style={styles.td}><strong style={{ color: activo ? '#2DD4BF' : '#E2E8F0' }}>{p.nombre_completo}</strong></td>
                        <td style={styles.td}>{p.correo}</td>
                        <td style={styles.td}>{p.telefono || '—'}</td>
                        <td style={styles.td}><span style={styles.badgeActive}>{p.total_citas}</span></td>
                        <td style={styles.td}>
                          <button
                            onClick={() => verHistorial(p)}
                            style={{
                              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                              background: activo ? 'rgba(239,68,68,0.15)' : 'rgba(49,151,149,0.15)',
                              color: activo ? '#FCA5A5' : '#2DD4BF',
                            }}
                          >
                            {activo ? 'Cerrar' : 'Ver historial'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel de historial completo */}
        {pacienteSel && (
          <div style={styles.tableBox}>
            <div style={styles.tableHeader}>
              <div>
                <h3 style={styles.tableTitle}>{pacienteSel.nombre_completo}</h3>
                <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Historial clínico completo</div>
              </div>
              <button style={styles.btnSecondary} onClick={() => { setPacienteSel(null); setHistorial([]); }}>
                Cerrar
              </button>
            </div>

            {cargandoHist ? (
              <div style={styles.emptyState}>Cargando historial...</div>
            ) : historial.length === 0 ? (
              <div style={styles.emptyState}>Sin registros clínicos para este paciente</div>
            ) : (
              <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                {historial.map((entry) => {
                  const abierto = entradaOpen === entry.id;
                  const drNombre = entry.doctores?.perfiles?.nombre_completo || 'Doctor';
                  const espNombre = entry.doctores?.especialidades?.nombre || '';
                  return (
                    <div key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {/* Cabecera colapsable */}
                      <div
                        onClick={() => setEntradaOpen(abierto ? null : entry.id)}
                        style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>
                            {new Date(entry.fecha_registro).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
                            Dr. {drNombre}{espNombre ? ` · ${espNombre}` : ''}
                          </div>
                          {entry.diagnostico && (
                            <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                              {entry.diagnostico}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {entry.recetas.length > 0 && (
                            <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.2)', color: '#C7D2FE', padding: '2px 8px', borderRadius: 20 }}>
                              {entry.recetas.length} receta{entry.recetas.length > 1 ? 's' : ''}
                            </span>
                          )}
                          <span style={{ color: '#64748B', fontSize: 16, transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                        </div>
                      </div>

                      {/* Detalle expandido */}
                      {abierto && (
                        <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[
                            { label: 'Síntomas',     value: entry.sintomas },
                            { label: 'Diagnóstico',  value: entry.diagnostico },
                            { label: 'Tratamiento',  value: entry.tratamiento },
                            { label: 'Observaciones',value: entry.observaciones },
                          ].filter(f => f.value).map(({ label, value }) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px' }}>
                              <div style={{ color: '#64748B', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                              <div style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.6 }}>{value}</div>
                            </div>
                          ))}

                          {entry.recetas.length > 0 && (
                            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                              <div style={{ color: '#A5B4FC', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Recetas</div>
                              {entry.recetas.map(r => (
                                <div key={r.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)', lastChild: { borderBottom: 'none' } as any }}>
                                  <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>{r.medicamento}</div>
                                  <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                                    {[r.dosis, r.frecuencia, r.duracion].filter(Boolean).join(' · ') || '—'}
                                  </div>
                                  {r.instrucciones && <div style={{ color: '#64748B', fontSize: 12 }}>{r.instrucciones}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
