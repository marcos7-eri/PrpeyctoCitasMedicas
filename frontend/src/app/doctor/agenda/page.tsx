'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface CitaAgenda {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  motivo: string | null;
  paciente_nombre: string;
}

const ESTADO_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  pendiente:  { bg: 'rgba(245,158,11,0.18)',  border: '#F59E0B', text: '#FDE68A' },
  confirmada: { bg: 'rgba(16,185,129,0.18)',  border: '#10B981', text: '#6EE7B7' },
  completada: { bg: 'rgba(99,102,241,0.18)',  border: '#6366F1', text: '#C7D2FE' },
  cancelada:  { bg: 'rgba(239,68,68,0.12)',   border: '#EF4444', text: '#FCA5A5' },
};

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Franjas horarias: 7:00 a 20:00 cada 30 min
const HORAS: string[] = [];
for (let h = 7; h < 20; h++) {
  HORAS.push(`${String(h).padStart(2, '0')}:00`);
  HORAS.push(`${String(h).padStart(2, '0')}:30`);
}

function getLunesDeSemanaDe(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0=dom
  const diff = dia === 0 ? -6 : 1 - dia; // retroceder al lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

function horaToMin(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

function getCitasDeSlot(citas: CitaAgenda[], fecha: string, slotHora: string): CitaAgenda[] {
  const slotMin = horaToMin(slotHora);
  return citas.filter(c => {
    if (c.fecha !== fecha) return false;
    const inicio    = horaToMin(c.hora_inicio.substring(0, 5));
    const horaFinStr = (c.hora_fin || '').substring(0, 5);
    const fin        = horaFinStr ? horaToMin(horaFinStr) : inicio + 30;
    return inicio <= slotMin && slotMin < fin;
  });
}

function isInicioDeSlot(cita: CitaAgenda, slotHora: string): boolean {
  return cita.hora_inicio.substring(0, 5) === slotHora;
}

export default function AgendaDoctorPage() {
  const [doctorId,  setDoctorId]  = useState<string | null>(null);
  const [cargando,  setCargando]  = useState(true);
  const [semana,    setSemana]    = useState<Date>(getLunesDeSemanaDe(new Date()));
  const [citas,     setCitas]     = useState<CitaAgenda[]>([]);
  const [seleccion, setSeleccion] = useState<CitaAgenda | null>(null);

  // Obtener doctorId del usuario logueado
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const doctores = await api.get<any[]>(`/doctores?perfil_id=${user.id}`);
      if (doctores?.length) setDoctorId(doctores[0].id);
    })();
  }, []);

  // Cargar citas de la semana
  const cargar = useCallback(async () => {
    if (!doctorId) return;
    setCargando(true);
    const desde = toISO(semana);
    const hasta = toISO(addDias(semana, 6));

    const data = await api.get<any[]>(`/citas?doctor_id=${doctorId}`);
    const filtradas = (data ?? [])
      .filter((c: any) => c.fecha >= desde && c.fecha <= hasta)
      .map((c: any) => ({
        id: c.id,
        fecha:        c.fecha,
        hora_inicio:  c.hora_inicio,
        hora_fin:     c.hora_fin ?? '',
        estado:       c.estado,
        motivo:       c.motivo ?? null,
        paciente_nombre: c.pacientes?.perfiles?.nombre_completo ?? 'Paciente',
      }));

    setCitas(filtradas);
    setCargando(false);
  }, [doctorId, semana]);

  useEffect(() => { cargar(); }, [cargar]);

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDias(semana, i));
  const hoy = toISO(new Date());
  const labelSemana = `${diasSemana[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${diasSemana[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>

      {/* Navegación de semana */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setSemana(prev => addDias(prev, -7))} style={navBtnStyle}>← Semana anterior</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16 }}>{labelSemana}</span>
        </div>
        <button onClick={() => setSemana(getLunesDeSemanaDe(new Date()))} style={{ ...navBtnStyle, background: 'rgba(45,212,191,0.12)', color: '#2DD4BF', borderColor: 'rgba(45,212,191,0.3)' }}>Hoy</button>
        <button onClick={() => setSemana(prev => addDias(prev, 7))} style={navBtnStyle}>Semana siguiente →</button>
      </div>

      {/* Leyenda de estados */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.entries(ESTADO_COLOR).map(([estado, c]) => (
          <div key={estado} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: c.border }} />
            <span style={{ color: '#94A3B8', fontSize: 12, textTransform: 'capitalize' }}>{estado}</span>
          </div>
        ))}
        <span style={{ color: '#475569', fontSize: 12, marginLeft: 'auto' }}>
          {citas.length} cita{citas.length !== 1 ? 's' : ''} esta semana
        </span>
      </div>

      {/* Calendario */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ minWidth: 900, position: 'relative' }}>

          {/* Cabecera de días */}
          <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', position: 'sticky', top: 0, zIndex: 10, background: '#0A0F1C', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div />
            {diasSemana.map((d, i) => {
              const iso = toISO(d);
              const esHoy = iso === hoy;
              return (
                <div key={i} style={{ padding: '12px 8px', textAlign: 'center', background: esHoy ? 'rgba(45,212,191,0.08)' : 'transparent', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: esHoy ? '#2DD4BF' : '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{DIAS_SEMANA[d.getDay()]}</div>
                  <div style={{ color: esHoy ? '#2DD4BF' : '#FFFFFF', fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{d.getDate()}</div>
                  <div style={{ color: esHoy ? '#2DD4BF99' : '#475569', fontSize: 10 }}>{d.toLocaleDateString('es-ES', { month: 'short' })}</div>
                </div>
              );
            })}
          </div>

          {/* Filas horarias */}
          {cargando ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>Cargando agenda...</div>
          ) : (
            HORAS.map((hora, hi) => (
              <div key={hi} style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', minHeight: 44, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {/* Etiqueta de hora */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 4, color: hora.endsWith(':00') ? '#64748B' : 'transparent', fontSize: 10, fontWeight: 600 }}>
                  {hora}
                </div>

                {/* Celdas por día */}
                {diasSemana.map((d, di) => {
                  const iso    = toISO(d);
                  const esHoy  = iso === hoy;
                  const slotCitas = getCitasDeSlot(citas, iso, hora);

                  return (
                    <div key={di} style={{ borderLeft: '1px solid rgba(255,255,255,0.04)', padding: '2px 3px', position: 'relative', background: esHoy ? 'rgba(45,212,191,0.02)' : 'transparent', minHeight: 44 }}>
                      {slotCitas.filter(c => isInicioDeSlot(c, hora)).map(cita => {
                        const durMin = horaToMin((cita.hora_fin || cita.hora_inicio).substring(0, 5)) - horaToMin(cita.hora_inicio.substring(0, 5));
                        const slots  = Math.max(1, Math.round(durMin / 30));
                        const col    = ESTADO_COLOR[cita.estado] || ESTADO_COLOR.pendiente;
                        return (
                          <div
                            key={cita.id}
                            onClick={() => setSeleccion(cita)}
                            style={{
                              background: col.bg, border: `1.5px solid ${col.border}`,
                              borderRadius: 8, padding: '4px 7px',
                              height: `${slots * 44 - 6}px`,
                              overflow: 'hidden', cursor: 'pointer',
                              position: 'absolute', top: 2, left: 3, right: 3,
                              zIndex: 5,
                            }}
                          >
                            <div style={{ color: col.text, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cita.hora_inicio.substring(0, 5)} {cita.paciente_nombre}
                            </div>
                            {slots > 1 && cita.motivo && (
                              <div style={{ color: col.text + 'AA', fontSize: 10, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {cita.motivo}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de detalle de cita */}
      {seleccion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setSeleccion(null)}>
          <div style={{ background: '#0F2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, margin: 0 }}>{seleccion.paciente_nombre}</h3>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: (ESTADO_COLOR[seleccion.estado]?.bg || ''), color: (ESTADO_COLOR[seleccion.estado]?.text || '#fff'), border: `1px solid ${ESTADO_COLOR[seleccion.estado]?.border || '#fff'}`, textTransform: 'capitalize', fontWeight: 600 }}>
                  {seleccion.estado}
                </span>
              </div>
              <button onClick={() => setSeleccion(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#94A3B8', cursor: 'pointer', fontSize: 18, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Fecha',   value: new Date(seleccion.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Horario', value: `${seleccion.hora_inicio.substring(0,5)} – ${seleccion.hora_fin?.substring(0,5) || '—'}` },
                seleccion.motivo ? { label: 'Motivo', value: seleccion.motivo } : null,
              ].filter(Boolean).map((row: any, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600, marginBottom: 3 }}>{row.label}</div>
                  <div style={{ color: '#E2E8F0', fontSize: 14 }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 10,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
