import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

interface DoctorLayoutProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}

interface PerfilGuardado {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: string;
  estado: string;
  telefono?: string | null;
  foto_url?: string | null;
}

export default function DoctorLayout({
  titulo,
  subtitulo,
  children,
}: DoctorLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cerrarSesion } = useAuth();

  const [perfil, setPerfil] = useState<PerfilGuardado | null>(null);

  useEffect(() => {
    const cargarPerfilLocal = () => {
      try {
        const perfilGuardado = localStorage.getItem('perfil');
        if (perfilGuardado) {
          setPerfil(JSON.parse(perfilGuardado));
        } else {
          setPerfil(null);
        }
      } catch {
        setPerfil(null);
      }
    };

    cargarPerfilLocal();

    window.addEventListener('storage', cargarPerfilLocal);
    window.addEventListener('perfil-actualizado', cargarPerfilLocal as EventListener);

    return () => {
      window.removeEventListener('storage', cargarPerfilLocal);
      window.removeEventListener('perfil-actualizado', cargarPerfilLocal as EventListener);
    };
  }, []);

  const nombreMostrar = useMemo(() => {
    return perfil?.nombre_completo || 'Doctor';
  }, [perfil]);

  const rolMostrar = useMemo(() => {
    if (perfil?.rol === 'admin') return 'Administrador';
    if (perfil?.rol === 'doctor') return 'Doctor';
    if (perfil?.rol === 'paciente') return 'Paciente';
    return perfil?.rol || 'doctor';
  }, [perfil]);

  const iniciales = useMemo(() => {
    const nombre = perfil?.nombre_completo?.trim() || 'Doctor';
    const partes = nombre.split(' ').filter(Boolean);

    if (partes.length === 0) return 'DR';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }, [perfil]);

  const menuDoctor = [
    { nombre: 'Dashboard', ruta: '/doctor' },
    { nombre: 'Mis citas', ruta: '/doctor/citas' },
    { nombre: 'Horarios', ruta: '/doctor/horarios' },
    { nombre: 'Pacientes', ruta: '/doctor/pacientes' },
    { nombre: 'Historial médico', ruta: '/doctor/historial' },
    { nombre: 'Notificaciones', ruta: '/doctor/notificaciones' },
    { nombre: 'Perfil', ruta: '/doctor/perfil' },
  ];

  return (
    <div style={styles.contenedorGeneral}>
      <div style={styles.animatedBackground}>
        <div style={styles.gradientOrb1}></div>
        <div style={styles.gradientOrb2}></div>
        <div style={styles.gradientOrb3}></div>
      </div>

      <aside style={styles.sidebar}>
        <div style={styles.logoBox}>
          <div style={styles.logoIcono}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z" fill="#319795" stroke="#FFFFFF" strokeWidth="1.5" />
              <path d="M16 10V16L20 19" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="16" cy="16" r="1.5" fill="#FFFFFF" />
            </svg>
          </div>
          <div>
            <h2 style={styles.logoTitulo}>
              Clínica<span style={styles.logoHighlight}>Salud Total</span>
            </h2>
            <p style={styles.logoSubtitulo}>Panel Doctor</p>
          </div>
        </div>

        <nav style={styles.menu}>
          {menuDoctor.map((item) => {
            const isActive = location.pathname === item.ruta;

            return (
              <button
                key={item.nombre}
                style={isActive ? styles.menuActivo : styles.menuItem}
                className="menu-item"
                onClick={() => navigate(item.ruta)}
              >
                <span style={styles.menuIcono}>
                  {item.nombre === 'Dashboard' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  )}
                  {item.nombre === 'Mis citas' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M2 6H18M5 2V4M15 2V4M4 10H7M10 10H13M4 14H7M10 14H13M3 4H17C17.5523 4 18 4.44772 18 5V17C18 17.5523 17.5523 18 17 18H3C2.44772 18 2 17.5523 2 17V5C2 4.44772 2.44772 4 3 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.nombre === 'Horarios' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M10 4V10L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.nombre === 'Pacientes' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M13 5C13 6.65685 11.6569 8 10 8C8.34315 8 7 6.65685 7 5C7 3.34315 8.34315 2 10 2C11.6569 2 13 3.34315 13 5Z" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M4 17C4 14.2386 6.23858 12 9 12H11C13.7614 12 16 14.2386 16 17V18H4V17Z" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  )}
                  {item.nombre === 'Historial médico' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M6 3H14C15.1046 3 16 3.89543 16 5V15C16 16.1046 15.1046 17 14 17H6C4.89543 17 4 16.1046 4 15V5C4 3.89543 4.89543 3 6 3Z" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M7 7H13M7 10H13M7 13H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.nombre === 'Notificaciones' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M15 14H18L16.9 12.9C16.6014 12.6014 16.4336 12.1964 16.4336 11.774V9.3C16.4336 7.25153 15.1242 5.50815 13.3 4.86223V4.6C13.3 3.73392 12.5661 3 11.7 3C10.8339 3 10.1 3.73392 10.1 4.6V4.86223C8.27582 5.50815 6.96641 7.25153 6.96641 9.3V11.774C6.96641 12.1964 6.79863 12.6014 6.50005 12.9L5.4 14H8.4M15 14V14.6C15 15.9255 13.9255 17 12.6 17C11.2745 17 10.2 15.9255 10.2 14.6V14M15 14H10.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.nombre === 'Perfil' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M4 16C4 13.2386 6.23858 11 9 11H11C13.7614 11 16 13.2386 16 16V17H4V16Z" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  )}
                </span>
                {item.nombre}
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button style={styles.botonCerrar} className="logout-button" onClick={cerrarSesion}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 2H3C2.46957 2 1.96086 2.21071 1.58579 2.58579C1.21071 2.96086 1 3.46957 1 4V14C1 14.5304 1.21071 15.0391 1.58579 15.4142C1.96086 15.7893 2.46957 16 3 16H7M12 12L16 8M16 8L12 4M16 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.titulo}>{titulo}</h1>
            <p style={styles.subtitulo}>{subtitulo}</p>
          </div>

          <div style={styles.usuarioBox}>
            <div style={styles.usuarioInfo}>
              <p style={styles.usuarioNombre}>{nombreMostrar}</p>
              <p style={styles.usuarioRol}>{rolMostrar}</p>
            </div>

            {perfil?.foto_url ? (
              <img
                src={perfil.foto_url}
                alt={nombreMostrar}
                style={styles.avatarImagen}
              />
            ) : (
              <div style={styles.avatar}>
                <span style={styles.avatarTexto}>{iniciales}</span>
              </div>
            )}
          </div>
        </header>

        <div>{children}</div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes gradientShift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .menu-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .menu-item:hover {
          background-color: rgba(49, 151, 149, 0.1);
          transform: translateX(4px);
        }

        .logout-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .logout-button:hover {
          background-color: rgba(229, 62, 62, 0.15);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  contenedorGeneral: {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '20px',
    padding: '20px',
    background: '#0A0F1C',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: 'hidden',
  },
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  gradientOrb1: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(49,151,149,0.15) 0%, rgba(49,151,149,0) 70%)',
    filter: 'blur(60px)',
    animation: 'gradientShift 20s ease-in-out infinite',
  },
  gradientOrb2: {
    position: 'absolute',
    bottom: '-10%',
    left: '-5%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, rgba(79,70,229,0) 70%)',
    filter: 'blur(60px)',
    animation: 'gradientShift 15s ease-in-out infinite reverse',
  },
  gradientOrb3: {
    position: 'absolute',
    top: '40%',
    left: '30%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, rgba(236,72,153,0) 70%)',
    filter: 'blur(60px)',
    animation: 'gradientShift 25s ease-in-out infinite',
  },
  sidebar: {
    position: 'relative',
    zIndex: 2,
    background: 'rgba(15, 18, 28, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '28px',
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(49, 151, 149, 0.2)',
  },
  logoIcono: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, rgba(49,151,149,0.2) 0%, rgba(49,151,149,0.1) 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(49,151,149,0.3)',
    animation: 'float 3s ease-in-out infinite',
  },
  logoTitulo: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoHighlight: {
    color: '#319795',
  },
  logoSubtitulo: {
    margin: '4px 0 0',
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'transparent',
    color: '#CBD5E1',
    border: 'none',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  menuActivo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'linear-gradient(135deg, #319795 0%, #267B79 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(49, 151, 149, 0.3)',
  },
  menuIcono: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  botonCerrar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    background: 'rgba(229, 62, 62, 0.1)',
    color: '#FCA5A5',
    border: '1px solid rgba(229, 62, 62, 0.2)',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  main: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    minWidth: 0,
  },
  header: {
    background: 'rgba(15, 18, 28, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '28px',
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  titulo: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
  },
  subtitulo: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#94A3B8',
  },
  usuarioBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  usuarioInfo: {
    textAlign: 'right',
  },
  usuarioNombre: {
    margin: 0,
    fontWeight: '600',
    color: '#FFFFFF',
    fontSize: '14px',
  },
  usuarioRol: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#319795',
    fontWeight: '500',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #319795 0%, #0A2540 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(49, 151, 149, 0.3)',
    overflow: 'hidden',
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '16px',
  },
  avatarImagen: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(49, 151, 149, 0.3)',
    display: 'block',
  },
};

