import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
  Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Perfil, Paciente } from '../../types';
import { formatFecha } from '../../utils/fechas';

const C = {
  bg: '#060D1A', card: '#0B1829', surface: '#0F2035',
  primary: '#2DD4BF', accent: '#6366F1',
  white: '#FFFFFF', muted: '#94A3B8', light: '#64748B',
  border: '#1E3A5F', success: '#10B981', warning: '#F59E0B', error: '#F43F5E',
};

export default function PerfilPaciente() {
  const { user, signOut } = useAuth();
  const [perfil,    setPerfil]    = useState<Perfil | null>(null);
  const [paciente,  setPaciente]  = useState<Paciente | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [editando,  setEditando]  = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombreEdit,setNombreEdit]= useState('');
  const [telEdit,   setTelEdit]   = useState('');
  const [focus,     setFocus]     = useState<string | null>(null);

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
    if (pacienteRes.data) setPaciente(pacienteRes.data);
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

  const guardarCambios = async () => {
    if (!nombreEdit.trim()) { Alert.alert('Campo requerido', 'El nombre no puede estar vacío.'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGuardando(true);
    const { error } = await supabase.from('perfiles')
      .update({ nombre_completo: nombreEdit.trim(), telefono: telEdit.trim() })
      .eq('id', user!.id);
    setGuardando(false);
    if (error) { Alert.alert('Error', 'No se pudieron guardar los cambios.'); return; }
    setPerfil(p => p ? { ...p, nombre_completo: nombreEdit.trim(), telefono: telEdit.trim() } : p);
    setEditando(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const cerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Cerrar sesión de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
    ]);
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
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      {/* ── HERO ── */}
      <Animated.View style={[s.hero, { opacity: heroOp, transform: [{ scale: heroSc }] }]}>
        <View style={s.heroDeco1} />
        <View style={s.heroDeco2} />
        <View style={s.heroDeco3} />

        {/* Avatar */}
        <Animated.View style={[s.avatarOuter, { transform: [{ scale: ringPulse }] }]}>
          <View style={s.avatarInner}>
            <Text style={s.avatarTxt}>{iniciales}</Text>
          </View>
        </Animated.View>

        <Text style={s.heroNombre}>{perfil?.nombre_completo ?? '—'}</Text>
        <View style={s.heroBadge}>
          <Ionicons name="shield-checkmark-outline" size={12} color={C.primary} />
          <Text style={s.heroBadgeTxt}>Paciente verificado</Text>
        </View>
        <Text style={s.heroCorreo}>{perfil?.correo ?? ''}</Text>

        {/* Stats */}
        <View style={s.heroStats}>
          <StatItem value={String(0)} label="Citas" />
          <View style={s.statDivider} />
          <StatItem value={perfil?.estado ?? 'activo'} label="Estado" highlight />
          <View style={s.statDivider} />
          <StatItem
            value={perfil?.creado_en ? new Date(perfil.creado_en).getFullYear().toString() : '—'}
            label="Desde"
          />
        </View>
      </Animated.View>

      {/* ── BODY ── */}
      <Animated.View style={[s.body, { opacity: bodyOp, transform: [{ translateY: bodyY }] }]}>

        {/* Edit / Save Form */}
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
              <TouchableOpacity
                onPress={() => { setNombreEdit(perfil?.nombre_completo ?? ''); setTelEdit(perfil?.telefono ?? ''); setEditando(false); }}
                style={s.editCancelX}
              >
                <Ionicons name="close" size={18} color={C.light} />
              </TouchableOpacity>
            </View>

            <Text style={s.fieldLbl}>Nombre completo</Text>
            <View style={[s.inputRow, focus === 'nombre' && { borderColor: C.primary }]}>
              <Ionicons name="person-outline" size={16} color={focus === 'nombre' ? C.primary : C.light} />
              <TextInput
                style={s.input}
                value={nombreEdit} onChangeText={setNombreEdit}
                placeholder="Nombre completo" placeholderTextColor={C.light}
                autoCapitalize="words"
                onFocus={() => setFocus('nombre')} onBlur={() => setFocus(null)}
              />
            </View>

            <Text style={s.fieldLbl}>Teléfono</Text>
            <View style={[s.inputRow, focus === 'tel' && { borderColor: C.primary }]}>
              <Ionicons name="call-outline" size={16} color={focus === 'tel' ? C.primary : C.light} />
              <TextInput
                style={s.input}
                value={telEdit} onChangeText={setTelEdit}
                placeholder="Teléfono" placeholderTextColor={C.light}
                keyboardType="phone-pad"
                onFocus={() => setFocus('tel')} onBlur={() => setFocus(null)}
              />
            </View>

            <TouchableOpacity
              style={[s.guardarBtn, guardando && { opacity: 0.6 }]}
              onPress={guardarCambios} disabled={guardando} activeOpacity={0.9}
            >
              {guardando
                ? <ActivityIndicator color="#FFF" size="small" />
                : <><Ionicons name="checkmark-circle-outline" size={17} color="#FFF" /><Text style={s.guardarBtnTxt}>Guardar cambios</Text></>
              }
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── MENU: INFORMACIÓN PERSONAL ── */}
        <MenuSection title="Información personal" icon="person-outline">
          <MenuItem icon="mail-outline"     label="Correo"             value={perfil?.correo ?? '—'} />
          <MenuItem icon="call-outline"     label="Teléfono"           value={perfil?.telefono ?? '—'} />
          {paciente?.fecha_nacimiento && (
            <MenuItem icon="calendar-outline" label="Fecha de nacimiento" value={formatFecha(paciente.fecha_nacimiento)} />
          )}
          {paciente?.genero && (
            <MenuItem icon="people-outline"   label="Género"             value={paciente.genero} />
          )}
          {paciente?.tipo_sangre && (
            <MenuItem icon="water-outline"    label="Tipo de sangre"     value={paciente.tipo_sangre} />
          )}
          {paciente?.direccion && (
            <MenuItem icon="location-outline" label="Dirección"          value={paciente.direccion} />
          )}
        </MenuSection>

        {/* ── MENU: CONTACTO EMERGENCIA ── */}
        {(paciente?.contacto_emergencia_nombre || paciente?.contacto_emergencia_telefono) && (
          <MenuSection title="Contacto de emergencia" icon="alert-circle-outline">
            {paciente.contacto_emergencia_nombre && (
              <MenuItem icon="person-outline" label="Nombre"   value={paciente.contacto_emergencia_nombre} />
            )}
            {paciente.contacto_emergencia_telefono && (
              <MenuItem icon="call-outline"   label="Teléfono" value={paciente.contacto_emergencia_telefono} />
            )}
          </MenuSection>
        )}

        {/* ── MENU: CUENTA ── */}
        <MenuSection title="Cuenta" icon="settings-outline">
          <MenuItem
            icon="shield-checkmark-outline"
            label="Estado de cuenta"
            value={perfil?.estado ?? 'activo'}
            valueColor={C.success}
          />
          {perfil?.creado_en && (
            <MenuItem icon="time-outline" label="Miembro desde" value={formatFecha(perfil.creado_en.split('T')[0])} />
          )}
        </MenuSection>

        {/* ── LOGOUT ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={cerrarSesion} activeOpacity={0.8}>
          <View style={s.logoutIconBox}>
            <Ionicons name="log-out-outline" size={19} color={C.error} />
          </View>
          <Text style={s.logoutTxt}>Cerrar sesión</Text>
          <Ionicons name="chevron-forward" size={16} color={C.error + '66'} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
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

function MenuItem({ icon, label, value, valueColor }: {
  icon: string; label: string; value: string; valueColor?: string;
}) {
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

  /* Hero */
  hero: {
    backgroundColor: C.card, alignItems: 'center',
    paddingTop: 40, paddingBottom: 28, overflow: 'hidden',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  heroDeco1: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: C.primary, top: -100, right: -80, opacity: 0.07,
  },
  heroDeco2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: C.accent, bottom: -60, left: -60, opacity: 0.07,
  },
  heroDeco3: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.primary, top: 20, left: 30, opacity: 0.05,
  },
  avatarOuter: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: C.primary + '18', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: C.primary + '44', marginBottom: 16,
  },
  avatarInner: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: C.primary + '28', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.primary,
  },
  avatarTxt:    { color: C.primary, fontSize: 30, fontWeight: '800' },
  heroNombre:   { color: C.white, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.primary + '18', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 8,
    borderWidth: 1, borderColor: C.primary + '33',
  },
  heroBadgeTxt: { color: C.primary, fontSize: 12, fontWeight: '700' },
  heroCorreo:   { color: C.muted, fontSize: 13, marginTop: 8, marginBottom: 20 },
  heroStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  statItem:    { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: C.border },
  statValue:   { color: C.white, fontSize: 16, fontWeight: '800', marginBottom: 2 },
  statLabel:   { color: C.light, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  body: { padding: 20 },

  /* Edit button */
  editarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.primary + '0E', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24,
    borderWidth: 1.5, borderColor: C.primary + '44',
  },
  editarBtnTxt: { color: C.primary, fontSize: 15, fontWeight: '600' },

  /* Edit form */
  editForm: {
    backgroundColor: C.card, borderRadius: 18, padding: 18,
    marginBottom: 24, borderWidth: 1, borderColor: C.border,
  },
  editFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  editFormTitle:  { color: C.white, fontSize: 14, fontWeight: '700', flex: 1 },
  editCancelX:    { padding: 4 },
  fieldLbl: {
    color: C.light, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.6, marginTop: 14, marginBottom: 8, textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  input: { flex: 1, color: C.white, fontSize: 15, paddingVertical: 13 },
  guardarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, marginTop: 18,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  guardarBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  /* Menu sections */
  menuSection: { marginBottom: 20 },
  menuSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  menuSectionTitle:  { color: C.light, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  menuCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: C.border + '66',
  },
  menuIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.primary + '16', justifyContent: 'center', alignItems: 'center',
  },
  menuItemBody: { flex: 1 },
  menuLabel:    { color: C.light, fontSize: 11, marginBottom: 2, fontWeight: '500' },
  menuValue:    { color: C.white, fontSize: 14, fontWeight: '500' },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.error + '08', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14, marginTop: 4,
    borderWidth: 1.5, borderColor: C.error + '33',
  },
  logoutIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.error + '16', justifyContent: 'center', alignItems: 'center',
  },
  logoutTxt: { color: C.error, fontSize: 15, fontWeight: '700' },
});
