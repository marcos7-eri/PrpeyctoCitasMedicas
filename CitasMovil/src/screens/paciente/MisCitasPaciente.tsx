import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
  Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import CitaCard from '../../components/paciente/CitaCard';
import { Cita, EstadoCita } from '../../types';

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

function AnimatedItem({ cita, onCancelar, index }: { cita: Cita; onCancelar: (c: Cita) => void; index: number }) {
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
      <CitaCard cita={cita} onCancelar={onCancelar} />
    </Animated.View>
  );
}

export default function MisCitasPaciente() {
  const { user }   = useAuth();
  const navigation = useNavigation<any>();

  const [citas,      setCitas]      = useState<Cita[]>([]);
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [segmento,   setSegmento]   = useState<Segmento>('todas');
  const [statusFilt, setStatusFilt] = useState<EstadoCita | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sliding pill indicator
  const SEG_W     = (width - 40 - 6) / 3;
  const segSlide  = useRef(new Animated.Value(0)).current;
  const headerOp  = useRef(new Animated.Value(0)).current;
  const headerY   = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  // Obtener el pacientes.id real (distinto de auth.users.id)
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

  const cancelarCita = (cita: Cita) => {
    Alert.alert('Cancelar cita', `¿Cancelar tu cita del ${cita.fecha}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', cita.id);
          if (error) { Alert.alert('Error', 'No se pudo cancelar.'); return; }
          await supabase.from('notificaciones').insert({
            usuario_id: user!.id, titulo: 'Cita cancelada',
            mensaje: `Tu cita del ${cita.fecha} a las ${cita.hora_inicio.substring(0, 5)} fue cancelada.`,
            tipo: 'cancelacion', leido: false, fecha_envio: new Date().toISOString(),
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await cargar();
        },
      },
    ]);
  };

  const hoy = new Date().toISOString().split('T')[0];
  let citasFiltradas = citas;
  if (segmento === 'proximas') citasFiltradas = citas.filter(c => c.fecha >= hoy);
  if (segmento === 'pasadas')  citasFiltradas = citas.filter(c => c.fecha < hoy);
  if (statusFilt) citasFiltradas = citasFiltradas.filter(c => c.estado === statusFilt);

  // Chips visibles según segmento
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
              <Text style={[s.segTxt, segmento === sg.valor && s.segTxtActive]}>
                {sg.label}
              </Text>
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
          <AnimatedItem cita={item} onCancelar={cancelarCita} index={index} />
        )}
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

  /* Segmented */
  segWrap:  { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.bg },
  segTrack: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderRadius: 14, padding: 3, borderWidth: 1, borderColor: C.border,
    position: 'relative',
  },
  segPill: {
    position: 'absolute', top: 3, left: 3, bottom: 3,
    backgroundColor: C.primary, borderRadius: 11,
  },
  segBtn: {
    paddingVertical: 9, alignItems: 'center', borderRadius: 11, zIndex: 1,
  },
  segTxt:       { color: C.light, fontSize: 13, fontWeight: '600' },
  segTxtActive: { color: C.bg,    fontWeight: '800' },

  /* Status chips */
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

  /* List */
  lista: { padding: 16, paddingBottom: 32 },

  /* Empty */
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
});
