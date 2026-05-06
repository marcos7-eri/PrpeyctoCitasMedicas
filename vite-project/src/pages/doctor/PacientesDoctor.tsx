import { useEffect, useState } from 'react';
import DoctorLayout from './DoctorLayout';
import { adminStyles as styles } from '../Admin/admin';
import { supabase } from '../../lib/supabase';

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

  useEffect(() => {
    obtenerDoctorId();
  }, []);

  useEffect(() => {
    if (doctorId) {
      cargarPacientes();
    }
  }, [doctorId]);

  const obtenerDoctorId = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: doctorData } = await supabase
          .from('doctores')
          .select('id')
          .eq('perfil_id', userData.user.id)
          .single();

        if (doctorData) {
          setDoctorId(doctorData.id);
        }
      }
    } catch (error) {
      console.error('Error obteniendo doctor ID:', error);
    }
  };

  const cargarPacientes = async () => {
    if (!doctorId) return;

    try {
      setCargando(true);

      const { data, error } = await supabase
        .from('citas')
        .select(`
          paciente_id,
          pacientes (
            perfiles (
              id,
              nombre_completo,
              correo,
              telefono
            )
          )
        `)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      const pacientesMap = new Map();

      (data || []).forEach((cita: any) => {
        const perfil = cita.pacientes?.perfiles;
        if (perfil && !pacientesMap.has(perfil.id)) {
          pacientesMap.set(perfil.id, {
            id: perfil.id,
            nombre_completo: perfil.nombre_completo,
            correo: perfil.correo,
            telefono: perfil.telefono,
            total_citas: 1,
          });
        } else if (perfil && pacientesMap.has(perfil.id)) {
          const existing = pacientesMap.get(perfil.id);
          existing.total_citas++;
        }
      });

      setPacientes(Array.from(pacientesMap.values()));
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    } finally {
      setCargando(false);
    }
  };

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <DoctorLayout titulo="Pacientes" subtitulo="Lista de pacientes atendidos">
      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.input}
          />
          <button style={styles.btnSecondary} onClick={cargarPacientes}>Recargar</button>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Mis pacientes</h3>
        </div>

        {cargando ? (
          <div style={styles.emptyState}>Cargando pacientes...</div>
        ) : pacientesFiltrados.length === 0 ? (
          <div style={styles.emptyState}>No hay pacientes registrados</div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Paciente</th>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>Teléfono</th>
                  <th style={styles.th}>Total citas</th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.id}>
                    <td style={styles.td}>
                      <strong>{paciente.nombre_completo}</strong>
                    </td>
                    <td style={styles.td}>{paciente.correo}</td>
                    <td style={styles.td}>{paciente.telefono || '—'}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeActive}>{paciente.total_citas}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}