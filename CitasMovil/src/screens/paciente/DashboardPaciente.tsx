import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Linking, ActivityIndicator,
  Animated, Dimensions, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatFecha, formatHora, formatTimeAgo } from '../../utils/fechas';
import { Cita, Notificacion, Perfil } from '../../types';

const { width } = Dimensions.get('window');
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Clinica+Medica+Central';

const C = {
  bg: '#060D1A', card: '#0B1829', surface: '#0F2035',
  primary: '#2DD4BF', accent: '#6366F1',
  white: '#FFFFFF', muted: '#94A3B8', light: '#64748B',
  border: '#1E3A5F', success: '#10B981', warning: '#F59E0B', error: '#F43F5E',
};

const ACCIONES = [
  { screen: 'Reservar',       icon: 'calendar-outline',       label: 'Reservar\ncita',   color: C.primary,  bg: '#0F3035' },
  { screen: 'MisCitas',       icon: 'document-text-outline',  label: 'Mis\ncitas',       color: '#60A5FA',  bg: '#0F1C35' },
  { screen: 'Notificaciones', icon: 'notifications-outline',  label: 'Notifi-\ncaciones', color: C.warning, bg: '#2C1F0A' },
  { screen: 'Perfil',         icon: 'person-circle-outline',  label: 'Mi\nperfil',        color: C.accent,   bg: '#1A1035' },
];

