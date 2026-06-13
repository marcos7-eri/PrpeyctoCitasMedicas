'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

interface PerfilGuardado {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: string;
  estado: string;
  telefono?: string | null;
  foto_url?: string | null;
}

interface DoctorLayoutProps {
  children: React.ReactNode;
}

function DoctorLayoutInner({ children }: DoctorLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { cerrarSesion } = useAuth();
  const [perfil, setPerfil] = useState<PerfilGuardado | null>(null);

  useEffect(() => {
    const cargarPerfilLocal = () => {
      try {
        const perfilGuardado = localStorage.getItem('perfil');
        setPerfil(perfilGuardado ? JSON.parse(perfilGuardado) : null);
      } catch { setPerfil(null); }
    };
    cargarPerfilLocal();
    window.addEventListener('storage', cargarPerfilLocal);
    window.addEventListener('perfil-actualizado', cargarPerfilLocal as EventListener);
    return () => {
      window.removeEventListener('storage', cargarPerfilLocal);
      window.removeEventListener('perfil-actualizado', cargarPerfilLocal as EventListener);
    };
  }, []);

  const nombreMostrar = perfil?.nombre_completo || 'Doctor';
  const rolMostrar = perfil?.rol === 'admin' ? 'Administrador' : perfil?.rol === 'doctor' ? 'Doctor' : perfil?.rol === 'paciente' ? 'Paciente' : 'doctor';
  const iniciales = useMemo(() => {
    const nombre = perfil?.nombre_completo?.trim() || 'Doctor';
    const partes = nombre.split(' ').filter(Boolean);
    if (partes.length === 0) return 'DR';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }, [perfil]);

  const menuDoctor = [
    { nombre: 'Dashboard', ruta: '/doctor', icono: 'M3 3H10V10H3V3ZM11 3H18V10H11V3ZM3 11H10V18H3V11ZM11 11H18V18H11V11Z' },
    { nombre: 'Mis citas', ruta: '/doctor/citas', icono: 'M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z' },
    { nombre: 'Horarios', ruta: '/doctor/horarios', icono: 'M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 6V12L16 14' },
    { nombre: 'Pacientes', ruta: '/doctor/pacientes', icono: 'M17 20H7V18C7 15.2386 9.23858 13 12 13C14.7614 13 17 15.2386 17 18V20ZM12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z' },
    { nombre: 'Historial médico', ruta: '/doctor/historial', icono: 'M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01' },
    { nombre: 'Agenda',         ruta: '/doctor/agenda',         icono: 'M3 5H21M3 10H21M3 15H21M3 20H21M8 2V5M16 2V5' },
    { nombre: 'Notificaciones', ruta: '/doctor/notificaciones', icono: 'M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9' },
    { nombre: 'Perfil', ruta: '/doctor/perfil', icono: 'M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7ZM12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.animatedBg}>
        <div style={styles.orb1} /><div style={styles.orb2} /><div style={styles.orb3} />
      </div>

      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z" fill="#319795" stroke="#FFFFFF" strokeWidth="1.5"/>
              <path d="M16 10V16L20 19" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="16" cy="16" r="1.5" fill="#FFFFFF"/>
            </svg>
          </div>
          <div>
            <h2 style={styles.logoTitle}>Clínica<span style={styles.logoHighlight}>Salud Total</span></h2>
            <p style={styles.logoSubtitle}>Panel Doctor</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {menuDoctor.map((item) => {
            const isActive = pathname === item.ruta;
            return (
              <button key={item.nombre} style={isActive ? styles.navItemActive : styles.navItem} className="menu-item" onClick={() => router.push(item.ruta)}>
                <span style={styles.navIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d={item.icono} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>{item.nombre}</span>
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button style={styles.logoutBtn} onClick={cerrarSesion} className="logout-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>{menuDoctor.find(m => m.ruta === pathname)?.nombre || 'Doctor'}</h1>
            <p style={styles.pageSubtitle}>Panel del doctor</p>
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userText}>
              <p style={styles.userName}>{nombreMostrar}</p>
              <p style={styles.userRole}>{rolMostrar}</p>
            </div>
            {perfil?.foto_url ? (
              <img src={perfil.foto_url} alt={nombreMostrar} style={styles.avatarImage}/>
            ) : (
              <div style={styles.avatar}><span>{iniciales}</span></div>
            )}
          </div>
        </header>
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  return (
    <ProtectedRoute rolPermitido="doctor">
      <DoctorLayoutInner>{children}</DoctorLayoutInner>
    </ProtectedRoute>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#0A0F1C', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative', overflow: 'hidden' },
  animatedBg: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 },
  orb1: { position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(49,151,149,0.2) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 15s ease-in-out infinite' },
  orb2: { position: 'absolute', bottom: '-10%', left: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 20s ease-in-out infinite reverse' },
  orb3: { position: 'absolute', top: '40%', left: '30%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 25s ease-in-out infinite' },
  sidebar: { width: '280px', background: 'rgba(15, 18, 28, 0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', padding: '24px 20px', position: 'relative', zIndex: 10 },
  logoArea: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid rgba(49,151,149,0.2)' },
  logoIcon: { width: '48px', height: '48px', background: 'rgba(49,151,149,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(49,151,149,0.3)' },
  logoTitle: { fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: 0 },
  logoHighlight: { color: '#319795' },
  logoSubtitle: { fontSize: '11px', color: '#94A3B8', margin: '4px 0 0' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: '14px', color: '#CBD5E1', fontSize: '14px', fontWeight: '500', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  navItemActive: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'linear-gradient(135deg, #319795 0%, #267B79 100%)', border: 'none', borderRadius: '14px', color: '#FFFFFF', fontSize: '14px', fontWeight: '500', cursor: 'pointer', boxShadow: '0 4px 12px rgba(49,151,149,0.3)', fontFamily: 'inherit' },
  navIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px' },
  sidebarFooter: { marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.2)', borderRadius: '14px', color: '#FCA5A5', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  main: { flex: 1, padding: '24px 32px', position: 'relative', zIndex: 10, overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', padding: '20px 24px', background: 'rgba(15, 18, 28, 0.95)', backdropFilter: 'blur(12px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' },
  pageSubtitle: { fontSize: '13px', color: '#94A3B8', margin: '6px 0 0' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  userText: { textAlign: 'right' },
  userName: { fontSize: '14px', fontWeight: '600', color: '#FFFFFF', margin: 0 },
  userRole: { fontSize: '12px', color: '#319795', margin: '4px 0 0' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #319795 0%, #0A2540 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '600', fontSize: '16px', border: '2px solid rgba(49,151,149,0.3)' },
  avatarImage: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(49,151,149,0.3)', display: 'block' },
  content: { animation: 'fadeInUp 0.4s ease-out' },
};
