import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
  Animated, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { API_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import CitaCard from '../../components/paciente/CitaCard';
import { Cita, EstadoCita } from '../../types';
import { getProximas14Dias, generarSlots, formatFecha } from '../../utils/fechas';

const { width } = Dimensions.get('window');

const C = {
  bg: '#060D1A', card: '#0B1829', surface: '#0F2035',
  primary: '#2DD4BF', accent: '#6366F1',
  white: '#FFFFFF', muted: '#94A3B8', light: '#64748B',
  border: '#1E3A5F', success: '#10B981', warning: '#F59E0B', error: '#F43F5E',
};

type Segmento = 'todas' | 'proximas' | 'pasadas';

const SEGMENTOS: { label: string; valor: Segmento }[] = [
  { label: 'Todas',    valor: 'todas'    },
  { label: 'Próximas', valor: 'proximas' },
  { label: 'Pasadas',  valor: 'pasadas'  },
];

const STATUS_CHIPS: { label: string; valor: EstadoCita; color: string }[] = [
  { label: 'Pendiente',  valor: 'pendiente',  color: C.warning },
  { label: 'Confirmada', valor: 'confirmada', color: C.success },
  { label: 'Cancelada',  valor: 'cancelada',  color: C.error   },
  { label: 'Completada', valor: 'completada', color: C.accent  },
];

// ─────────────────────────────────────────────────────────────────
// Modal: Cancelar cita (con motivo opcional)
// ─────────────────────────────────────────────────────────────────
function CancelarModal({
  cita, visible, onClose, onConfirm, loading,
}: {
  cita: Cita | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  loading: boolean;
}) {
  const [motivo, setMotivo] = useState('');
  useEffect(() => { if (!visible) setMotivo(''); }, [visible]);

  if (!cita) return null;
  const drNombre = (cita.doctores as any)?.perfiles?.nombre_completo ?? 'tu doctor';
  const hora = cita.hora_inicio?.substring(0, 5) ?? '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={s.modalCard}>
          {/* Icono + título */}
          <View style={s.modalIconWrap}>
            <Ionicons name="close-circle" size={32} color={C.error} />
          </View>
          <Text style={s.modalTitle}>Cancelar cita</Text>
          <Text style={s.modalSub}>
            {formatFecha(cita.fecha)} a las {hora} con {drNombre}
          </Text>

          <View style={s.modalDivider} />

          {/* Motivo opcional */}
          <Text style={s.modalLabel}>Motivo de cancelación <Text style={{ color: C.light }}>(opcional)</Text></Text>
          <TextInput
            style={s.modalInput}
            placeholder="¿Por qué cancelas la cita?"
            placeholderTextColor={C.light}
            value={motivo}
            onChangeText={setMotivo}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Botones */}
          <View style={s.modalBtns}>
            <TouchableOpacity style={s.modalBtnSecondary} onPress={onClose} disabled={loading}>
              <Text style={s.modalBtnSecondaryTxt}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalBtnDanger, loading && { opacity: 0.6 }]}
              onPress={() => onConfirm(motivo.trim())}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Ionicons name="close-circle-outline" size={16} color="#FFF" />
              }
              <Text style={s.modalBtnDangerTxt}>{loading ? 'Cancelando...' : 'Sí, cancelar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
// Modal: Reagendar cita (fecha + horario)
// ─────────────────────────────────────────────────────────────────
function ReagendarModal({
  cita, visible, onClose, onConfirm, loading,
}: {
  cita: Cita | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (nueva_fecha: string, nueva_hora: string, duracion: number) => void;
  loading: boolean;
}) {
  const dias = getProximas14Dias();
  const [fechaObj, setFechaObj]     = useState<{ fecha: string; label: string; dayOfWeek: number } | null>(null);
  const [slots, setSlots]           = useState<string[]>([]);
  const [horaSelec, setHoraSelec]   = useState('');
  const [duracion, setDuracion]     = useState(30);
  const [loadSlots, setLoadSlots]   = useState(false);

  // Limpiar al cerrar
  useEffect(() => {
    if (!visible) { setFechaObj(null); setSlots([]); setHoraSelec(''); }
  }, [visible]);

  // Cargar slots cuando se elige fecha
  useEffect(() => {
    if (!cita || !fechaObj) return;
    setLoadSlots(true); setSlots([]); setHoraSelec('');
    (async () => {
      const { data: horarios } = await supabase
        .from('horarios').select('*')
        .eq('doctor_id', cita.doctor_id)
        .eq('dia_semana', fechaObj.dayOfWeek)
        .eq('activo', true);

      if (!horarios?.length) { setSlots([]); setLoadSlots(false); return; }
      const h = horarios[0] as any;
      setDuracion(h.duracion_cita ?? 30);
      const all = generarSlots(h.hora_inicio, h.hora_fin, h.duracion_cita);

      const { data: ocupadas } = await supabase
        .from('citas').select('hora_inicio')
        .eq('doctor_id', cita.doctor_id)
        .eq('fecha', fechaObj.fecha)
        .in('estado', ['pendiente', 'confirmada'])
        .neq('id', cita.id);

      const busy = new Set((ocupadas ?? []).map((c: any) => c.hora_inicio.substring(0, 5)));
      setSlots(all.filter(sl => !busy.has(sl)));
      setLoadSlots(false);
    })();
  }, [cita, fechaObj]);

  if (!cita) return null;
  const drNombre = (cita.doctores as any)?.perfiles?.nombre_completo ?? 'tu doctor';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={s.reagendarCard}>
        {/* Encabezado */}
        <View style={s.reagendarHeader}>
          <View>
            <Text style={s.modalTitle}>Reagendar cita</Text>
            <Text style={s.modalSub}>{drNombre}</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={C.muted} />
          </TouchableOpacity>
        </View>

        <View style={s.modalDivider} />

        {/* Selección de fecha */}
        <Text style={s.sectionLabel}>Elige la nueva fecha</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={dias}
          keyExtractor={d => d.fecha}
          contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingHorizontal: 2 }}
          renderItem={({ item: d }) => {
            const active = fechaObj?.fecha === d.fecha;
            const dateObj = new Date(d.fecha + 'T00:00:00');
            const dayNum  = d.fecha.substring(8);
            const month   = dateObj.toLocaleString('es-ES', { month: 'short' });
            return (
              <TouchableOpacity
                style={[s.dateCard, active && s.dateCardActive]}
                onPress={() => { Haptics.selectionAsync(); setFechaObj(d); }}
                activeOpacity={0.8}
              >
                <Text style={[s.dateDow, active && { color: C.primary }]}>{d.label.substring(0, 3)}</Text>
                <Text style={[s.dateDay, active && { color: C.primary }]}>{dayNum}</Text>
                <Text style={[s.dateMon, active && { color: C.primary + 'AA' }]}>{month}</Text>
                {active && <View style={s.activeDot} />}
              </TouchableOpacity>
            );
          }}
        />

        {/* Slots */}
        {fechaObj && (
          <>
            <Text style={[s.sectionLabel, { marginTop: 14 }]}>Horarios disponibles</Text>
            {loadSlots ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator color={C.primary} />
              </View>
            ) : slots.length === 0 ? (
              <View style={s.noSlotsBox}>
                <Ionicons name="time-outline" size={22} color={C.light} />
                <Text style={s.noSlotsTxt}>Sin horarios disponibles este día</Text>
              </View>
            ) : (
              <View style={s.slotsGrid}>
                {slots.map(sl => {
                  const active = horaSelec === sl;
                  return (
                    <TouchableOpacity
                      key={sl}
                      style={[s.slotCard, active && s.slotCardActive]}
                      onPress={() => { Haptics.selectionAsync(); setHoraSelec(sl); }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="time-outline" size={13} color={active ? '#FFF' : C.light} />
                      <Text style={[s.slotTxt, active && { color: '#FFF', fontWeight: '700' }]}>{sl}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Botón confirmar */}
        <View style={s.modalBtns}>
          <TouchableOpacity style={s.modalBtnSecondary} onPress={onClose} disabled={loading}>
            <Text style={s.modalBtnSecondaryTxt}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modalBtnPrimary, (!fechaObj || !horaSelec || loading) && { opacity: 0.4 }]}
            onPress={() => { if (fechaObj && horaSelec) onConfirm(fechaObj.fecha, horaSelec, duracion); }}
            disabled={!fechaObj || !horaSelec || loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
            }
            <Text style={s.modalBtnPrimaryTxt}>{loading ? 'Guardando...' : 'Confirmar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
// AnimatedItem
// ─────────────────────────────────────────────────────────────────
function AnimatedItem({
  cita, onCancelar, onReagendar, index,
}: {
  cita: Cita;
  onCancelar: (c: Cita) => void;
  onReagendar: (c: Cita) => void;
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 80, friction: 12,
      delay: Math.min(index * 55, 280), useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
        { scale:      anim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
      ],
    }}>
      <CitaCard cita={cita} onCancelar={onCancelar} onReagendar={onReagendar} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Screen principal
// ─────────────────────────────────────────────────────────────────
export default function MisCitasPaciente() {
  const { user }   = useAuth();
  const navigation = useNavigation<any>();

  const [citas,      setCitas]      = useState<Cita[]>([]);
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [segmento,   setSegmento]   = useState<Segmento>('todas');
  const [statusFilt, setStatusFilt] = useState<EstadoCita | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modales
  const [citaCancelando,  setCitaCancelando]  = useState<Cita | null>(null);
  const [citaReagendando, setCitaReagendando] = useState<Cita | null>(null);
  const [accionLoading,   setAccionLoading]   = useState(false);

  const SEG_W    = (width - 40 - 6) / 3;
  const segSlide = useRef(new Animated.Value(0)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('pacientes').select('id').eq('perfil_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setPacienteId(data.id); });
  }, [user]);

  const changeSegmento = (val: Segmento, idx: number) => {
    Haptics.selectionAsync();
    setSegmento(val);
    setStatusFilt(null);
    Animated.spring(segSlide, { toValue: idx * SEG_W, tension: 100, friction: 14, useNativeDriver: true }).start();
  };

  const cargar = useCallback(async () => {
    if (!user || !pacienteId) return;
    const { data, error } = await supabase
      .from('citas')
      .select(`
        id, paciente_id, doctor_id, fecha, hora_inicio, hora_fin,
        estado, motivo, notas, motivo_cancelacion, creado_en,
        doctores(id, perfiles(nombre_completo), especialidades(nombre))
      `)
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });
    if (!error && data) setCitas(data as any);
    setLoading(false);
  }, [user, pacienteId]);

  useEffect(() => { cargar(); }, [cargar]);
  const onRefresh = async () => { setRefreshing(true); await cargar(); setRefreshing(false); };

  // ── Cancelar ──
  const confirmarCancelacion = async (motivo: string) => {
    if (!citaCancelando) return;
    setAccionLoading(true);
    try {
      const res = await fetch(`${API_URL}/citas/${citaCancelando.id}/cancelar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo_cancelacion: motivo || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'No se pudo cancelar');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setCitaCancelando(null);
      await cargar();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo cancelar la cita.');
    } finally {
      setAccionLoading(false);
    }
  };

  // ── Reagendar ──
  const confirmarReagendado = async (nueva_fecha: string, nueva_hora: string, duracion: number) => {
    if (!citaReagendando) return;
    setAccionLoading(true);
    try {
      const res = await fetch(`${API_URL}/citas/${citaReagendando.id}/reagendar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nueva_fecha, nueva_hora_inicio: nueva_hora, duracion_cita: duracion }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'No se pudo reagendar');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCitaReagendando(null);
      await cargar();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo reagendar la cita.');
    } finally {
      setAccionLoading(false);
    }
  };

  const hoy = new Date().toISOString().split('T')[0];
  let citasFiltradas = citas;
  if (segmento === 'proximas') citasFiltradas = citas.filter(c => c.fecha >= hoy);
  if (segmento === 'pasadas')  citasFiltradas = citas.filter(c => c.fecha < hoy);
  if (statusFilt) citasFiltradas = citasFiltradas.filter(c => c.estado === statusFilt);

  const chipsVisibles = segmento === 'proximas'
    ? STATUS_CHIPS.filter(c => ['pendiente','confirmada'].includes(c.valor))
    : segmento === 'pasadas'
      ? STATUS_CHIPS.filter(c => ['cancelada','completada'].includes(c.valor))
      : STATUS_CHIPS;

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* ── HEADER ── */}
      <Animated.View style={[s.header, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
        <View>
          <Text style={s.headerTitle}>Mis Citas</Text>
          <Text style={s.headerSub}>{citas.length} registradas · {citasFiltradas.length} mostrando</Text>
        </View>
        <TouchableOpacity
          style={s.nuevaBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Reservar'); }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={s.nuevaBtnTxt}>Nueva</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── SEGMENTED CONTROL ── */}
      <Animated.View style={[s.segWrap, { opacity: headerOp }]}>
        <View style={s.segTrack}>
          <Animated.View style={[s.segPill, { width: SEG_W, transform: [{ translateX: segSlide }] }]} />
          {SEGMENTOS.map((sg, i) => (
            <TouchableOpacity
              key={sg.valor}
              style={[s.segBtn, { width: SEG_W }]}
              onPress={() => changeSegmento(sg.valor, i)}
              activeOpacity={0.8}
            >
              <Text style={[s.segTxt, segmento === sg.valor && s.segTxtActive]}>{sg.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* ── STATUS CHIPS ── */}
      <Animated.View style={[s.chipsRow, { opacity: headerOp }]}>
        <TouchableOpacity
          style={[s.chip, !statusFilt && { borderColor: C.primary, backgroundColor: C.primary + '18' }]}
          onPress={() => { Haptics.selectionAsync(); setStatusFilt(null); }}
        >
          <Text style={[s.chipTxt, !statusFilt && { color: C.primary }]}>Todos</Text>
        </TouchableOpacity>
        {chipsVisibles.map(ch => (
          <TouchableOpacity
            key={ch.valor}
            style={[s.chip, statusFilt === ch.valor && { borderColor: ch.color, backgroundColor: ch.color + '18' }]}
            onPress={() => { Haptics.selectionAsync(); setStatusFilt(statusFilt === ch.valor ? null : ch.valor); }}
          >
            <View style={[s.chipDot, { backgroundColor: ch.color }]} />
            <Text style={[s.chipTxt, statusFilt === ch.valor && { color: ch.color }]}>{ch.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ── LIST ── */}
      <FlatList
        data={citasFiltradas}
        keyExtractor={c => String(c.id)}
        contentContainerStyle={s.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={44} color={C.light} />
            </View>
            <Text style={s.emptyTitle}>
              {segmento === 'proximas' ? 'Sin citas próximas' : segmento === 'pasadas' ? 'Sin citas pasadas' : 'Sin citas aún'}
            </Text>
            <Text style={s.emptySub}>
              {segmento === 'todas' ? 'Reserva tu primera cita médica' : 'Cambia el filtro para ver otras'}
            </Text>
            {segmento !== 'pasadas' && (
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Reservar')}>
                <Ionicons name="add-circle-outline" size={17} color="#FFF" />
                <Text style={s.emptyBtnTxt}>Reservar cita</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedItem
            cita={item}
            onCancelar={c => setCitaCancelando(c)}
            onReagendar={c => setCitaReagendando(c)}
            index={index}
          />
        )}
      />

      {/* ── MODALES ── */}
      <CancelarModal
        cita={citaCancelando}
        visible={!!citaCancelando}
        onClose={() => setCitaCancelando(null)}
        onConfirm={confirmarCancelacion}
        loading={accionLoading}
      />
      <ReagendarModal
        cita={citaReagendando}
        visible={!!citaReagendando}
        onClose={() => setCitaReagendando(null)}
        onConfirm={confirmarReagendado}
        loading={accionLoading}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.white, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerSub:   { color: C.light, fontSize: 12, marginTop: 3 },
  nuevaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  nuevaBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  segWrap:  { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.bg },
  segTrack: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderRadius: 14, padding: 3, borderWidth: 1, borderColor: C.border, position: 'relative',
  },
  segPill: {
    position: 'absolute', top: 3, left: 3, bottom: 3,
    backgroundColor: C.primary, borderRadius: 11,
  },
  segBtn:       { paddingVertical: 9, alignItems: 'center', borderRadius: 11, zIndex: 1 },
  segTxt:       { color: C.light, fontSize: 13, fontWeight: '600' },
  segTxtActive: { color: C.bg,    fontWeight: '800' },

  chipsRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20,
    paddingBottom: 12, flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipTxt: { color: C.muted, fontSize: 12, fontWeight: '600' },

  lista: { padding: 16, paddingBottom: 32 },

  empty:       { alignItems: 'center', paddingTop: 64, gap: 12 },
  emptyIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: C.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, marginBottom: 4,
  },
  emptyTitle: { color: C.white, fontSize: 17, fontWeight: '600' },
  emptySub:   { color: C.muted, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 14,
    paddingHorizontal: 22, paddingVertical: 13, marginTop: 6,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  emptyBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  /* ── Modales ── */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderWidth: 1, borderColor: C.border,
  },
  modalIconWrap: { alignItems: 'center', marginBottom: 8 },
  modalTitle:    { color: C.white, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  modalSub:      { color: C.muted, fontSize: 13, textAlign: 'center', marginBottom: 4 },
  modalDivider:  { height: 1, backgroundColor: C.border, marginVertical: 16 },
  modalLabel:    { color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  modalInput: {
    backgroundColor: C.surface, borderRadius: 12, padding: 12,
    color: C.white, fontSize: 14, borderWidth: 1, borderColor: C.border,
    minHeight: 80, marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtnSecondary: {
    flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  modalBtnSecondaryTxt: { color: C.muted, fontSize: 14, fontWeight: '600' },
  modalBtnDanger: {
    flex: 2, paddingVertical: 13, borderRadius: 14,
    backgroundColor: C.error, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  modalBtnDangerTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  modalBtnPrimary: {
    flex: 2, paddingVertical: 13, borderRadius: 14,
    backgroundColor: C.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  modalBtnPrimaryTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  /* ── Reagendar ── */
  reagendarCard: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 32, borderWidth: 1, borderColor: C.border,
    maxHeight: '85%',
  },
  reagendarHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  sectionLabel: { color: C.light, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  dateCard: {
    width: 60, paddingVertical: 12, backgroundColor: C.surface,
    borderRadius: 14, alignItems: 'center', gap: 2,
    borderWidth: 1.5, borderColor: C.border, position: 'relative',
  },
  dateCardActive: { borderColor: C.primary, backgroundColor: C.primary + '14' },
  dateDow: { color: C.light,  fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dateDay: { color: C.white,  fontSize: 20, fontWeight: '800' },
  dateMon: { color: C.light,  fontSize: 9,  textTransform: 'uppercase' },
  activeDot: {
    position: 'absolute', bottom: 5,
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.primary,
  },

  noSlotsBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 8,
  },
  noSlotsTxt: { color: C.light, fontSize: 13 },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  slotCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    width: (width - 48 - 24) / 4,
    backgroundColor: C.surface, borderRadius: 10, paddingVertical: 11,
    borderWidth: 1.5, borderColor: C.border,
  },
  slotCardActive: { backgroundColor: C.primary, borderColor: C.primary },
  slotTxt:        { color: C.muted, fontSize: 12, fontWeight: '600' },
});
