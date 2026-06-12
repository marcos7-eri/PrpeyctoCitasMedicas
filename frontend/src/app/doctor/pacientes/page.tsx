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

export default function PacientesDoctor() {
  const [cargando, setCargando] = useState(true);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => { obtenerDoctorId(); }, []);
  useEffect(() => { if (doctorId) cargarPacientes(); }, [doctorId]);

  const obtenerDoctorId = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const doctores = await api.get<any[]>(`/doctores?perfil_id=${userData.user.id}`);
        if (doctores && doctores.length > 0) setDoctorId(doctores[0].id);
      }
    } catch (error) { console.error('Error obteniendo doctor ID:', error); }
  };

  const cargarPacientes = async () => {
    if (!doctorId) return;
    try {
      setCargando(true);
      const citas = await api.get<any[]>(`/citas?doctor_id=${doctorId}`);
      const pacientesMap = new Map<string, Paciente>();
      (citas || []).forEach((cita: any) => {
        const perfil = cita.pacientes?.perfiles;
        if (perfil) {
          const pacienteId = cita.paciente_id;
          if (!pacientesMap.has(pacienteId)) {
            pacientesMap.set(pacienteId, { id: pacienteId, nombre_completo: perfil.nombre_completo || 'Paciente', correo: perfil.correo || '', telefono: perfil.telefono || null, total_citas: 1 });
          } else {
            pacientesMap.get(pacienteId)!.total_citas++;
          }
        }
      });
      setPacientes(Array.from(pacientesMap.values()));
    } catch (error) { console.error('Error cargando pacientes:', error); } finally { setCargando(false); }
  };

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input type="text" placeholder="Buscar por nombre o correo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={styles.input} />
          <button style={styles.btnSecondary} onClick={cargarPacientes}>Recargar</button>
        </div>
      </div>
      <div style={styles.tableBox}>
        <div style={styles.tableHeader}><h3 style={styles.tableTitle}>Mis pacientes</h3></div>
        {cargando ? (
          <div style={styles.emptyState}>Cargando pacientes...</div>
        ) : pacientesFiltrados.length === 0 ? (
          <div style={styles.emptyState}>No hay pacientes registrados</div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Paciente</th><th style={styles.th}>Correo</th><th style={styles.th}>Teléfono</th><th style={styles.th}>Total citas</th></tr></thead>
              <tbody>
                {pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.id}>
                    <td style={styles.td}><strong>{paciente.nombre_completo}</strong></td>
                    <td style={styles.td}>{paciente.correo}</td>
                    <td style={styles.td}>{paciente.telefono || '—'}</td>
                    <td style={styles.td}><span style={styles.badgeActive}>{paciente.total_citas}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
