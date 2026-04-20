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
      <div style={styles.backgroundDecoration}>
        <div style={styles.blob1}></div>
        <div style={styles.blob2}></div>
      </div>

      <div style={styles.card}>
        {/* Espacio para el logo de la clínica */}
        <div style={styles.logoArea}>
          <div style={styles.logoPlaceholder}>
            {/* Reemplaza este div con tu imagen de logo */}
            <img 
              src="/logo-clinica.png" 
              alt="Logo Clínica" 
              style={styles.logoImage}
              onError={(e) => {
                // Fallback si no existe la imagen
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.style.backgroundColor = '#319795';
                  parent.style.borderRadius = '20px';
                  const fallback = document.createElement('span');
                  fallback.textContent = '🏥';
                  fallback.style.fontSize = '48px';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
          <h1 style={styles.clinicName}>Clínica Salud Total</h1>
          <p style={styles.systemName}>Sistema de Gestión de Citas Médicas</p>
        </div>

        {/* Formulario de Login - texto en NEGRO */}
        <form onSubmit={iniciarSesion} style={styles.form}>
          <h2 style={styles.formTitle}>Iniciar sesión</h2>
          <p style={styles.formSubtitle}>Ingresa tus credenciales para acceder al sistema</p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo electrónico</label>
            <div style={styles.inputWrapper}>
              <svg style={styles.inputIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 3.33333H17.5C18.3333 3.33333 19.1667 4.16667 19.1667 5V15C19.1667 15.8333 18.3333 16.6667 17.5 16.6667H2.5C1.66667 16.6667 0.833333 15.8333 0.833333 15V5C0.833333 4.16667 1.66667 3.33333 2.5 3.33333Z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.1667 5L10 11.6667L0.833333 5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="email"
                placeholder="usuario@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                style={styles.input}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#319795';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(49,151,149,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputWrapper}>
              <svg style={styles.inputIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.8333 9.16667H4.16667C3.24619 9.16667 2.5 9.91286 2.5 10.8333V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V10.8333C17.5 9.91286 16.7538 9.16667 15.8333 9.16667Z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.83333 9.16667V5.83333C5.83333 4.72826 6.27232 3.66845 7.05372 2.88705C7.83512 2.10565 8.89493 1.66667 10 1.66667C11.1051 1.66667 12.1649 2.10565 12.9463 2.88705C13.7277 3.66845 14.1667 4.72826 14.1667 5.83333V9.16667" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="password"
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                style={styles.input}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#319795';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(49,151,149,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                required
              />
            </div>
          </div>

          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" style={styles.checkbox} />
              <span style={styles.checkboxText}>Recordarme</span>
            </label>
            <a href="#" style={styles.forgotLink}>¿Olvidaste tu contraseña?</a>
          </div>

          {error && (
            <div style={styles.errorContainer}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6.66667V10M10 13.3333H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z" stroke="#E53E3E" strokeWidth="1.5" strokeLinecap="round"/>
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
            onMouseEnter={(e) => {
              if (!cargando) {
                e.currentTarget.style.backgroundColor = '#267B79';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!cargando) {
                e.currentTarget.style.backgroundColor = '#319795';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {cargando ? (
              <span style={styles.loadingWrapper}>
                <span style={styles.spinner}></span>
                Ingresando...
              </span>
            ) : (
              'Ingresar al sistema'
            )}
          </button>
        </form>
      </div>
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
    background: 'linear-gradient(135deg, #F7F9FC 0%, #E2E8F0 100%)',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  blob1: {
    position: 'absolute',
    top: '-20%',
    right: '-10%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(49,151,149,0.1) 0%, rgba(10,37,64,0.05) 100%)',
    filter: 'blur(60px)',
  },
  blob2: {
    position: 'absolute',
    bottom: '-20%',
    left: '-10%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'linear-gradient(225deg, rgba(49,151,149,0.08) 0%, rgba(10,37,64,0.03) 100%)',
    filter: 'blur(50px)',
  },
  card: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: '480px',
    background: '#FFFFFF',
    borderRadius: '32px',
    padding: '48px 40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  logoPlaceholder: {
    width: '80px',
    height: '80px',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  clinicName: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0A2540',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  systemName: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
  },
  form: {
    width: '100%',
  },
  formTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: '8px',
    textAlign: 'center',
    letterSpacing: '-0.02em',
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#4A5568',
    marginBottom: '32px',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: '8px',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 12px 14px 44px',
    border: '1.5px solid #E2E8F0',
    borderRadius: '14px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backgroundColor: '#FFFFFF',
    color: '#1A202C',
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
    fontSize: '14px',
    color: '#1A202C',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#319795',
  },
  forgotLink: {
    fontSize: '14px',
    color: '#319795',
    textDecoration: 'none',
    fontWeight: '500',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#FEF2F2',
    borderRadius: '14px',
    marginBottom: '24px',
    border: '1px solid #FEE2E2',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: '13px',
    margin: 0,
    flex: 1,
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#319795',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '24px',
  },
  buttonDisabled: {
    opacity: 0.7,
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
};

// Agrega esto a tu archivo CSS global
// @keyframes spin { to { transform: rotate(360deg); } }