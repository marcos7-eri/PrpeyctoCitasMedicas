import { useEffect, useState } from 'react';
import AdminLayout, { styles } from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface PerfilItem {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono?: string | null;
  rol: string;
  estado: string;
  creado_en?: string | null;
  foto_url?: string | null;
}

export default function PerfilAdmin() {
  const [perfil, setPerfil] = useState<PerfilItem | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState('');

  const [formNombre, setFormNombre] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [fotoPreview, setFotoPreview] = useState('');
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      setError('');

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('No se pudo obtener el usuario autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, correo, telefono, rol, estado, creado_en, foto_url')
        .eq('id', user.id)
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      const perfilData = data as PerfilItem;
      setPerfil(perfilData);
      setFormNombre(perfilData.nombre_completo || '');
      setFormCorreo(perfilData.correo || '');
      setFormTelefono(perfilData.telefono || '');
      setFotoPreview(perfilData.foto_url || '');
    } catch {
      setError('Ocurrió un error al cargar el perfil');
    } finally {
      setCargando(false);
    }
  };

  const seleccionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecciona una imagen válida');
      return;
    }

    setArchivoFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const subirFoto = async (): Promise<string | null> => {
  if (!perfil || !archivoFoto) return perfil?.foto_url || null;

  try {
    setSubiendoFoto(true);

    const extension = archivoFoto.name.split('.').pop() || 'png';
    const filePath = `${perfil.id}/perfil.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('perfiles')
      .upload(filePath, archivoFoto, {
        upsert: true,
        contentType: archivoFoto.type,
      });

    if (uploadError) {
      alert('No se pudo subir la foto: ' + uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('perfiles')
      .getPublicUrl(filePath);

    console.log('URL PÚBLICA FOTO:', data.publicUrl);

    return data.publicUrl;
  } catch {
    alert('Ocurrió un error al subir la foto');
    return null;
  } finally {
    setSubiendoFoto(false);
  }
};

  const guardarPerfil = async () => {
    if (!perfil) return;

    if (!formNombre.trim() || !formCorreo.trim()) {
      alert('Nombre y correo son obligatorios');
      return;
    }

    try {
      setGuardando(true);

      let fotoUrlFinal = perfil.foto_url || null;

      if (archivoFoto) {
        const nuevaFotoUrl = await subirFoto();
        if (archivoFoto && !nuevaFotoUrl) {
          setGuardando(false);
          return;
        }
        fotoUrlFinal = nuevaFotoUrl;
      }

      const { error } = await supabase
        .from('perfiles')
        .update({
          nombre_completo: formNombre.trim(),
          correo: formCorreo.trim(),
          telefono: formTelefono.trim() || null,
          foto_url: fotoUrlFinal,
        })
        .eq('id', perfil.id);

      if (error) {
        alert('No se pudo guardar el perfil: ' + error.message);
        return;
      }

      alert('Perfil actualizado correctamente');
      setArchivoFoto(null);
      await cargarPerfil();
    } catch {
      alert('Ocurrió un error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AdminLayout
      titulo="Mi perfil"
      subtitulo="Información personal del administrador"
    >
      {cargando ? (
        <section style={localStyles.estadoBox}>
          <p style={styles.emptyStateText}>Cargando perfil...</p>
        </section>
      ) : error ? (
        <section style={localStyles.estadoBox}>
          <p style={{ ...styles.emptyStateText, color: '#dc2626' }}>{error}</p>
        </section>
      ) : !perfil ? (
        <section style={localStyles.estadoBox}>
          <p style={styles.emptyStateText}>No se encontró el perfil</p>
        </section>
      ) : (
        <>
          <section style={styles.gridCards}>
            <div style={styles.card}>
              <p style={styles.cardTitulo}>Rol</p>
              <h3 style={styles.cardValor}>{perfil.rol}</h3>
              <p style={styles.cardSubtitulo}>Tipo de usuario actual</p>
            </div>

            <div style={styles.card}>
              <p style={styles.cardTitulo}>Estado</p>
              <h3 style={styles.cardValor}>{perfil.estado}</h3>
              <p style={styles.cardSubtitulo}>Estado de la cuenta</p>
            </div>

            <div style={styles.card}>
              <p style={styles.cardTitulo}>Correo</p>
              <h3 style={localStyles.cardTexto}>{perfil.correo}</h3>
              <p style={styles.cardSubtitulo}>Correo principal</p>
            </div>

            <div style={styles.card}>
              <p style={styles.cardTitulo}>Fecha registro</p>
              <h3 style={localStyles.cardTexto}>
                {perfil.creado_en
                  ? new Date(perfil.creado_en).toLocaleDateString()
                  : 'Sin fecha'}
              </h3>
              <p style={styles.cardSubtitulo}>Alta en el sistema</p>
            </div>
          </section>

          <section style={localStyles.gridPerfil}>
            <div style={localStyles.cardPerfil}>
              <h2 style={localStyles.tituloSeccion}>Foto de perfil</h2>

              <div style={localStyles.fotoBox}>
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Foto de perfil" style={localStyles.fotoPerfil} />
                ) : (
                  <div style={localStyles.fotoVacia}>Sin foto</div>
                )}
              </div>

              <div style={localStyles.formGrupo}>
                <label style={localStyles.label}>Seleccionar imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={seleccionarFoto}
                  style={localStyles.inputArchivo}
                />
              </div>

              <p style={localStyles.textoAyuda}>
                Formatos recomendados: JPG o PNG.
              </p>
            </div>

            <div style={localStyles.cardPerfil}>
              <h2 style={localStyles.tituloSeccion}>Datos del perfil</h2>

              <div style={localStyles.formGrupo}>
                <label style={localStyles.label}>Nombre completo</label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  style={localStyles.input}
                />
              </div>

              <div style={localStyles.formGrupo}>
                <label style={localStyles.label}>Correo</label>
                <input
                  type="email"
                  value={formCorreo}
                  onChange={(e) => setFormCorreo(e.target.value)}
                  style={localStyles.input}
                />
              </div>

              <div style={localStyles.formGrupo}>
                <label style={localStyles.label}>Teléfono</label>
                <input
                  type="text"
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value)}
                  style={localStyles.input}
                />
              </div>

              <div style={localStyles.formGrupo}>
                <label style={localStyles.label}>Rol</label>
                <input
                  type="text"
                  value={perfil.rol}
                  disabled
                  style={localStyles.inputDeshabilitado}
                />
              </div>

              <div style={localStyles.formGrupo}>
                <label style={localStyles.label}>Estado</label>
                <input
                  type="text"
                  value={perfil.estado}
                  disabled
                  style={localStyles.inputDeshabilitado}
                />
              </div>

              <div style={localStyles.acciones}>
                <button
                  style={styles.botonPrincipal}
                  onClick={guardarPerfil}
                  disabled={guardando || subiendoFoto}
                >
                  {guardando || subiendoFoto ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}

const localStyles: Record<string, React.CSSProperties> = {
  estadoBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '280px',
  },
  gridPerfil: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.4fr',
    gap: '20px',
  },
  cardPerfil: {
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  tituloSeccion: {
    margin: '0 0 20px',
    color: '#0A2540',
    fontSize: '22px',
    fontWeight: '700',
  },
  fotoBox: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  fotoPerfil: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #E2E8F0',
  },
  fotoVacia: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: '#F1F5F9',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    border: '2px dashed #CBD5E1',
  },
  formGrupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #CBD5E1',
    borderRadius: '14px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxSizing: 'border-box',
    outline: 'none',
  },
  inputDeshabilitado: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    fontSize: '14px',
    backgroundColor: '#F8FAFC',
    color: '#64748B',
    boxSizing: 'border-box',
    outline: 'none',
  },
  inputArchivo: {
    width: '100%',
    padding: '12px',
    border: '1px solid #CBD5E1',
    borderRadius: '14px',
    background: '#FFFFFF',
    color: '#0F172A',
    boxSizing: 'border-box',
  },
  textoAyuda: {
    margin: 0,
    color: '#64748B',
    fontSize: '13px',
  },
  acciones: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  cardTexto: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0A2540',
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
    wordBreak: 'break-word',
  },
};