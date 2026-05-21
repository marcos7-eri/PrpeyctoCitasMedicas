import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Notificacion } from '../../types';
import { formatTimeAgo } from '../../utils/fechas';

const C = {
  bg: '#060D1A', card: '#0B1829', surface: '#0F2035',
  primary: '#2DD4BF', accent: '#6366F1',
  white: '#FFFFFF', muted: '#94A3B8', light: '#64748B',
  border: '#1E3A5F', success: '#10B981', warning: '#F59E0B', error: '#F43F5E',
};

type Section = { title: string; data: Notificacion[] };

const TIPO_META: Record<string, { icon: string; color: string }> = {
  confirmacion: { icon: 'checkmark-circle-outline', color: C.success  },
  cancelacion:  { icon: 'close-circle-outline',     color: C.error    },
  recordatorio: { icon: 'alarm-outline',             color: C.warning  },
  resultado:    { icon: 'document-text-outline',     color: C.accent   },
  general:      { icon: 'information-circle-outline',color: C.primary  },
};

function groupByDay(notifs: Notificacion[]): Section[] {
  const now       = new Date();
  const today     = new Date(now); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7);

  const buckets: Record<string, Notificacion[]> = {
    'Hoy': [], 'Ayer': [], 'Esta semana': [], 'Anteriores': [],
  };

  for (const n of notifs) {
    const d = new Date(n.fecha_envio);
    if (d >= today)     buckets['Hoy'].push(n);
    else if (d >= yesterday) buckets['Ayer'].push(n);
    else if (d >= weekAgo)   buckets['Esta semana'].push(n);
    else                     buckets['Anteriores'].push(n);
  }

  return Object.entries(buckets)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
}

