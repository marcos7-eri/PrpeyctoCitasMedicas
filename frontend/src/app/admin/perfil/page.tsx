'use client';

import { useEffect, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

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

  useEffect(() => { cargarPerfil(); }, []);

  const cargarPerfil = async () => {
    try {
      setCargando(true); setError('');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setError('No se pudo obtener el usuario autenticado'); return; }
      const { data, error } = await supabase.from('perfiles').select('id, nombre_completo, correo, telefono, rol, estado, creado_en, foto_url').eq('id', user.id).single();
      if (error) { setError(error.message); return; }
      const perfilData = data as PerfilItem;
      setPerfil(perfilData);
      setFormNombre(perfilData.nombre_completo || '');
      setFormCorreo(perfilData.correo || '');
      setFormTelefono(perfilData.telefono || '');
      setFotoPreview(perfilData.foto_url || '');
      localStorage.setItem('perfil', JSON.stringify(perfilData));
      window.dispatchEvent(new Event('perfil-actualizado'));
    } catch { setError('Ocurrió un error al cargar el perfil'); } finally { setCargando(false); }
  };

  const seleccionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Selecciona una imagen válida'); return; }
    setArchivoFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const subirFoto = async (): Promise<string | null> => {
    if (!perfil || !archivoFoto) return perfil?.foto_url || null;
    try {
      setSubiendoFoto(true);
      const extension = archivoFoto.name.split('.').pop() || 'png';
      const filePath = `${perfil.id}/perfil.${extension}`;
      const { error: uploadError } = await supabase.storage.from('perfiles').upload(filePath, archivoFoto, { upsert: true, contentType: archivoFoto.type });
      if (uploadError) { alert('No se pudo subir la foto: ' + uploadError.message); return null; }
      const { data } = supabase.storage.from('perfiles').getPublicUrl(filePath);
      return `${data.publicUrl}?t=${Date.now()}`;
    } catch { alert('Ocurrió un error al subir la foto'); return null; } finally { setSubiendoFoto(false); }
  };

  const guardarPerfil = async () => {
    if (!perfil) return;
    if (!formNombre.trim() || !formCorreo.trim()) { alert('Nombre y correo son obligatorios'); return; }
    try {
      setGuardando(true);
      let fotoUrlFinal = perfil.foto_url || null;
      if (archivoFoto) {
        const nuevaFotoUrl = await subirFoto();
        if (archivoFoto && !nuevaFotoUrl) { setGuardando(false); return; }
        fotoUrlFinal = nuevaFotoUrl;
      }
      await api.put(`/usuarios/${perfil.id}`, {
        nombre_completo: formNombre.trim(),
        correo: formCorreo.trim(),
        telefono: formTelefono.trim() || null,
        foto_url: fotoUrlFinal,
      });
      const perfilActualizado: PerfilItem = { ...perfil, nombre_completo: formNombre.trim(), correo: formCorreo.trim(), telefono: formTelefono.trim() || null, foto_url: fotoUrlFinal };
      setPerfil(perfilActualizado);
      setFotoPreview(fotoUrlFinal || '');
      setArchivoFoto(null);
      localStorage.setItem('perfil', JSON.stringify(perfilActualizado));
      window.dispatchEvent(new Event('perfil-actualizado'));
      alert('Perfil actualizado correctamente');
    } catch (e: any) { alert('No se pudo guardar el perfil: ' + e.message); } finally { setGuardando(false); }
  };

  const getRolTexto = (rol: string) => {
    if (rol === 'admin') return 'Administrador';
    if (rol === 'doctor') return 'Doctor';
    if (rol === 'paciente') return 'Paciente';
    return rol;
  };

  if (cargando) return <div style={styles.emptyState}>Cargando perfil...</div>;
  if (error) return <div style={{ ...styles.emptyState, color: '#F87171' }}>{error}</div>;
  if (!perfil) return <div style={styles.emptyState}>No se encontró el perfil</div>;

  return (
    <>
      <div style={styles.cardsGrid}>
        <div style={styles.card}><p style={styles.cardTitle}>Rol</p><h3 style={styles.cardValue}>{getRolTexto(perfil.rol)}</h3><p style={styles.cardSubtitle}>Tipo de usuario actual</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Estado</p><h3 style={styles.cardValue}><span style={perfil.estado === 'activo' ? styles.badgeActive : styles.badgeInactive}>{perfil.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></h3><p style={styles.cardSubtitle}>Estado de la cuenta</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Correo electrónico</p><h3 style={{ ...styles.cardValue, fontSize: '24px' }}>{perfil.correo}</h3><p style={styles.cardSubtitle}>Correo principal</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Fecha de registro</p><h3 style={styles.cardValue}>{perfil.creado_en ? new Date(perfil.creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</h3><p style={styles.cardSubtitle}>Alta en el sistema</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
        <div style={styles.card}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF', margin: '0 0 20px 0' }}>Foto de perfil</h2>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            {fotoPreview ? (
              <img src={fotoPreview} alt="Foto de perfil" style={{ width: '180px', height: '180px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #319795', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }} />
            ) : (
              <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'linear-gradient(135deg, #319795 0%, #1a5a58 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 'bold', color: '#FFFFFF' }}>
                {perfil.nombre_completo?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Seleccionar imagen</label>
            <input type="file" accept="image/*" onChange={seleccionarFoto} style={{ ...styles.input, padding: '10px' }} />
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '12px 0 0' }}>Formatos recomendados: JPG, PNG. Tamaño máximo: 5MB</p>
        </div>

        <div style={styles.card}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF', margin: '0 0 20px 0' }}>Datos del perfil</h2>
          <div style={styles.formGroup}><label style={styles.label}>Nombre completo *</label><input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} style={styles.input} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Correo electrónico *</label><input type="email" value={formCorreo} onChange={(e) => setFormCorreo(e.target.value)} style={styles.input} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Teléfono</label><input type="tel" value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)} style={styles.input} /></div>
          <div style={styles.rowTwoColumns}>
            <div style={styles.formGroup}><label style={styles.label}>Rol</label><input type="text" value={getRolTexto(perfil.rol)} disabled style={{ ...styles.input, opacity: 0.7, cursor: 'not-allowed' }} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Estado</label><input type="text" value={perfil.estado === 'activo' ? 'Activo' : 'Inactivo'} disabled style={{ ...styles.input, opacity: 0.7, cursor: 'not-allowed' }} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
            <button style={styles.btnSecondary} onClick={() => { if (perfil) { setFormNombre(perfil.nombre_completo || ''); setFormCorreo(perfil.correo || ''); setFormTelefono(perfil.telefono || ''); setArchivoFoto(null); setFotoPreview(perfil.foto_url || ''); } }}>Cancelar</button>
            <button style={styles.btnPrimary} onClick={guardarPerfil} disabled={guardando || subiendoFoto}>
              {guardando || subiendoFoto ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={styles.spinner}></span>Guardando...</span> : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', margin: '0 0 16px 0' }}>Información de la cuenta</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div><p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>ID de usuario</p><p style={{ fontSize: '13px', fontFamily: 'monospace', color: '#CBD5E1', margin: '4px 0 0' }}>{perfil.id}</p></div>
          <div><p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Última actualización</p><p style={{ fontSize: '13px', color: '#CBD5E1', margin: '4px 0 0' }}>{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
          <div><p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Permisos</p><p style={{ fontSize: '13px', color: '#CBD5E1', margin: '4px 0 0' }}>{perfil.rol === 'admin' ? 'Acceso total al sistema' : 'Acceso restringido'}</p></div>
        </div>
      </div>
    </>
  );
}
