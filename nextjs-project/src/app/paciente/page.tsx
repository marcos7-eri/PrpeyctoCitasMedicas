'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';

export default function DashboardPaciente() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [stats, setStats] = useState({ totalCitas: 0, citasPendientes: 0, citasCompletadas: 0, citasCanceladas: 0 });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (usuario) cargarStats();
  }, [usuario]);

  const cargarStats = async () => {
    try {
      setCargando(true);
      const { data: paciente } = await supabase.from('pacientes').select('id').eq('perfil_id', usuario?.id).single();
      if (!paciente) return;
      const [total, pendientes, completadas, canceladas] = await Promise.all([
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('paciente_id', paciente.id),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('paciente_id', paciente.id).eq('estado', 'pendiente'),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('paciente_id', paciente.id).eq('estado', 'completada'),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('paciente_id', paciente.id).eq('estado', 'cancelada'),
      ]);
      setStats({ totalCitas: total.count || 0, citasPendientes: pendientes.count || 0, citasCompletadas: completadas.count || 0, citasCanceladas: canceladas.count || 0 });
    } catch (error) { console.error('Error cargando stats:', error); } finally { setCargando(false); }
  };

  return (
    <>
      <div style={styles.cardsGrid}>
        <div style={styles.card}><p style={styles.cardTitle}>Total de citas</p><h3 style={styles.cardValue}>{cargando ? '...' : stats.totalCitas}</h3><p style={styles.cardSubtitle}>Historial completo</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Citas pendientes</p><h3 style={styles.cardValue}>{cargando ? '...' : stats.citasPendientes}</h3><p style={styles.cardSubtitle}>Por confirmar</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Citas completadas</p><h3 style={styles.cardValue}>{cargando ? '...' : stats.citasCompletadas}</h3><p style={styles.cardSubtitle}>Consultas realizadas</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Citas canceladas</p><h3 style={styles.cardValue}>{cargando ? '...' : stats.citasCanceladas}</h3><p style={styles.cardSubtitle}>Citas canceladas</p></div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Bienvenido, {usuario?.nombre_completo || 'Paciente'}</h3>
        </div>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ color: '#94A3B8', fontSize: '15px', margin: '0 0 24px' }}>Gestiona tus citas médicas desde este portal</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button style={styles.btnPrimary} onClick={() => router.push('/paciente/citas')}>Ver mis citas</button>
            <button style={styles.btnSecondary} onClick={() => router.push('/paciente/perfil')}>Mi perfil</button>
          </div>
        </div>
      </div>
    </>
  );
}