export default function DashboardPaciente() {
  const { user } = useAuth();
  const nav = useNavigation<any>();

  const [perfil, setPerfil]           = useState<Perfil | null>(null);
  const [citaProxima, setCitaProxima] = useState<Cita | null>(null);
  const [notifs, setNotifs]           = useState<Notificacion[]>([]);
  const [totalCitas, setTotalCitas]   = useState(0);
  const [noLeidas, setNoLeidas]       = useState(0);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  // Animations
  const topOp   = useRef(new Animated.Value(0)).current;
  const topY    = useRef(new Animated.Value(-24)).current;
  const heroSc  = useRef(new Animated.Value(0.92)).current;
  const heroOp  = useRef(new Animated.Value(0)).current;
  const gridOp  = useRef(new Animated.Value(0)).current;
  const gridY   = useRef(new Animated.Value(30)).current;
  const botOp   = useRef(new Animated.Value(0)).current;
  const badge   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(badge, { toValue: 1.4, duration: 650, useNativeDriver: true }),
      Animated.timing(badge, { toValue: 1,   duration: 650, useNativeDriver: true }),
      Animated.delay(2000),
    ])).start();
  }, []);

  const runEntrance = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(topY,  { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(topOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(heroSc, { toValue: 1, tension: 70, friction: 11, useNativeDriver: true }),
        Animated.timing(heroOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(gridY,  { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(gridOp, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.timing(botOp, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const cargar = useCallback(async () => {
    if (!user) return;
    const hoy = new Date().toISOString().split('T')[0];

    // Resolver el pacientes.id real (distinto del auth user.id)
    const { data: pac } = await supabase
      .from('pacientes').select('id').eq('perfil_id', user.id).maybeSingle();
    const pacienteId = pac?.id ?? null;

    const [perfilRes, citaRes, notifsRes, totalRes] = await Promise.all([
      supabase.from('perfiles').select('*').eq('id', user.id).single(),
      pacienteId
        ? supabase.from('citas')
            .select('id,fecha,hora_inicio,estado,motivo,doctores(id,perfiles(nombre_completo),especialidades(nombre))')
            .eq('paciente_id', pacienteId).gte('fecha', hoy)
            .in('estado', ['pendiente', 'confirmada'])
            .order('fecha', { ascending: true }).limit(1).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('notificaciones').select('*').eq('usuario_id', user.id)
        .order('fecha_envio', { ascending: false }).limit(4),
      pacienteId
        ? supabase.from('citas').select('id', { count: 'exact', head: true }).eq('paciente_id', pacienteId)
        : Promise.resolve({ count: 0 }),
    ]);

    if (perfilRes.data)  setPerfil(perfilRes.data);
    setCitaProxima((citaRes.data as any) ?? null);
    if (notifsRes.data) {
      setNotifs(notifsRes.data);
      setNoLeidas(notifsRes.data.filter((n: Notificacion) => !n.leido).length);
    }
    setTotalCitas((totalRes as any).count ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { cargar().then(runEntrance); }, [cargar]);

  const onRefresh = async () => { setRefreshing(true); await cargar(); setRefreshing(false); };

  const primerNombre = perfil?.nombre_completo?.split(' ')[0] ?? 'Paciente';
  const iniciales    = perfil?.nombre_completo?.split(' ').slice(0,2).map(p => p[0].toUpperCase()).join('') ?? '?';
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const citaDr  = (citaProxima?.doctores as any)?.perfiles?.nombre_completo ?? 'Doctor';
  const citaEsp = (citaProxima?.doctores as any)?.especialidades?.nombre ?? '';
  const citaColor = citaProxima?.estado === 'confirmada' ? C.success : C.warning;

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* ── TOP BAR ─────────────────────────────────── */}
        <Animated.View style={[s.topBar, { opacity: topOp, transform: [{ translateY: topY }] }]}>
          <View>
            <Text style={s.saludoTxt}>{saludo}</Text>
            <Text style={s.nombreTxt}>{primerNombre}</Text>
          </View>
          <View style={s.topActions}>
            <TouchableOpacity
              style={s.bellBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); nav.navigate('Notificaciones'); }}
            >
              <Ionicons name="notifications-outline" size={22} color={C.white} />
              {noLeidas > 0 && (
                <Animated.View style={[s.bellBadge, { transform: [{ scale: badge }] }]}>
                  <Text style={s.bellBadgeTxt}>{noLeidas > 9 ? '9+' : noLeidas}</Text>
                </Animated.View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.avatarPill} onPress={() => nav.navigate('Perfil')}>
              {perfil?.foto_url
                ? <Image source={{ uri: perfil.foto_url }} style={s.avatarPillImg} />
                : <Text style={s.avatarPillTxt}>{iniciales}</Text>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── HERO: PRÓXIMA CITA ───────────────────────── */}
        <Animated.View style={[{ opacity: heroOp, transform: [{ scale: heroSc }] }, s.heroWrap]}>
          {citaProxima ? (
            <View style={s.heroCard}>
              {/* BG decoration */}
              <View style={s.heroDeco1} />
              <View style={s.heroDeco2} />

              <Text style={s.heroLabel}>PRÓXIMA CITA</Text>

              <View style={s.heroMain}>
                <View style={s.heroAvatar}>
                  <Text style={s.heroAvatarTxt}>{citaDr.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroDr}>{citaDr}</Text>
                  <Text style={s.heroEsp}>{citaEsp}</Text>
                </View>
                <View style={[s.heroBadge, { backgroundColor: citaColor + '28', borderColor: citaColor + '55' }]}>
                  <View style={[s.heroBadgeDot, { backgroundColor: citaColor }]} />
                  <Text style={[s.heroBadgeTxt, { color: citaColor }]}>{citaProxima.estado}</Text>
                </View>
              </View>

              <View style={s.heroInfoRow}>
                <View style={s.heroChip}>
                  <Ionicons name="calendar-outline" size={14} color={C.primary} />
                  <Text style={s.heroChipTxt}>{formatFecha(citaProxima.fecha)}</Text>
                </View>
                <View style={s.heroChip}>
                  <Ionicons name="time-outline" size={14} color={C.primary} />
                  <Text style={s.heroChipTxt}>{formatHora(citaProxima.hora_inicio)}</Text>
                </View>
              </View>

              <TouchableOpacity style={s.heroBtn} onPress={() => nav.navigate('MisCitas')} activeOpacity={0.8}>
                <Text style={s.heroBtnTxt}>Ver todas mis citas</Text>
                <Ionicons name="arrow-forward" size={16} color={C.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={s.heroEmpty}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); nav.navigate('Reservar'); }}
              activeOpacity={0.85}
            >
              <View style={s.heroDeco1} />
              <View style={s.heroDeco2} />
              <View style={s.heroEmptyIcon}>
                <Ionicons name="calendar-outline" size={38} color={C.primary} />
              </View>
              <Text style={s.heroEmptyTitle}>Sin citas próximas</Text>
              <Text style={s.heroEmptySub}>Agenda tu consulta médica en minutos</Text>
              <View style={s.heroEmptyBtn}>
                <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                <Text style={s.heroEmptyBtnTxt}>Reservar ahora</Text>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ── STATS ROW ────────────────────────────────── */}
        <Animated.View style={[s.statsRow, { opacity: gridOp }]}>
          <StatCard value={String(totalCitas)} label="Citas totales" icon="calendar-outline" color={C.primary} />
          <StatCard value={String(noLeidas)} label="Sin leer" icon="mail-unread-outline" color={C.warning} />
          <StatCard value={citaProxima ? 'Activo' : '—'} label="Estado" icon="radio-button-on" color={C.success} small />
        </Animated.View>

        {/* ── ACCIONES: 2×2 GRID ──────────────────────── */}
        <Animated.View style={[s.section, { opacity: gridOp, transform: [{ translateY: gridY }] }]}>
          <Text style={s.sectionTitle}>Acciones rápidas</Text>
          <View style={s.grid}>
            {ACCIONES.map(a => (
              <TouchableOpacity
                key={a.screen}
                style={[s.gridCard, { backgroundColor: a.bg }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); nav.navigate(a.screen); }}
                activeOpacity={0.8}
              >
                <View style={[s.gridIcon, { backgroundColor: a.color + '22' }]}>
                  <Ionicons name={a.icon as any} size={28} color={a.color} />
                </View>
                <Text style={[s.gridLabel, { color: a.color }]}>{a.label}</Text>
                <View style={[s.gridArrow, { backgroundColor: a.color + '22' }]}>
                  <Ionicons name="arrow-forward" size={13} color={a.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── CLÍNICA ──────────────────────────────────── */}
        <Animated.View style={[s.section, { opacity: botOp }]}>
          <Text style={s.sectionTitle}>Nuestra clínica</Text>
          <TouchableOpacity style={s.clinicCard} onPress={() => Linking.openURL(MAPS_URL)} activeOpacity={0.8}>
            <View style={s.clinicLeft}>
              <View style={s.clinicIconBox}>
                <Ionicons name="location" size={22} color={C.success} />
              </View>
              <View>
                <Text style={s.clinicNombre}>Clínica Médica Central</Text>
                <Text style={s.clinicSub}>Abierto · Lun–Vie 7am–6pm</Text>
              </View>
            </View>
            <View style={s.clinicNavBtn}>
              <Ionicons name="navigate-outline" size={18} color={C.success} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── ACTIVIDAD RECIENTE ───────────────────────── */}
        {notifs.length > 0 && (
          <Animated.View style={[s.section, { opacity: botOp }]}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Actividad reciente</Text>
              <TouchableOpacity onPress={() => nav.navigate('Notificaciones')}>
                <Text style={s.verTodas}>Ver todo →</Text>
              </TouchableOpacity>
            </View>
            {notifs.map(n => (
              <TouchableOpacity
                key={n.id}
                style={[s.actRow, n.leido && { opacity: 0.4 }]}
                onPress={() => nav.navigate('Notificaciones')}
                activeOpacity={0.75}
              >
                <View style={[s.actDot, !n.leido && { backgroundColor: C.error }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.actTitle} numberOfLines={1}>{n.titulo}</Text>
                  <Text style={s.actMsg}   numberOfLines={1}>{n.mensaje}</Text>
                </View>
                <Text style={s.actTime}>{formatTimeAgo(n.fecha_envio)}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label, icon, color, small }: {
  value: string; label: string; icon: string; color: string; small?: boolean;
}) {
  return (
    <View style={[s.statCard, { borderColor: color + '30' }]}>
      <Ionicons name={icon as any} size={16} color={color} style={{ marginBottom: 6 }} />
      <Text style={[s.statValue, { color, fontSize: small ? 13 : 22 }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 24 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  /* Top bar */
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18,
  },
  saludoTxt: { color: C.light, fontSize: 13, fontWeight: '500' },
  nombreTxt: { color: C.white, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  bellBadge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: C.error, borderRadius: 9,
    minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  bellBadgeTxt: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  avatarPill: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.primary + '28', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.primary + '55',
  },
  avatarPillTxt: { color: C.primary, fontSize: 15, fontWeight: '800' },
  avatarPillImg: { width: 42, height: 42, borderRadius: 21 },

  /* Hero */
  heroWrap: { marginHorizontal: 20, marginBottom: 16 },
  heroCard: {
    backgroundColor: C.card, borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: C.primary + '33', overflow: 'hidden',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  heroEmpty: {
    backgroundColor: C.card, borderRadius: 24, padding: 32,
    borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
    alignItems: 'center', gap: 8, overflow: 'hidden',
  },
  heroDeco1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.primary, top: -80, right: -60, opacity: 0.07,
  },
  heroDeco2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: C.accent, bottom: -50, left: -30, opacity: 0.07,
  },
  heroLabel: { color: C.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
  heroMain:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  heroAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primary + '28', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.primary + '44',
  },
  heroAvatarTxt: { color: C.primary, fontSize: 20, fontWeight: '800' },
  heroDr:  { color: C.white, fontSize: 16, fontWeight: '700' },
  heroEsp: { color: C.light, fontSize: 13, marginTop: 3 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1,
  },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeTxt:  { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  heroInfoRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  heroChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primary + '14', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  heroChipTxt: { color: C.primary, fontSize: 13, fontWeight: '600' },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14,
  },
  heroBtnTxt: { color: C.primary, fontSize: 13, fontWeight: '600' },

  heroEmptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.primary + '14', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.primary + '33', marginBottom: 8,
  },
  heroEmptyTitle: { color: C.white, fontSize: 17, fontWeight: '700' },
  heroEmptySub:   { color: C.light, fontSize: 13, textAlign: 'center' },
  heroEmptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.primary, borderRadius: 14,
    paddingHorizontal: 22, paddingVertical: 12, marginTop: 10,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },
  heroEmptyBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  /* Stats */
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 4 },
  statCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1,
  },
  statValue: { fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { color: C.light, fontSize: 11, fontWeight: '500', marginTop: 2, textAlign: 'center' },

  /* Sections */
  section:    { paddingHorizontal: 20, marginTop: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: -0.2, marginBottom: 14 },
  verTodas:   { color: C.primary, fontSize: 13, fontWeight: '600' },

  /* 2×2 Grid */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: {
    width: (width - 40 - 12) / 2,
    borderRadius: 20, padding: 18, gap: 10,
    borderWidth: 1, borderColor: C.border,
    justifyContent: 'space-between',
  },
  gridIcon:  { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  gridLabel: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  gridArrow: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },

  /* Clinic */
  clinicCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.success + '0C', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.success + '2A',
  },
  clinicLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clinicIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.success + '1A', justifyContent: 'center', alignItems: 'center',
  },
  clinicNombre: { color: C.white, fontSize: 14, fontWeight: '700' },
  clinicSub:    { color: C.success + 'BB', fontSize: 12, marginTop: 2 },
  clinicNavBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.success + '1A', justifyContent: 'center', alignItems: 'center',
  },

  /* Activity */
  actRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border + '77',
  },
  actDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  actTitle: { color: C.white, fontSize: 13, fontWeight: '600' },
  actMsg:   { color: C.muted, fontSize: 12, marginTop: 2 },
  actTime:  { color: C.light, fontSize: 11 },
});
