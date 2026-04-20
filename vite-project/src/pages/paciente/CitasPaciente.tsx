import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function CitasPaciente() {
  const { usuario } = useAuth();
  const [citas, setCitas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario) {
      cargarCitas();
    }
  }, [usuario]);

  const cargarCitas = async () => {
    try {
      setCargando(true);
      setError('');

      console.log('USUARIO LOGUEADO:', usuario);

      const { data: paciente, error: errorPaciente } = await supabase
        .from('pacientes')
        .select('id, perfil_id')
        .eq('perfil_id', usuario?.id)
        .single();

      console.log('PACIENTE:', paciente);
      console.log('ERROR PACIENTE:', errorPaciente);

      if (errorPaciente || !paciente) {
        setError('No se encontró el paciente asociado');
        return;
      }

      const { data: dataCitas, error: errorCitas } = await supabase
        .from('citas')
        .select('*')
        .eq('paciente_id', paciente.id);

      console.log('CITAS:', dataCitas);
      console.log('ERROR CITAS:', errorCitas);

      if (errorCitas) {
        setError(errorCitas.message);
        return;
      }

      setCitas(dataCitas || []);
    } catch (e) {
      console.log('ERROR GENERAL:', e);
      setError('Error al cargar citas');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return <h2>Cargando citas...</h2>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Mis citas</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {citas.length === 0 ? (
        <p>No tienes ninguna cita</p>
      ) : (
        citas.map((cita) => (
          <div
            key={cita.id}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '10px',
            }}
          >
            <p><b>ID:</b> {cita.id}</p>
            <p><b>Fecha:</b> {cita.fecha}</p>
            <p><b>Hora inicio:</b> {cita.hora_inicio}</p>
            <p><b>Hora fin:</b> {cita.hora_fin}</p>
            <p><b>Estado:</b> {cita.estado}</p>
            <p><b>Motivo:</b> {cita.motivo}</p>
          </div>
        ))
      )}
    </div>
  );
}