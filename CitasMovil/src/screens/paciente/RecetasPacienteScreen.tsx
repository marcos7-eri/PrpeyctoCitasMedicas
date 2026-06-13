import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SectionList, ActivityIndicator,
  RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const C = {
  bg: '#060D1A', card: '#0B1829', surface: '#0F2035',
  primary: '#2DD4BF', accent: '#6366F1',
  white: '#FFFFFF', muted: '#94A3B8', light: '#64748B',
  border: '#1E3A5F', success: '#10B981', warning: '#F59E0B', error: '#F43F5E',
};

interface Receta {
  id: number;
  medicamento: string;
  dosis: string | null;
  frecuencia: string | null;
  duracion: string | null;
  instrucciones: string | null;
  /* campos inyectados al aplanar */
  _fecha: string;
  _doctor: string;
  _especialidad: string;
}

interface Seccion {
  title: string;     // fecha formateada
  subtitle: string;  // "Dr. X · Especialidad"
  data: Receta[];
}

function RecetaCard({ item, index }: { item: Receta; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 70, friction: 12,
      delay: Math.min(index * 60, 300), useNativeDriver: true,
    }).start();
  }, []);

  const detalle = [item.dosis, item.frecuencia, item.duracion].filter(Boolean).join(' · ');

  return (
    <Animated.View style={[
      s.recetaCard,
      { opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
    ]}>
      {/* Banda lateral */}
      <View style={s.banda} />

      <View style={{ flex: 1, padding: 14 }}>
        {/* Nombre medicamento */}
        <View style={s.medRow}>
          <View style={s.pillIcon}>
            <Ionicons name="medkit-outline" size={16} color={C.accent} />
          </View>
          <Text style={s.medNombre}>{item.medicamento}</Text>
        </View>

        {/* Dosis / frecuencia / duración */}
        {detalle ? (
          <View style={s.detalleRow}>
            {item.dosis && (
              <View style={s.chip}>
                <Ionicons name="flask-outline" size={11} color={C.primary} />
                <Text style={s.chipTxt}>{item.dosis}</Text>
              </View>
            )}
            {item.frecuencia && (
              <View style={s.chip}>
                <Ionicons name="time-outline" size={11} color={C.primary} />
                <Text style={s.chipTxt}>{item.frecuencia}</Text>
              </View>
            )}
            {item.duracion && (
              <View style={s.chip}>
                <Ionicons name="calendar-outline" size={11} color={C.primary} />
                <Text style={s.chipTxt}>{item.duracion}</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Instrucciones */}
        {item.instrucciones ? (
          <Text style={s.instrucciones}>{item.instrucciones}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default function RecetasPacienteScreen() {
  const { user } = useAuth();
  const [secciones,  setSecciones]  = useState<Seccion[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const cargar = useCallback(async () => {
    if (!user) return;
    try {
      // Paso 1: resolver pacientes.id
      const { data: pac, error: errPac } = await supabase
        .from('pacientes').select('id').eq('perfil_id', user.id).maybeSingle();

      console.log('[Recetas] auth user.id:', user.id);
      console.log('[Recetas] pac:', pac, 'error:', errPac?.message);

      if (!pac) { setLoading(false); return; }

      // Paso 2: obtener historiales del paciente
      const { data: historiales, error: errH } = await supabase
        .from('historial_medico')
        .select('id, fecha_registro, doctor_id, doctores(perfiles(nombre_completo), especialidades(nombre))')
        .eq('paciente_id', pac.id)
        .order('fecha_registro', { ascending: false });

      console.log('[Recetas] historiales:', historiales?.length, 'error:', errH?.message);

      if (!historiales || historiales.length === 0) { setLoading(false); return; }

      // Paso 3: obtener todas las recetas de esos historiales en una sola query
      const ids = historiales.map((h: any) => h.id);
      const { data: recetas, error: errR } = await supabase
        .from('recetas')
        .select('id, historial_id, medicamento, dosis, frecuencia, duracion, instrucciones')
        .in('historial_id', ids);

      console.log('[Recetas] recetas encontradas:', recetas?.length, 'error:', errR?.message);

      if (!recetas || recetas.length === 0) { setLoading(false); return; }

      // Paso 4: construir secciones agrupando recetas por historial
      const seccs: Seccion[] = [];
      let totalRecetas = 0;

      for (const h of historiales as any[]) {
        const recetasDeEste = (recetas as any[]).filter(r => r.historial_id === h.id);
        if (recetasDeEste.length === 0) continue;

        const fecha = new Date(h.fecha_registro).toLocaleDateString('es-ES', {
          day: '2-digit', month: 'long', year: 'numeric',
        });
        const doctor       = h.doctores?.perfiles?.nombre_completo ?? 'Doctor';
        const especialidad = h.doctores?.especialidades?.nombre    ?? '';
        const subtitle     = especialidad ? `${doctor} · ${especialidad}` : doctor;

        const recetasAplanadas: Receta[] = recetasDeEste.map((r: any) => ({
          ...r,
          _fecha: fecha, _doctor: doctor, _especialidad: especialidad,
        }));

        seccs.push({ title: fecha, subtitle, data: recetasAplanadas });
        totalRecetas += recetasDeEste.length;
      }

      setSecciones(seccs);
      setTotal(totalRecetas);
    } catch (e) { console.error('[Recetas] excepción:', e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { cargar(); }, [cargar]);
  const onRefresh = async () => { setRefreshing(true); await cargar(); setRefreshing(false); };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <Animated.View style={[s.header, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
        <Text style={s.headerTitle}>Mis recetas</Text>
        <View style={s.headerPill}>
          <Ionicons name="medkit-outline" size={13} color={C.accent} />
          <Text style={[s.headerPillTxt, { color: C.accent }]}>{total} receta{total !== 1 ? 's' : ''}</Text>
        </View>
      </Animated.View>

      {secciones.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyOuter}>
            <View style={s.emptyInner}>
              <Ionicons name="medkit-outline" size={40} color={C.light} />
            </View>
          </View>
          <Text style={s.emptyTitle}>Sin recetas médicas</Text>
          <Text style={s.emptySub}>
            Tus recetas aparecerán aquí después de cada consulta en la que el médico las registre.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={r => String(r.id)}
          contentContainerStyle={s.lista}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          renderSectionHeader={({ section }) => (
            <View style={s.seccionHeader}>
              <View style={s.seccionLeft}>
                <Ionicons name="calendar-outline" size={13} color={C.primary} style={{ marginTop: 1 }} />
                <View>
                  <Text style={s.seccionFecha}>{section.title}</Text>
                  <Text style={s.seccionDoctor}>{section.subtitle}</Text>
                </View>
              </View>
              <View style={s.seccionBadge}>
                <Text style={s.seccionBadgeTxt}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item, index }) => (
            <RecetaCard item={item} index={index} />
          )}
          SectionSeparatorComponent={() => <View style={{ height: 16 }} />}
        />
      )}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { color: C.white, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.accent + '14', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: C.accent + '30',
  },
  headerPillTxt: { fontSize: 12, fontWeight: '700' },

  lista: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  /* Cabecera de sección (agrupada por consulta) */
  seccionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  seccionLeft:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flex: 1 },
  seccionFecha:  { color: C.white, fontSize: 13, fontWeight: '700' },
  seccionDoctor: { color: C.light, fontSize: 12, marginTop: 2 },
  seccionBadge: {
    backgroundColor: C.primary + '18', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.primary + '30',
  },
  seccionBadgeTxt: { color: C.primary, fontSize: 12, fontWeight: '700' },

  /* Card de receta */
  recetaCard: {
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', marginBottom: 8, overflow: 'hidden',
  },
  banda: { width: 4, backgroundColor: C.accent },

  medRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  pillIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.accent + '18', justifyContent: 'center', alignItems: 'center',
  },
  medNombre: { color: C.white, fontSize: 15, fontWeight: '700', flex: 1 },

  detalleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primary + '12', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: C.primary + '25',
  },
  chipTxt: { color: C.primary, fontSize: 11, fontWeight: '600' },

  instrucciones: {
    color: C.muted, fontSize: 12, lineHeight: 17,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 8, marginTop: 2,
  },

  /* Empty state */
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  emptyOuter: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: C.accent + '0C', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  emptyInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.card, justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { color: C.white, fontSize: 18, fontWeight: '700' },
  emptySub: { color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
