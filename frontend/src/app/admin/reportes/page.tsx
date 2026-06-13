'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { adminStyles as styles } from '@/styles/adminStyles';

interface FiltroCitas {
  desde: string;
  hasta: string;
  estado: string;
}

function descargarCSV(headers: string[], filas: (string | number | null)[][], nombre: string) {
  const escapar = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const contenido = [headers.map(escapar), ...filas.map(f => f.map(escapar))].join('\n');
  const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: `${nombre}_${new Date().toISOString().split('T')[0]}.csv` });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportesPage() {
  const hoy   = new Date().toISOString().split('T')[0];
  const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [filtro,    setFiltro]    = useState<FiltroCitas>({ desde: hace30, hasta: hoy, estado: '' });
  const [previewCitas,  setPreviewCitas]  = useState<any[]>([]);
  const [previewPac,    setPreviewPac]    = useState<any[]>([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [cargandoPac,   setCargandoPac]   = useState(false);
  const [exportandoCitas, setExportandoCitas] = useState(false);
  const [exportandoPac,   setExportandoPac]   = useState(false);

  useEffect(() => { cargarPreviewCitas(); }, [filtro.desde, filtro.hasta, filtro.estado]);
  useEffect(() => { cargarPreviewPac(); }, []);

  async function cargarPreviewCitas() {
    setCargandoCitas(true);
    try {
      const todas = await api.get<any[]>('/citas');
      const filtradas = (todas || []).filter((c: any) => {
        const ok_fecha  = c.fecha >= filtro.desde && c.fecha <= filtro.hasta;
        const ok_estado = !filtro.estado || c.estado === filtro.estado;
        return ok_fecha && ok_estado;
      });
      setPreviewCitas(filtradas.slice(0, 8));
    } catch (e) { console.error(e); }
    finally { setCargandoCitas(false); }
  }

  async function cargarPreviewPac() {
    setCargandoPac(true);
    try {
      const data = await api.get<any[]>('/pacientes');
      setPreviewPac((data || []).slice(0, 8));
    } catch (e) { console.error(e); }
    finally { setCargandoPac(false); }
  }

  async function exportarCitasCSV() {
    setExportandoCitas(true);
    try {
      const todas = await api.get<any[]>('/citas');
      const filtradas = (todas || []).filter((c: any) => {
        const ok_fecha  = c.fecha >= filtro.desde && c.fecha <= filtro.hasta;
        const ok_estado = !filtro.estado || c.estado === filtro.estado;
        return ok_fecha && ok_estado;
      });

      const headers = ['ID', 'Fecha', 'Hora', 'Paciente', 'Doctor', 'Especialidad', 'Estado', 'Motivo'];
      const filas = filtradas.map((c: any) => [
        c.id,
        c.fecha,
        c.hora_inicio?.substring(0, 5) || '',
        c.pacientes?.perfiles?.nombre_completo || '',
        c.doctores?.perfiles?.nombre_completo || '',
        c.doctores?.especialidades?.nombre || '',
        c.estado,
        c.motivo || '',
      ]);
      descargarCSV(headers, filas, 'citas');
    } catch (e) { console.error(e); }
    finally { setExportandoCitas(false); }
  }

  async function exportarPacientesCSV() {
    setExportandoPac(true);
    try {
      const data = await api.get<any[]>('/pacientes');
      const headers = ['ID', 'Nombre', 'Correo', 'Teléfono', 'Fecha nacimiento', 'Grupo sanguíneo', 'Estado'];
      const filas = (data || []).map((p: any) => [
        p.id,
        p.perfiles?.nombre_completo || '',
        p.perfiles?.correo || '',
        p.perfiles?.telefono || '',
        p.fecha_nacimiento || '',
        p.grupo_sanguineo || '',
        p.perfiles?.estado || '',
      ]);
      descargarCSV(headers, filas, 'pacientes');
    } catch (e) { console.error(e); }
    finally { setExportandoPac(false); }
  }

  function imprimirEstadisticas() {
    window.print();
  }

  const ESTADOS = ['pendiente', 'confirmada', 'completada', 'cancelada'];
  const ESTADO_COLOR: Record<string, string> = {
    pendiente: '#F59E0B', confirmada: '#10B981', completada: '#6366F1', cancelada: '#EF4444',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`@media print { .no-print { display: none !important; } body { background: white; color: black; } }`}</style>

      {/* Filtros */}
      <div style={{ ...styles.filtersBox }} className="no-print">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ color: '#64748B', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Desde</label>
            <input type="date" value={filtro.desde} onChange={e => setFiltro(p => ({ ...p, desde: e.target.value }))} style={styles.input} />
          </div>
          <div>
            <label style={{ color: '#64748B', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Hasta</label>
            <input type="date" value={filtro.hasta} onChange={e => setFiltro(p => ({ ...p, hasta: e.target.value }))} style={styles.input} />
          </div>
          <div>
            <label style={{ color: '#64748B', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Estado</label>
            <select value={filtro.estado} onChange={e => setFiltro(p => ({ ...p, estado: e.target.value }))} style={styles.select}>
              <option value="">Todos los estados</option>
              {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Sección Citas */}
      <div style={styles.tableBox}>
        <div style={styles.tableHeader}>
          <div>
            <h3 style={styles.tableTitle}>Reporte de citas</h3>
            <div style={{ color: '#64748B', fontSize: 12, marginTop: 3 }}>
              {filtro.desde} — {filtro.hasta}{filtro.estado ? ` · Solo ${filtro.estado}` : ''}
            </div>
          </div>
          <button
            style={{ ...styles.btnPrimary, opacity: exportandoCitas ? 0.7 : 1 }}
            onClick={exportarCitasCSV}
            disabled={exportandoCitas}
            className="no-print"
          >
            {exportandoCitas ? 'Exportando...' : 'Descargar CSV'}
          </button>
        </div>

        {cargandoCitas ? (
          <div style={styles.emptyState}>Cargando citas...</div>
        ) : previewCitas.length === 0 ? (
          <div style={styles.emptyState}>Sin citas en el rango seleccionado</div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Paciente</th>
                  <th style={styles.th}>Doctor</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {previewCitas.map((c: any) => (
                  <tr key={c.id}>
                    <td style={styles.td}>{c.fecha}</td>
                    <td style={styles.td}>{c.hora_inicio?.substring(0, 5)}</td>
                    <td style={styles.td}>{c.pacientes?.perfiles?.nombre_completo || '—'}</td>
                    <td style={styles.td}>{c.doctores?.perfiles?.nombre_completo || '—'}</td>
                    <td style={styles.td}>
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                        background: `${ESTADO_COLOR[c.estado] || '#94A3B8'}22`,
                        color: ESTADO_COLOR[c.estado] || '#94A3B8',
                      }}>
                        {c.estado}
                      </span>
                    </td>
                    <td style={{ ...styles.td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.motivo || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 20px', color: '#64748B', fontSize: 12 }}>
              Mostrando 8 de los registros — el CSV exporta todos.
            </div>
          </div>
        )}
      </div>

      {/* Sección Pacientes */}
      <div style={styles.tableBox}>
        <div style={styles.tableHeader}>
          <div>
            <h3 style={styles.tableTitle}>Reporte de pacientes</h3>
            <div style={{ color: '#64748B', fontSize: 12, marginTop: 3 }}>Todos los pacientes registrados</div>
          </div>
          <button
            style={{ ...styles.btnPrimary, opacity: exportandoPac ? 0.7 : 1 }}
            onClick={exportarPacientesCSV}
            disabled={exportandoPac}
            className="no-print"
          >
            {exportandoPac ? 'Exportando...' : 'Descargar CSV'}
          </button>
        </div>

        {cargandoPac ? (
          <div style={styles.emptyState}>Cargando pacientes...</div>
        ) : previewPac.length === 0 ? (
          <div style={styles.emptyState}>Sin pacientes registrados</div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>Teléfono</th>
                  <th style={styles.th}>Fecha nacimiento</th>
                  <th style={styles.th}>Grupo sanguíneo</th>
                  <th style={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewPac.map((p: any) => (
                  <tr key={p.id}>
                    <td style={styles.td}><strong>{p.perfiles?.nombre_completo || '—'}</strong></td>
                    <td style={styles.td}>{p.perfiles?.correo || '—'}</td>
                    <td style={styles.td}>{p.perfiles?.telefono || '—'}</td>
                    <td style={styles.td}>{p.fecha_nacimiento || '—'}</td>
                    <td style={styles.td}>{p.grupo_sanguineo || '—'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badgeActive, background: p.perfiles?.estado === 'activo' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: p.perfiles?.estado === 'activo' ? '#4ADE80' : '#F87171' }}>
                        {p.perfiles?.estado || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 20px', color: '#64748B', fontSize: 12 }}>
              Mostrando 8 de los registros — el CSV exporta todos.
            </div>
          </div>
        )}
      </div>

      {/* Imprimir página */}
      <div style={{ ...styles.filtersBox, display: 'flex', justifyContent: 'flex-end' }} className="no-print">
        <button style={styles.btnSecondary} onClick={imprimirEstadisticas}>
          Imprimir / Guardar como PDF
        </button>
      </div>
    </div>
  );
}
