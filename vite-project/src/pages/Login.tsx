import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Perfil } from '../types';

export default function Login() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const iniciarSesion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const { data, error: errorLogin } = await supabase.auth.signInWithPassword({
        email: correo,
        password: contrasena,
      });

      if (errorLogin) {
        setError(errorLogin.message);
        setCargando(false);
        return;
      }

      const usuarioId = data.user.id;

      const { data: perfil, error: errorPerfil } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, correo, rol, estado')
        .eq('id', usuarioId)
        .single<Perfil>();

      if (errorPerfil || !perfil) {
        setError('No se pudo obtener el perfil del usuario');
        setCargando(false);
        return;
      }

      if (perfil.estado !== 'activo') {
        setError('La cuenta está inactiva');
        setCargando(false);
        return;
      }

      if (perfil.rol === 'admin') {
        navigate('/admin');
      } else if (perfil.rol === 'doctor') {
        navigate('/doctor');
      } else if (perfil.rol === 'paciente') {
        navigate('/paciente');
      } else {
        setError('Rol no válido');
      }
    } catch {
      setError('Ocurrió un error inesperado');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Fondo animado */}
      <div style={styles.animatedBackground}>
        <div style={styles.gradientOrb1}></div>
        <div style={styles.gradientOrb2}></div>
        <div style={styles.gradientOrb3}></div>
      </div>

      {/* Grid de fondo */}
      <div style={styles.gridPattern}></div>

      <div style={styles.card}>
        {/* Logo y título */}
        <div style={styles.logoArea}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoCircle}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15 8H9L12 2Z" fill="#319795" stroke="#319795" strokeWidth="1.5"/>
                <path d="M12 22L9 16H15L12 22Z" fill="#319795" stroke="#319795" strokeWidth="1.5"/>
                <rect x="5" y="8" width="14" height="8" rx="2" fill="#319795" opacity="0.8"/>
                <circle cx="12" cy="12" r="2" fill="white"/>
              </svg>
            </div>
          </div>
          <h1 style={styles.clinicName}>
            Clínica<span style={styles.highlight}>Salud Total</span>
          </h1>
          <p style={styles.systemName}>Sistema de Gestión de Citas Médicas</p>
        </div>

        {/* Formulario */}
        <form onSubmit={iniciarSesion} style={styles.form}>
          <div style={styles.headerText}>
            <h2 style={styles.formTitle}>Bienvenido</h2>
            <p style={styles.formSubtitle}>Ingresa tus credenciales para continuar</p>
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.inputContainer}>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                style={styles.input}
                className="input-field"
                required
              />
              <svg style={styles.inputIconLeft} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 3.33333H17.5C18.3333 3.33333 19.1667 4.16667 19.1667 5V15C19.1667 15.8333 18.3333 16.6667 17.5 16.6667H2.5C1.66667 16.6667 0.833333 15.8333 0.833333 15V5C0.833333 4.16667 1.66667 3.33333 2.5 3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M19.1667 5L10 11.6667L0.833333 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.inputContainer}>
              <input
                type={mostrarPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                style={styles.input}
                className="input-field"
                required
              />
              <svg style={styles.inputIconLeft} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15.8333 9.16667H4.16667C3.24619 9.16667 2.5 9.91286 2.5 10.8333V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V10.8333C17.5 9.91286 16.7538 9.16667 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M5.83333 9.16667V5.83333C5.83333 4.72826 6.27232 3.66845 7.05372 2.88705C7.83512 2.10565 8.89493 1.66667 10 1.66667C11.1051 1.66667 12.1649 2.10565 12.9463 2.88705C13.7277 3.66845 14.1667 4.72826 14.1667 5.83333V9.16667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={styles.passwordToggle}
              >
                {mostrarPassword ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12.5 7.5L7.5 12.5M12.5 12.5L7.5 7.5M10 16.6667C5.39763 16.6667 1.66667 10 1.66667 10C1.66667 10 5.39763 3.33333 10 3.33333C14.6024 3.33333 18.3333 10 18.3333 10C18.3333 10 14.6024 16.6667 10 16.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2.5 10C2.5 10 5.39763 3.33333 10 3.33333C14.6024 3.33333 17.5 10 17.5 10C17.5 10 14.6024 16.6667 10 16.6667C5.39763 16.6667 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" style={styles.checkbox} />
              <span style={styles.checkboxText}>Recordar sesión</span>
            </label>
            <a href="#" style={styles.forgotLink}>¿Olvidaste tu contraseña?</a>
          </div>

          {error && (
            <div style={styles.errorContainer}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 6.66667V10M10 13.3333H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z" stroke="#E53E3E" strokeWidth="1.5"/>
              </svg>
              <p style={styles.errorText}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(cargando ? styles.buttonDisabled : {})
            }}
            disabled={cargando}
            className="submit-button"
          >
            {cargando ? (
              <span style={styles.loadingWrapper}>
                <span style={styles.spinner}></span>
                Ingresando...
              </span>
            ) : (
              'Iniciar sesión'
            )}
          </button>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              ¿Necesitas ayuda? <a href="#" style={styles.footerLink}>Contacta con soporte</a>
            </p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .input-field {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .input-field:focus {
          transform: translateY(-1px);
        }
        
        .submit-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(49,151,149,0.3);
        }
        
        .submit-button:active {
          transform: translateY(0);
        }
        
        .submit-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .submit-button:active::before {
          width: 300px;
          height: 300px;
        }
        
        @keyframes gradientShift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: '#0A0F1C',
    overflow: 'hidden',
  },
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientOrb1: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(49,151,149,0.3) 0%, rgba(49,151,149,0) 70%)',
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
    background: 'radial-gradient(circle, rgba(79,70,229,0.2) 0%, rgba(79,70,229,0) 70%)',
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
    background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(236,72,153,0) 70%)',
    filter: 'blur(60px)',
    animation: 'gradientShift 25s ease-in-out infinite',
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '50px 50px',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: '460px',
    background: 'rgba(20, 24, 35, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: '32px',
    padding: '48px 40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    animation: 'slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  logoWrapper: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  logoCircle: {
    width: '70px',
    height: '70px',
    background: 'linear-gradient(135deg, rgba(49,151,149,0.2) 0%, rgba(49,151,149,0.1) 100%)',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(49,151,149,0.3)',
    animation: 'float 3s ease-in-out infinite',
  },
  clinicName: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  highlight: {
    color: '#319795',
  },
  systemName: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: 0,
  },
  form: {
    width: '100%',
  },
  headerText: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  formTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: 0,
  },
  inputGroup: {
    marginBottom: '20px',
  },
  inputContainer: {
    position: 'relative',
  },
  inputIconLeft: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#64748B',
  },
  input: {
    width: '100%',
    padding: '14px 14px 14px 44px',
    background: 'rgba(15, 18, 28, 0.8)',
    border: '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#FFFFFF',
  },
  passwordToggle: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748B',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '13px',
    color: '#94A3B8',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#319795',
  },
  forgotLink: {
    fontSize: '13px',
    color: '#319795',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s ease',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: 'rgba(229,62,62,0.1)',
    borderRadius: '16px',
    marginBottom: '24px',
    border: '1px solid rgba(229,62,62,0.2)',
  },
  errorText: {
    color: '#F56565',
    fontSize: '13px',
    margin: 0,
    flex: 1,
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #319795 0%, #267B79 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  loadingWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footer: {
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#64748B',
    margin: 0,
  },
  footerLink: {
    color: '#319795',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s ease',
  },
};


// Agregar estilos para hover states
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .input-field:hover {
    border-color: rgba(49,151,149,0.5);
  }
  
  .input-field:focus {
    border-color: #319795;
    box-shadow: 0 0 0 3px rgba(49,151,149,0.1);
  }
  
  .forgot-link:hover,
  .footer-link:hover {
    color: #4FB6B4;
  }
`;
document.head.appendChild(styleSheet);