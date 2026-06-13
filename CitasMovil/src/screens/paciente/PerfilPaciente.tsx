import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
  Animated, Easing, Platform, Modal, Image,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { API_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Perfil, Paciente } from '../../types';
import { formatFecha } from '../../utils/fechas';

const C = {
  bg: '#060D1A', card: '#0B1829', surface: '#0F2035',
  primary: '#2DD4BF', accent: '#6366F1',
  white: '#FFFFFF', muted: '#94A3B8', light: '#64748B',
  border: '#1E3A5F', success: '#10B981', warning: '#F59E0B', error: '#F43F5E',
};

const GENEROS = ['Masculino', 'Femenino', 'Otro'];
const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const fechaToDate = (str: string): Date => {
  if (!str) return new Date(2000, 0, 1);
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const dateToFecha = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function PerfilPaciente() {
  const { user, signOut } = useAuth();
  const [perfil,    setPerfil]    = useState<Perfil | null>(null);
  const [paciente,  setPaciente]  = useState<Paciente | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [editando,  setEditando]  = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [focus,     setFocus]     = useState<string | null>(null);

  // Date picker
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [tempDate,          setTempDate]          = useState(new Date(2000, 0, 1));

  // Foto
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Campos editables
  const [nombreEdit,      setNombreEdit]      = useState('');
  const [telEdit,         setTelEdit]         = useState('');
  const [fechaNacEdit,    setFechaNacEdit]    = useState('');
  const [generoEdit,      setGeneroEdit]      = useState('');
  const [tipoSangreEdit,  setTipoSangreEdit]  = useState('');
  const [direccionEdit,   setDireccionEdit]   = useState('');
  const [contactoNomEdit, setContactoNomEdit] = useState('');
  const [contactoTelEdit, setContactoTelEdit] = useState('');

  // Animations
  const heroOp    = useRef(new Animated.Value(0)).current;
  const heroSc    = useRef(new Animated.Value(0.88)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const bodyOp    = useRef(new Animated.Value(0)).current;
  const bodyY     = useRef(new Animated.Value(28)).current;
  const editOp    = useRef(new Animated.Value(0)).current;
  const editY     = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(ringPulse, { toValue: 1.07, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(ringPulse, { toValue: 1,    duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  const runEntrance = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(heroSc, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
        Animated.timing(heroOp, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(bodyY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(bodyOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const cargar = useCallback(async () => {
    if (!user) return;
    const [perfilRes, pacienteRes] = await Promise.all([
      supabase.from('perfiles').select('*').eq('id', user.id).single(),
      supabase.from('pacientes').select('*').eq('perfil_id', user.id).maybeSingle(),
    ]);
    if (perfilRes.data) {
      setPerfil(perfilRes.data);
      setNombreEdit(perfilRes.data.nombre_completo ?? '');
      setTelEdit(perfilRes.data.telefono ?? '');
    }
    if (pacienteRes.data) {
      setPaciente(pacienteRes.data);
      setFechaNacEdit(pacienteRes.data.fecha_nacimiento ?? '');
      setGeneroEdit(pacienteRes.data.genero ?? '');
      setTipoSangreEdit(pacienteRes.data.tipo_sangre ?? '');
      setDireccionEdit(pacienteRes.data.direccion ?? '');
      setContactoNomEdit(pacienteRes.data.contacto_emergencia_nombre ?? '');
      setContactoTelEdit(pacienteRes.data.contacto_emergencia_telefono ?? '');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { cargar().then(runEntrance); }, [cargar]);

  const onRefresh = async () => { setRefreshing(true); await cargar(); setRefreshing(false); };

  const abrirEdicion = () => {
    setEditando(true);
    editOp.setValue(0); editY.setValue(-16);
    Animated.parallel([
      Animated.spring(editY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(editOp, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const abrirDatePicker = () => {
    setTempDate(fechaToDate(fechaNacEdit));
    setMostrarDatePicker(true);
  };

  const subirFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Activa el acceso a la galería en Configuración.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) { Alert.alert('Error', 'No se pudo procesar la imagen.'); return; }

    setSubiendoFoto(true);

    try {
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const storagePath = `${user!.id}/avatar.${ext}`;

      // Convertir base64 a binario (Uint8Array) — evita fetch de URI local
      const binary = atob(asset.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const { error: uploadError } = await supabase.storage
        .from('perfiles')
        .upload(storagePath, bytes, { contentType: mimeType, upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from('perfiles').getPublicUrl(storagePath);
      const fotoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const res = await fetch(`${API_URL}/usuarios/${user!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_url: fotoUrl }),
      });

      if (!res.ok) throw new Error('No se pudo guardar la foto en el perfil.');

      setPerfil(p => p ? { ...p, foto_url: fotoUrl } : p);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo subir la foto.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setMostrarDatePicker(false);
      if (event.type === 'set' && date) setFechaNacEdit(dateToFecha(date));
    } else {
      if (date) setTempDate(date);
    }
  };

  const confirmarFechaiOS = () => {
    setFechaNacEdit(dateToFecha(tempDate));
    setMostrarDatePicker(false);
  };

  const guardarCambios = async () => {
    if (!nombreEdit.trim()) { Alert.alert('Campo requerido', 'El nombre no puede estar vacío.'); return; }
    if (!paciente?.id) { Alert.alert('Error', 'No se encontró el perfil de paciente.'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGuardando(true);

    try {
      const [perfilRes, pacienteRes] = await Promise.all([
        fetch(`${API_URL}/usuarios/${user!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre_completo: nombreEdit.trim(), telefono: telEdit.trim() }),
        }),
        fetch(`${API_URL}/pacientes/${paciente.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fecha_nacimiento:             fechaNacEdit || null,
            genero:                       generoEdit || null,
            tipo_sangre:                  tipoSangreEdit || null,
            direccion:                    direccionEdit.trim() || null,
            contacto_emergencia_nombre:   contactoNomEdit.trim() || null,
            contacto_emergencia_telefono: contactoTelEdit.trim() || null,
          }),
        }),
      ]);

      if (!perfilRes.ok || !pacienteRes.ok) {
        Alert.alert('Error', 'No se pudieron guardar los cambios.'); return;
      }

      setPerfil(p => p ? { ...p, nombre_completo: nombreEdit.trim(), telefono: telEdit.trim() } : p);
      setPaciente(p => p ? {
        ...p,
        fecha_nacimiento:             fechaNacEdit || undefined,
        genero:                       generoEdit || undefined,
        tipo_sangre:                  tipoSangreEdit || undefined,
        direccion:                    direccionEdit.trim() || undefined,
        contacto_emergencia_nombre:   contactoNomEdit.trim() || undefined,
        contacto_emergencia_telefono: contactoTelEdit.trim() || undefined,
      } : p);

      setEditando(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const cerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Cerrar sesión de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
    ]);
  };

  const cancelarEdicion = () => {
    setNombreEdit(perfil?.nombre_completo ?? '');
    setTelEdit(perfil?.telefono ?? '');
    setFechaNacEdit(paciente?.fecha_nacimiento ?? '');
    setGeneroEdit(paciente?.genero ?? '');
    setTipoSangreEdit(paciente?.tipo_sangre ?? '');
    setDireccionEdit(paciente?.direccion ?? '');
    setContactoNomEdit(paciente?.contacto_emergencia_nombre ?? '');
    setContactoTelEdit(paciente?.contacto_emergencia_telefono ?? '');
    setEditando(false);
  };

  const iniciales = perfil?.nombre_completo?.split(' ').slice(0,2).map(p => p[0].toUpperCase()).join('') ?? '?';

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* HERO */}
        <Animated.View style={[s.hero, { opacity: heroOp, transform: [{ scale: heroSc }] }]}>
          <View style={s.heroDeco1} />
          <View style={s.heroDeco2} />
          <View style={s.heroDeco3} />

          <Animated.View style={[s.avatarOuter, { transform: [{ scale: ringPulse }] }]}>
            <TouchableOpacity style={s.avatarInner} onPress={subirFoto} activeOpacity={0.85} disabled={subiendoFoto}>
              {subiendoFoto ? (
                <ActivityIndicator color={C.primary} size="small" />
              ) : perfil?.foto_url ? (
                <Image source={{ uri: perfil.foto_url }} style={s.avatarImg} />
              ) : (
                <Text style={s.avatarTxt}>{iniciales}</Text>
              )}
            </TouchableOpacity>
            {!subiendoFoto && (
              <View style={s.camBadge}>
                <Ionicons name="camera" size={12} color="#FFF" />
              </View>
            )}
          </Animated.View>

          <Text style={s.heroNombre}>{perfil?.nombre_completo ?? '—'}</Text>
          <View style={s.heroBadge}>
            <Ionicons name="shield-checkmark-outline" size={12} color={C.primary} />
            <Text style={s.heroBadgeTxt}>Paciente verificado</Text>
          </View>
          <Text style={s.heroCorreo}>{perfil?.correo ?? ''}</Text>

          <View style={s.heroStats}>
            <StatItem value={perfil?.estado ?? 'activo'} label="Estado" highlight />
            <View style={s.statDivider} />
            <StatItem value={paciente?.tipo_sangre ?? '—'} label="Sangre" />
            <View style={s.statDivider} />
            <StatItem value={perfil?.creado_en ? new Date(perfil.creado_en).getFullYear().toString() : '—'} label="Desde" />
          </View>
        </Animated.View>

        {/* BODY */}
        <Animated.View style={[s.body, { opacity: bodyOp, transform: [{ translateY: bodyY }] }]}>

          {!editando ? (
            <TouchableOpacity style={s.editarBtn} onPress={abrirEdicion} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={17} color={C.primary} />
              <Text style={s.editarBtnTxt}>Editar información</Text>
              <Ionicons name="chevron-forward" size={16} color={C.primary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ) : (
            <Animated.View style={[s.editForm, { opacity: editOp, transform: [{ translateY: editY }] }]}>
              <View style={s.editFormHeader}>
                <Ionicons name="create-outline" size={16} color={C.primary} />
                <Text style={s.editFormTitle}>Editar perfil</Text>
                <TouchableOpacity onPress={cancelarEdicion} style={s.editCancelX}>
                  <Ionicons name="close" size={18} color={C.light} />
                </TouchableOpacity>
              </View>

              {/* Datos personales */}
              <SectionLabel label="Datos personales" />

              <FieldLabel label="Nombre completo" />
              <View style={[s.inputRow, focus === 'nombre' && s.inputFocus]}>
                <Ionicons name="person-outline" size={16} color={focus === 'nombre' ? C.primary : C.light} />
                <TextInput style={s.input} value={nombreEdit} onChangeText={setNombreEdit}
                  placeholder="Nombre completo" placeholderTextColor={C.light}
                  autoCapitalize="words" onFocus={() => setFocus('nombre')} onBlur={() => setFocus(null)} />
              </View>

              <FieldLabel label="Teléfono" />
              <View style={[s.inputRow, focus === 'tel' && s.inputFocus]}>
                <Ionicons name="call-outline" size={16} color={focus === 'tel' ? C.primary : C.light} />
                <TextInput style={s.input} value={telEdit} onChangeText={setTelEdit}
                  placeholder="Teléfono" placeholderTextColor={C.light}
                  keyboardType="phone-pad" onFocus={() => setFocus('tel')} onBlur={() => setFocus(null)} />
              </View>

              {/* DATE PICKER */}
              <FieldLabel label="Fecha de nacimiento" />
              <TouchableOpacity style={s.inputRow} onPress={abrirDatePicker} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={16} color={C.primary} />
                <Text style={[s.input, { paddingVertical: 13, color: fechaNacEdit ? C.white : C.light }]}>
                  {fechaNacEdit || 'Seleccionar fecha'}
                </Text>
                <Ionicons name="chevron-down" size={15} color={C.light} />
              </TouchableOpacity>

              {/* Android: muestra el picker directamente como diálogo */}
              {mostrarDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                />
              )}

              <FieldLabel label="Dirección" />
              <View style={[s.inputRow, focus === 'dir' && s.inputFocus]}>
                <Ionicons name="location-outline" size={16} color={focus === 'dir' ? C.primary : C.light} />
                <TextInput style={s.input} value={direccionEdit} onChangeText={setDireccionEdit}
                  placeholder="Tu dirección" placeholderTextColor={C.light}
                  onFocus={() => setFocus('dir')} onBlur={() => setFocus(null)} />
              </View>

              {/* Género */}
              <FieldLabel label="Género" />
              <View style={s.chipsRow}>
                {GENEROS.map(g => (
                  <TouchableOpacity key={g} onPress={() => setGeneroEdit(g === generoEdit ? '' : g)}
                    style={[s.chip, generoEdit === g && s.chipActive]}>
                    <Text style={[s.chipTxt, generoEdit === g && s.chipTxtActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tipo de sangre */}
              <FieldLabel label="Tipo de sangre" />
              <View style={s.chipsRow}>
                {TIPOS_SANGRE.map(t => (
                  <TouchableOpacity key={t} onPress={() => setTipoSangreEdit(t === tipoSangreEdit ? '' : t)}
                    style={[s.chip, tipoSangreEdit === t && s.chipActive]}>
                    <Text style={[s.chipTxt, tipoSangreEdit === t && s.chipTxtActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Contacto emergencia */}
              <SectionLabel label="Contacto de emergencia" />

              <FieldLabel label="Nombre del contacto" />
              <View style={[s.inputRow, focus === 'cnom' && s.inputFocus]}>
                <Ionicons name="person-outline" size={16} color={focus === 'cnom' ? C.primary : C.light} />
                <TextInput style={s.input} value={contactoNomEdit} onChangeText={setContactoNomEdit}
                  placeholder="Nombre" placeholderTextColor={C.light}
                  autoCapitalize="words" onFocus={() => setFocus('cnom')} onBlur={() => setFocus(null)} />
              </View>

              <FieldLabel label="Teléfono del contacto" />
              <View style={[s.inputRow, focus === 'ctel' && s.inputFocus]}>
                <Ionicons name="call-outline" size={16} color={focus === 'ctel' ? C.primary : C.light} />
                <TextInput style={s.input} value={contactoTelEdit} onChangeText={setContactoTelEdit}
                  placeholder="Teléfono" placeholderTextColor={C.light}
                  keyboardType="phone-pad" onFocus={() => setFocus('ctel')} onBlur={() => setFocus(null)} />
              </View>

              <TouchableOpacity style={[s.guardarBtn, guardando && { opacity: 0.6 }]}
                onPress={guardarCambios} disabled={guardando} activeOpacity={0.9}>
                {guardando
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <><Ionicons name="checkmark-circle-outline" size={17} color="#FFF" /><Text style={s.guardarBtnTxt}>Guardar cambios</Text></>
                }
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* INFORMACIÓN PERSONAL */}
          <MenuSection title="Información personal" icon="person-outline">
            <MenuItem icon="mail-outline"     label="Correo"              value={perfil?.correo ?? '—'} />
            <MenuItem icon="call-outline"     label="Teléfono"            value={perfil?.telefono ?? '—'} />
            <MenuItem icon="calendar-outline" label="Fecha de nacimiento" value={paciente?.fecha_nacimiento ? formatFecha(paciente.fecha_nacimiento) : '—'} />
            <MenuItem icon="people-outline"   label="Género"              value={paciente?.genero ?? '—'} />
            <MenuItem icon="water-outline"    label="Tipo de sangre"      value={paciente?.tipo_sangre ?? '—'} />
            <MenuItem icon="location-outline" label="Dirección"           value={paciente?.direccion ?? '—'} />
          </MenuSection>

          {/* CONTACTO EMERGENCIA */}
          <MenuSection title="Contacto de emergencia" icon="alert-circle-outline">
            <MenuItem icon="person-outline" label="Nombre"   value={paciente?.contacto_emergencia_nombre ?? '—'} />
            <MenuItem icon="call-outline"   label="Teléfono" value={paciente?.contacto_emergencia_telefono ?? '—'} />
          </MenuSection>

          {/* CUENTA */}
          <MenuSection title="Cuenta" icon="settings-outline">
            <MenuItem icon="shield-checkmark-outline" label="Estado de cuenta" value={perfil?.estado ?? 'activo'} valueColor={C.success} />
            {perfil?.creado_en && (
              <MenuItem icon="time-outline" label="Miembro desde" value={formatFecha(perfil.creado_en.split('T')[0])} />
            )}
          </MenuSection>

          {/* LOGOUT */}
          <TouchableOpacity style={s.logoutBtn} onPress={cerrarSesion} activeOpacity={0.8}>
            <View style={s.logoutIconBox}>
              <Ionicons name="log-out-outline" size={19} color={C.error} />
            </View>
            <Text style={s.logoutTxt}>Cerrar sesión</Text>
            <Ionicons name="chevron-forward" size={16} color={C.error + '66'} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* iOS: Modal con spinner */}
      {mostrarDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" statusBarTranslucent>
          <View style={s.pickerOverlay}>
            <View style={s.pickerSheet}>
              <View style={s.pickerHeader}>
                <TouchableOpacity onPress={() => setMostrarDatePicker(false)} style={s.pickerAction}>
                  <Text style={s.pickerCancel}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={s.pickerTitle}>Fecha de nacimiento</Text>
                <TouchableOpacity onPress={confirmarFechaiOS} style={s.pickerAction}>
                  <Text style={s.pickerConfirm}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                locale="es-ES"
                onChange={onDateChange}
                style={s.pickerSpinner}
                textColor={C.white}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={s.sectionLbl}>{label}</Text>;
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={s.fieldLbl}>{label}</Text>;
}

function StatItem({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <View style={s.statItem}>
      <Text style={[s.statValue, highlight && { color: C.success }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function MenuSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={s.menuSection}>
      <View style={s.menuSectionHeader}>
        <Ionicons name={icon as any} size={14} color={C.primary} />
        <Text style={s.menuSectionTitle}>{title}</Text>
      </View>
      <View style={s.menuCard}>{children}</View>
    </View>
  );
}

function MenuItem({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <View style={s.menuItem}>
      <View style={s.menuIconBox}>
        <Ionicons name={icon as any} size={15} color={C.primary} />
      </View>
      <View style={s.menuItemBody}>
        <Text style={s.menuLabel}>{label}</Text>
        <Text style={[s.menuValue, valueColor ? { color: valueColor } : {}]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 48 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  hero: {
    backgroundColor: C.card, alignItems: 'center',
    paddingTop: 40, paddingBottom: 28, overflow: 'hidden',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  heroDeco1: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: C.primary, top: -100, right: -80, opacity: 0.07 },
  heroDeco2: { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: C.accent,  bottom: -60, left: -60, opacity: 0.07 },
  heroDeco3: { position: 'absolute', width: 80,  height: 80,  borderRadius: 40,  backgroundColor: C.primary, top: 20, left: 30,     opacity: 0.05 },

  avatarOuter: { width: 108, height: 108, borderRadius: 54, backgroundColor: C.primary + '18', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: C.primary + '44', marginBottom: 16 },
  avatarInner: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.primary + '28', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.primary, overflow: 'hidden' },
  avatarImg:    { width: 84, height: 84, borderRadius: 42 },
  avatarTxt:    { color: C.primary, fontSize: 30, fontWeight: '800' },
  camBadge:     { position: 'absolute', bottom: 4, right: 4, width: 26, height: 26, borderRadius: 13, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.card },
  heroNombre:   { color: C.white, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  heroBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primary + '18', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8, borderWidth: 1, borderColor: C.primary + '33' },
  heroBadgeTxt: { color: C.primary, fontSize: 12, fontWeight: '700' },
  heroCorreo:   { color: C.muted, fontSize: 13, marginTop: 8, marginBottom: 20 },
  heroStats:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  statItem:     { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statDivider:  { width: 1, height: 36, backgroundColor: C.border },
  statValue:    { color: C.white, fontSize: 16, fontWeight: '800', marginBottom: 2 },
  statLabel:    { color: C.light, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  body: { padding: 20 },

  editarBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.primary + '0E', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24, borderWidth: 1.5, borderColor: C.primary + '44' },
  editarBtnTxt: { color: C.primary, fontSize: 15, fontWeight: '600' },

  editForm:       { backgroundColor: C.card, borderRadius: 18, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: C.border },
  editFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  editFormTitle:  { color: C.white, fontSize: 14, fontWeight: '700', flex: 1 },
  editCancelX:    { padding: 4 },

  sectionLbl: { color: C.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 18, marginBottom: 2 },
  fieldLbl:   { color: C.light, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },

  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: C.border },
  inputFocus: { borderColor: C.primary },
  input:      { flex: 1, color: C.white, fontSize: 15, paddingVertical: 12 },

  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  chipActive:   { backgroundColor: C.primary + '22', borderColor: C.primary },
  chipTxt:      { color: C.muted, fontSize: 13, fontWeight: '600' },
  chipTxtActive:{ color: C.primary },

  guardarBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, marginTop: 20 },
  guardarBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  menuSection:       { marginBottom: 20 },
  menuSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  menuSectionTitle:  { color: C.light, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  menuCard:          { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuItem:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border + '66' },
  menuIconBox:       { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primary + '16', justifyContent: 'center', alignItems: 'center' },
  menuItemBody:      { flex: 1 },
  menuLabel:         { color: C.light, fontSize: 11, marginBottom: 2, fontWeight: '500' },
  menuValue:         { color: C.white, fontSize: 14, fontWeight: '500' },

  logoutBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.error + '08', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginTop: 4, borderWidth: 1.5, borderColor: C.error + '33' },
  logoutIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.error + '16', justifyContent: 'center', alignItems: 'center' },
  logoutTxt:     { color: C.error, fontSize: 15, fontWeight: '700' },

  // Date picker iOS Modal
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  pickerSheet:   { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: C.border, paddingBottom: 32 },
  pickerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerAction:  { minWidth: 72 },
  pickerTitle:   { color: C.white, fontSize: 15, fontWeight: '700' },
  pickerCancel:  { color: C.light, fontSize: 15 },
  pickerConfirm: { color: C.primary, fontSize: 15, fontWeight: '700', textAlign: 'right' },
  pickerSpinner: { backgroundColor: C.card },
});