function NotifItem({
  item, index, onPress, onDelete,
}: {
  item: Notificacion; index: number;
  onPress: (n: Notificacion) => void;
  onDelete: (id: number) => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 80, friction: 12,
      delay: Math.min(index * 45, 240), useNativeDriver: true,
    }).start();
  }, []);

  const meta = TIPO_META[item.tipo ?? 'general'] ?? TIPO_META.general;

  return (
    <Animated.View style={[
      s.notifWrap,
      { opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0,1], outputRange: [24,0] }) }] },
    ]}>
      <TouchableOpacity
        style={[s.notifCard, item.leido && s.notifLeida]}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
      >
        {/* Left color bar */}
        <View style={[s.notifBar, { backgroundColor: meta.color }]} />

        {/* Icon */}
        <View style={[s.notifIconBox, { backgroundColor: meta.color + '1A' }]}>
          <Ionicons name={meta.icon as any} size={20} color={meta.color} />
        </View>

        {/* Content */}
        <View style={s.notifBody}>
          <View style={s.notifTitleRow}>
            <Text style={s.notifTitle} numberOfLines={1}>{item.titulo}</Text>
            {!item.leido && <View style={[s.unreadDot, { backgroundColor: meta.color }]} />}
          </View>
          <Text style={s.notifMsg} numberOfLines={2}>{item.mensaje}</Text>
          <Text style={s.notifTime}>{formatTimeAgo(item.fecha_envio)}</Text>
        </View>
      </TouchableOpacity>

      {/* Delete */}
      <TouchableOpacity
        style={s.deleteBtn}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(item.id); }}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={15} color={C.error} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificacionesPaciente() {
  const { user }     = useAuth();
  const [notifs,     setNotifs]     = useState<Notificacion[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerOp  = useRef(new Animated.Value(0)).current;
  const headerY   = useRef(new Animated.Value(-20)).current;
  const pulseDot  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseDot, { toValue: 1.7, duration: 550, useNativeDriver: true }),
      Animated.timing(pulseDot, { toValue: 1,   duration: 550, useNativeDriver: true }),
      Animated.delay(1800),
    ])).start();
  }, []);

  const cargar = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notificaciones').select('*').eq('usuario_id', user.id)
      .order('fecha_envio', { ascending: false });
    if (data) setNotifs(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    cargar();
    const channel = supabase.channel('notif_rt')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${user?.id}` },
        payload => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setNotifs(prev => [payload.new as Notificacion, ...prev]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cargar, user]);

  const onRefresh = async () => { setRefreshing(true); await cargar(); setRefreshing(false); };

  const marcarLeida = async (notif: Notificacion) => {
    if (notif.leido) return;
    await supabase.from('notificaciones').update({ leido: true }).eq('id', notif.id);
    setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, leido: true } : n));
  };

  const marcarTodas = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await supabase.from('notificaciones').update({ leido: true })
      .eq('usuario_id', user.id).eq('leido', false);
    setNotifs(prev => prev.map(n => ({ ...n, leido: true })));
  };

  const eliminar = async (id: number) => {
    Alert.alert('Eliminar', '¿Eliminar esta notificación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await supabase.from('notificaciones').delete().eq('id', id);
          setNotifs(prev => prev.filter(n => n.id !== id));
        },
      },
    ]);
  };

  const noLeidas = notifs.filter(n => !n.leido).length;
  const sections = groupByDay(notifs);

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
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>Notificaciones</Text>
            <View style={s.livePill}>
              <Animated.View style={[s.liveDot, { transform: [{ scale: pulseDot }] }]} />
              <Text style={s.liveTxt}>En vivo</Text>
            </View>
          </View>
          {noLeidas > 0 && (
            <TouchableOpacity style={s.marcarBtn} onPress={marcarTodas} activeOpacity={0.8}>
              <Ionicons name="checkmark-done-outline" size={15} color={C.primary} />
              <Text style={s.marcarTxt}>Marcar todas leídas</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats strip */}
        <View style={s.statsStrip}>
          <View style={s.statPill}>
            <Ionicons name="notifications-outline" size={13} color={C.primary} />
            <Text style={s.statPillTxt}>{notifs.length} total</Text>
          </View>
          {noLeidas > 0 && (
            <View style={[s.statPill, { backgroundColor: C.error + '18', borderColor: C.error + '33' }]}>
              <View style={[s.unreadDot, { backgroundColor: C.error }]} />
              <Text style={[s.statPillTxt, { color: C.error }]}>{noLeidas} sin leer</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* ── SECTION LIST (grouped by day) ── */}
      <SectionList
        sections={sections}
        keyExtractor={n => String(n.id)}
        contentContainerStyle={s.lista}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{title}</Text>
            <Text style={s.sectionCount}>{data.length}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyOuter}>
              <View style={s.emptyInner}>
                <Ionicons name="notifications-off-outline" size={40} color={C.light} />
              </View>
            </View>
            <Text style={s.emptyTitle}>Sin notificaciones</Text>
            <Text style={s.emptySub}>Aquí aparecerán confirmaciones y recordatorios de tus citas.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <NotifItem item={item} index={index} onPress={marcarLeida} onDelete={eliminar} />
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  header: {
    backgroundColor: C.card, paddingHorizontal: 20,
    paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerTitle: { color: C.white, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.success + '18', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: C.success + '33',
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.success },
  liveTxt: { color: C.success, fontSize: 11, fontWeight: '700' },
  marcarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primary + '14', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: C.primary + '33',
  },
  marcarTxt: { color: C.primary, fontSize: 12, fontWeight: '600' },
  statsStrip: { flexDirection: 'row', gap: 8 },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.primary + '14', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.primary + '25',
  },
  statPillTxt: { color: C.primary, fontSize: 12, fontWeight: '600' },

  lista: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, marginTop: 8,
  },
  sectionTitle: { color: C.light, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionCount: {
    color: C.light, fontSize: 11, fontWeight: '600',
    backgroundColor: C.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },

  notifWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  notifCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  notifLeida: { opacity: 0.45 },
  notifBar:   { width: 4, alignSelf: 'stretch' },
  notifIconBox: {
    width: 40, height: 40, borderRadius: 12, margin: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  notifBody: { flex: 1, paddingRight: 14, paddingVertical: 12 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifTitle: { color: C.white, fontSize: 13, fontWeight: '700', flex: 1 },
  unreadDot:  { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
  notifMsg:   { color: C.muted, fontSize: 12, lineHeight: 17, marginBottom: 5 },
  notifTime:  { color: C.light, fontSize: 11 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.error + '16', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.error + '28',
  },

  empty:       { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyOuter: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: C.primary + '0C', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  emptyInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.card, justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { color: C.white, fontSize: 18, fontWeight: '700' },
  emptySub: { color: C.muted, fontSize: 13, textAlign: 'center', paddingHorizontal: 36, lineHeight: 20 },
});
