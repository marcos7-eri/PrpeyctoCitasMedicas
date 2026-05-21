import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Animated, Easing, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getProximas14Dias, generarSlots, calcularHoraFin, formatFecha } from '../../utils/fechas';
import { Especialidad, Doctor, Horario } from '../../types';

const { width } = Dimensions.get('window');

const C = {
  bg: '#060D1A', card: '#0B1829', surface: '#0F2035',
  primary: '#2DD4BF', accent: '#6366F1',
  white: '#FFFFFF', muted: '#94A3B8', light: '#64748B',
  border: '#1E3A5F', success: '#10B981', warning: '#F59E0B', error: '#F43F5E',
};

const STEPS = [
  { label: 'Especialidad', sub: '¿Qué tipo de atención necesitas?',  icon: 'medical-outline'         },
  { label: 'Doctor',       sub: 'Elige a tu médico de confianza',     icon: 'person-outline'          },
  { label: 'Fecha',        sub: 'Selecciona el día de tu cita',       icon: 'calendar-outline'        },
  { label: 'Horario',      sub: 'Escoge tu hora preferida',           icon: 'time-outline'            },
  { label: 'Confirmar',    sub: 'Revisa y confirma tu reservación',   icon: 'checkmark-circle-outline'},
];

export default function ReservarCitaPaciente() {
  const { user }     = useAuth();
  const navigation   = useNavigation<any>();

  const [paso,         setPaso]         = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [loadingData,  setLoadingData]  = useState(false);
  const [pacienteId,    setPacienteId]    = useState<string | null>(null);
  const [especialidades,setEspecialidades]= useState<Especialidad[]>([]);
  const [doctores,     setDoctores]     = useState<Doctor[]>([]);
  const [slots,        setSlots]        = useState<string[]>([]);
  const dias = getProximas14Dias();

  const [especialidadId, setEspecialidadId] = useState<number | null>(null);
  const [doctor,         setDoctor]         = useState<Doctor | null>(null);
  const [fechaObj,       setFechaObj]       = useState<{ fecha: string; label: string; dayOfWeek: number } | null>(null);
  const [horaInicio,     setHoraInicio]     = useState('');
  const [horarioActivo,  setHorarioActivo]  = useState<Horario | null>(null);
  const [motivo,         setMotivo]         = useState('');

  // Animations
  const progress  = useRef(new Animated.Value(0)).current;
  const dotScales = STEPS.map(() => useRef(new Animated.Value(1)).current);
  const slideX    = useRef(new Animated.Value(0)).current;
  const contentOp = useRef(new Animated.Value(1)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;
  const headerOp  = useRef(new Animated.Value(0)).current;
  const headerY   = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(progress, {
      toValue: paso / (STEPS.length - 1),
      tension: 60, friction: 10, useNativeDriver: false,
    }).start();
    // Pulse active dot
    Animated.sequence([
      Animated.spring(dotScales[paso], { toValue: 1.4, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.spring(dotScales[paso], { toValue: 1,   tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [paso]);

  const transitionTo = (next: number) => {
    const dir = next > paso ? -width * 0.3 : width * 0.3;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(slideX,    { toValue: dir, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(contentOp, { toValue: 0,   duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setPaso(next);
      slideX.setValue(-dir);
      Animated.parallel([
        Animated.spring(slideX,   { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.timing(contentOp,{ toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const pressBtn = (cb: () => void) => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.93, tension: 200, friction: 10, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1,    tension: 200, friction: 8,  useNativeDriver: true }),
    ]).start(cb);
  };

  // Data fetching
  useEffect(() => {
    if (!user) return;
    // Obtener el pacientes.id real (la FK que usa la tabla citas)
    supabase.from('pacientes').select('id').eq('perfil_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setPacienteId(data.id); });

    supabase.from('especialidades').select('*').order('nombre').then(({ data, error }) => {
      if (error) Alert.alert('Error', 'No se cargaron las especialidades.');
      setEspecialidades(data ?? []);
    });
  }, [user]);

  useEffect(() => {
    if (especialidadId === null) return;
    setLoadingData(true); setDoctores([]);
    (async () => {
      const { data: listaDr, error: errDr } = await supabase
        .from('doctores')
        .select('id, perfil_id, especialidad_id, anios_experiencia, costo_consulta, biografia')
        .eq('especialidad_id', especialidadId);
      if (errDr) { Alert.alert('Error', 'No se cargaron los doctores: ' + errDr.message); setLoadingData(false); return; }
      if (!listaDr?.length) { setDoctores([]); setLoadingData(false); return; }

      const pids = listaDr.map(d => d.perfil_id).filter(Boolean);
      const { data: perfiles } = await supabase.from('perfiles').select('id, nombre_completo, foto_url').in('id', pids);
      const { data: esp }      = await supabase.from('especialidades').select('id, nombre').eq('id', especialidadId).maybeSingle();

      setDoctores(listaDr.map(d => ({
        ...d,
        perfiles: perfiles?.find(p => p.id === d.perfil_id) ?? null,
        especialidades: esp ?? null,
      })) as any);
      setLoadingData(false);
    })();
  }, [especialidadId]);

  useEffect(() => {
    if (!doctor || !fechaObj) return;
    setLoadingData(true); setSlots([]); setHoraInicio('');
    (async () => {
      const { data: horarios, error } = await supabase
        .from('horarios').select('*')
        .eq('doctor_id', doctor.id).eq('dia_semana', fechaObj.dayOfWeek).eq('activo', true);
      if (error || !horarios?.length) { setSlots([]); setLoadingData(false); return; }

      const h = horarios[0] as Horario;
      setHorarioActivo(h);
      const all = generarSlots(h.hora_inicio, h.hora_fin, h.duracion_cita);
      const { data: ocupadas } = await supabase.from('citas').select('hora_inicio')
        .eq('doctor_id', doctor.id).eq('fecha', fechaObj.fecha).in('estado', ['pendiente', 'confirmada']);
      const busy = new Set((ocupadas ?? []).map((c: any) => c.hora_inicio.substring(0, 5)));
      setSlots(all.filter(s => !busy.has(s)));
      setLoadingData(false);
    })();
  }, [doctor, fechaObj]);

  const avanzar = () => {
    if (paso === 0 && !especialidadId) { Alert.alert('Selecciona', 'Elige una especialidad.'); return; }
    if (paso === 1 && !doctor)         { Alert.alert('Selecciona', 'Elige un doctor.'); return; }
    if (paso === 2 && !fechaObj)       { Alert.alert('Selecciona', 'Elige una fecha.'); return; }
    if (paso === 3 && !horaInicio)     { Alert.alert('Selecciona', 'Elige un horario disponible.'); return; }
    transitionTo(paso + 1);
  };

  const confirmarCita = async () => {
    if (!user || !doctor || !fechaObj || !horaInicio || !horarioActivo) return;
    if (!pacienteId) {
      Alert.alert('Error', 'No se encontró tu perfil de paciente. Contacta al administrador.');
      return;
    }
    setLoading(true);
    try {
      const horaFin = calcularHoraFin(horaInicio, horarioActivo.duracion_cita);
      const { error } = await supabase.from('citas').insert({
        paciente_id: pacienteId,
        doctor_id:   doctor.id,
        fecha:       fechaObj.fecha,
        hora_inicio: horaInicio + ':00',
        hora_fin:    horaFin,
        estado:      'pendiente',
        motivo:      motivo.trim() || null,
      });
      if (error) throw error;

      const drNombre = (doctor.perfiles as any)?.nombre_completo ?? 'el doctor';
      await supabase.from('notificaciones').insert({
        usuario_id:  user.id,
        titulo:      'Cita reservada exitosamente',
        mensaje:     `Tu cita con ${drNombre} es el ${formatFecha(fechaObj.fecha)} a las ${horaInicio}.`,
        tipo:        'confirmacion',
        leido:       false,
        fecha_envio: new Date().toISOString(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '¡Cita reservada!',
        `Tu cita con ${drNombre} quedó agendada para el ${formatFecha(fechaObj.fecha)} a las ${horaInicio}.`,
        [
          { text: 'Ver mis citas', onPress: () => { resetear(); navigation.navigate('MisCitas'); } },
          { text: 'Inicio',        onPress: () => { resetear(); navigation.navigate('Inicio'); } },
        ]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.message ?? 'No se pudo reservar.';
      const esHorario = msg.toLowerCase().includes('horario') || msg.toLowerCase().includes('fuera');
      Alert.alert(
        'No se pudo reservar',
        esHorario
          ? 'El horario seleccionado no está dentro del turno del doctor. Por favor elige otra hora o fecha.'
          : msg,
        [{ text: 'Entendido' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const resetear = () => {
    setPaso(0); setEspecialidadId(null); setDoctor(null);
    setFechaObj(null); setHoraInicio(''); setHorarioActivo(null);
    setMotivo(''); setDoctores([]); setSlots([]);
  };

  const progressW = progress.interpolate({ inputRange: [0,1], outputRange: ['4%','100%'] });

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* ── STEP HEADER ── */}
      <Animated.View style={[s.header, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
        {/* Progress bar */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: progressW }]} />
        </View>

        {/* Dots */}
        <View style={s.dotsRow}>
          {STEPS.map((st, i) => {
            const done   = i < paso;
            const active = i === paso;
            return (
              <React.Fragment key={i}>
                <Animated.View style={[
                  s.dot,
                  done   && s.dotDone,
                  active && s.dotActive,
                  { transform: [{ scale: dotScales[i] }] },
                ]}>
                  {done
                    ? <Ionicons name="checkmark" size={11} color="#FFF" />
                    : <Text style={[s.dotNum, active && s.dotNumActive]}>{i + 1}</Text>
                  }
                </Animated.View>
                {i < STEPS.length - 1 && (
                  <View style={[s.dotLine, i < paso && { backgroundColor: C.primary }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Step label */}
        <View style={s.stepMeta}>
          <View style={s.stepMetaLeft}>
            <Text style={s.stepTitle}>{STEPS[paso].label}</Text>
            <Text style={s.stepSub}>{STEPS[paso].sub}</Text>
          </View>
          <View style={s.stepCounter}>
            <Text style={s.stepCounterTxt}>{paso + 1}<Text style={{ color: C.light }}>/{STEPS.length}</Text></Text>
          </View>
        </View>
      </Animated.View>

      {/* ── CONTENT ── */}
      <ScrollView style={s.body} contentContainerStyle={s.bodyPad} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: contentOp, transform: [{ translateX: slideX }] }}>

          {/* PASO 0: Especialidades */}
          {paso === 0 && especialidades.map(e => (
            <TouchableOpacity
              key={e.id}
              style={[s.opCard, especialidadId === e.id && s.opCardActive]}
              onPress={() => { Haptics.selectionAsync(); setEspecialidadId(e.id); }}
              activeOpacity={0.8}
            >
              <View style={[s.opIconBox, especialidadId === e.id && { backgroundColor: C.primary + '28' }]}>
                <Ionicons name="medical-outline" size={22} color={especialidadId === e.id ? C.primary : C.light} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.opTitle, especialidadId === e.id && { color: C.white }]}>{e.nombre}</Text>
                {!!e.descripcion && <Text style={s.opSub} numberOfLines={1}>{e.descripcion}</Text>}
              </View>
              <Ionicons
                name={especialidadId === e.id ? 'checkmark-circle' : 'chevron-forward'}
                size={20}
                color={especialidadId === e.id ? C.primary : C.border}
              />
            </TouchableOpacity>
          ))}

          {/* PASO 1: Doctores */}
          {paso === 1 && (
            loadingData ? (
              <View style={s.loadBox}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={s.loadTxt}>Buscando doctores disponibles...</Text>
              </View>
            ) : doctores.length === 0 ? (
              <View style={s.emptyBox}>
                <View style={s.emptyIconWrap}><Ionicons name="person-outline" size={36} color={C.light} /></View>
                <Text style={s.emptyTitle}>Sin doctores disponibles</Text>
                <Text style={s.emptySub}>No hay médicos registrados para esta especialidad.</Text>
              </View>
            ) : doctores.map(d => {
              const nombre = (d.perfiles as any)?.nombre_completo ?? 'Doctor';
              const active = doctor?.id === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[s.drCard, active && s.drCardActive]}
                  onPress={() => { Haptics.selectionAsync(); setDoctor(d); }}
                  activeOpacity={0.8}
                >
                  <View style={[s.drAvatar, active && { borderColor: C.primary, backgroundColor: C.primary + '28' }]}>
                    <Text style={[s.drAvatarTxt, active && { color: C.primary }]}>{nombre.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.drName, active && { color: C.white }]}>{nombre}</Text>
                    <Text style={s.drSub}>
                      {d.anios_experiencia ? `${d.anios_experiencia} años exp.` : ''}
                      {d.costo_consulta    ? ` · L. ${d.costo_consulta}` : ''}
                    </Text>
                    {!!d.biografia && <Text style={s.drBio} numberOfLines={2}>{d.biografia}</Text>}
                  </View>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'chevron-forward'}
                    size={20}
                    color={active ? C.primary : C.border}
                  />
                </TouchableOpacity>
              );
            })
          )}

          {/* PASO 2: Fecha (horizontal strip) */}
          {paso === 2 && (
            <View>
              <Text style={s.stripHint}>Próximas 2 semanas disponibles</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={dias}
                keyExtractor={d => d.fecha}
                contentContainerStyle={s.dateStrip}
                renderItem={({ item: d }) => {
                  const active = fechaObj?.fecha === d.fecha;
                  const dateObj = new Date(d.fecha + 'T00:00:00');
                  const dayNum = d.fecha.substring(8);
                  const month  = dateObj.toLocaleString('es-ES', { month: 'short' });
                  return (
                    <TouchableOpacity
                      style={[s.dateCard, active && s.dateCardActive]}
                      onPress={() => { Haptics.selectionAsync(); setFechaObj(d); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.dateDow, active && { color: C.primary }]}>{d.label.substring(0, 3)}</Text>
                      <Text style={[s.dateDay, active && { color: C.primary }]}>{dayNum}</Text>
                      <Text style={[s.dateMon, active && { color: C.primary + 'AA' }]}>{month}</Text>
                      {active && <View style={s.activeDateDot} />}
                    </TouchableOpacity>
                  );
                }}
              />
              {fechaObj && (
                <View style={s.selectedDateBanner}>
                  <Ionicons name="calendar-outline" size={16} color={C.primary} />
                  <Text style={s.selectedDateTxt}>
                    Seleccionaste: <Text style={{ color: C.white, fontWeight: '700' }}>{formatFecha(fechaObj.fecha)}</Text>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* PASO 3: Horario */}
          {paso === 3 && (
            loadingData ? (
              <View style={s.loadBox}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={s.loadTxt}>Verificando horarios disponibles...</Text>
              </View>
            ) : slots.length === 0 ? (
              <View style={s.emptyBox}>
                <View style={s.emptyIconWrap}><Ionicons name="time-outline" size={36} color={C.light} /></View>
                <Text style={s.emptyTitle}>Sin horarios disponibles</Text>
                <Text style={s.emptySub}>No hay turnos libres para este día.</Text>
                <TouchableOpacity style={s.cambiarBtn} onPress={() => transitionTo(2)}>
                  <Ionicons name="calendar-outline" size={16} color={C.primary} />
                  <Text style={s.cambiarBtnTxt}>Elegir otra fecha</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Context chip */}
                {fechaObj && (
                  <View style={s.contextChip}>
                    <Ionicons name="calendar-outline" size={14} color={C.primary} />
                    <Text style={s.contextChipTxt}>{formatFecha(fechaObj.fecha)}</Text>
                    <View style={s.contextDivider} />
                    <Ionicons name="person-outline" size={14} color={C.primary} />
                    <Text style={s.contextChipTxt}>
                      {(doctor?.perfiles as any)?.nombre_completo ?? 'Doctor'}
                    </Text>
                  </View>
                )}
                <View style={s.slotsGrid}>
                  {slots.map(sl => {
                    const active = horaInicio === sl;
                    return (
                      <TouchableOpacity
                        key={sl}
                        style={[s.slotCard, active && s.slotCardActive]}
                        onPress={() => { Haptics.selectionAsync(); setHoraInicio(sl); }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="time-outline" size={14} color={active ? '#FFF' : C.light} />
                        <Text style={[s.slotTxt, active && { color: '#FFF', fontWeight: '700' }]}>{sl}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )
          )}

          {/* PASO 4: Confirmar */}
          {paso === 4 && (
            <View>
              {/* Summary card */}
              <View style={s.summaryCard}>
                <View style={s.summaryHeader}>
                  <Ionicons name="clipboard-outline" size={17} color={C.primary} />
                  <Text style={s.summaryHeaderTxt}>Resumen de tu cita</Text>
                </View>
                <SummaryRow icon="medical-outline" label="Especialidad"
                  value={(especialidades.find(e => e.id === especialidadId)?.nombre) ?? '—'} />
                <SummaryRow icon="person-outline"   label="Doctor"
                  value={(doctor?.perfiles as any)?.nombre_completo ?? '—'} />
                <SummaryRow icon="calendar-outline" label="Fecha"
                  value={fechaObj ? formatFecha(fechaObj.fecha) : '—'} />
                <SummaryRow icon="time-outline"     label="Hora"    value={horaInicio} />
                {!!doctor?.costo_consulta && (
                  <SummaryRow icon="cash-outline"   label="Costo"   value={`L. ${doctor.costo_consulta}`} />
                )}
              </View>

              {/* Motivo */}
              <Text style={s.motivoLbl}>Motivo de consulta <Text style={{ color: C.light }}>(opcional)</Text></Text>
              <TextInput
                style={s.motivoInput}
                placeholder="Describe brevemente el motivo de tu visita..."
                placeholderTextColor={C.light}
                value={motivo}
                onChangeText={setMotivo}
                multiline numberOfLines={4} textAlignVertical="top"
              />

              {/* Confirm btn */}
              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <TouchableOpacity
                  style={[s.confirmBtn, loading && { opacity: 0.7 }]}
                  onPress={() => pressBtn(confirmarCita)}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading
                    ? <><ActivityIndicator color="#FFF" size="small" /><Text style={s.confirmBtnTxt}>Reservando...</Text></>
                    : <><Ionicons name="rocket-outline" size={20} color="#FFF" /><Text style={s.confirmBtnTxt}>Confirmar cita</Text></>
                  }
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* ── NAV BAR ── */}
      <View style={s.navBar}>
        {paso > 0 ? (
          <TouchableOpacity style={s.backBtn} onPress={() => transitionTo(paso - 1)} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={17} color={C.white} />
            <Text style={s.backBtnTxt}>Atrás</Text>
          </TouchableOpacity>
        ) : <View style={{ flex: 1 }} />}

        {paso < 4 && (
          <Animated.View style={[s.nextWrap, { transform: [{ scale: btnScale }] }]}>
            <TouchableOpacity style={s.nextBtn} onPress={() => pressBtn(avanzar)} activeOpacity={0.9}>
              <Text style={s.nextBtnTxt}>Siguiente</Text>
              <Ionicons name="arrow-forward" size={17} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.summaryRow}>
      <View style={s.summaryIcon}>
        <Ionicons name={icon as any} size={14} color={C.primary} />
      </View>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={s.summaryValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    backgroundColor: C.card, paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  progressTrack: {
    height: 3, backgroundColor: C.border, borderRadius: 2,
    overflow: 'hidden', marginBottom: 16,
  },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },

  dotsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border,
  },
  dotActive: { borderColor: C.primary, backgroundColor: C.primary + '22' },
  dotDone:   { backgroundColor: C.primary, borderColor: C.primary },
  dotNum:       { color: C.light, fontSize: 11, fontWeight: '700' },
  dotNumActive: { color: C.primary },
  dotLine: { flex: 1, height: 2, backgroundColor: C.border, marginHorizontal: 4 },

  stepMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepMetaLeft: { flex: 1 },
  stepTitle: { color: C.white, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  stepSub:   { color: C.muted, fontSize: 13, marginTop: 3 },
  stepCounter: {
    backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.border,
  },
  stepCounterTxt: { color: C.primary, fontSize: 13, fontWeight: '700' },

  body:    { flex: 1 },
  bodyPad: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },

  /* Option cards (esp + dr) */
  opCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1.5, borderColor: C.border,
  },
  opCardActive: { borderColor: C.primary, backgroundColor: C.primary + '0B' },
  opIconBox: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
  },
  opTitle: { color: C.muted, fontSize: 15, fontWeight: '600' },
  opSub:   { color: C.light, fontSize: 12, marginTop: 3 },

  /* Doctor card */
  drCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1.5, borderColor: C.border,
  },
  drCardActive: { borderColor: C.primary, backgroundColor: C.primary + '0B' },
  drAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.border, flexShrink: 0,
  },
  drAvatarTxt: { color: C.light, fontSize: 20, fontWeight: '800' },
  drName: { color: C.muted, fontSize: 15, fontWeight: '700' },
  drSub:  { color: C.light, fontSize: 12, marginTop: 3 },
  drBio:  { color: C.light, fontSize: 12, marginTop: 5, lineHeight: 17 },

  /* Date strip */
  stripHint: { color: C.muted, fontSize: 13, marginBottom: 14 },
  dateStrip: { paddingRight: 20, gap: 8 },
  dateCard: {
    width: 68, paddingVertical: 16,
    backgroundColor: C.card, borderRadius: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, gap: 3, position: 'relative',
  },
  dateCardActive: { borderColor: C.primary, backgroundColor: C.primary + '12' },
  dateDow: { color: C.light,  fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  dateDay: { color: C.white,  fontSize: 22, fontWeight: '800' },
  dateMon: { color: C.light,  fontSize: 10, textTransform: 'uppercase' },
  activeDateDot: {
    position: 'absolute', bottom: 7,
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.primary,
  },
  selectedDateBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primary + '12', borderRadius: 12, padding: 12, marginTop: 14,
    borderWidth: 1, borderColor: C.primary + '33',
  },
  selectedDateTxt: { color: C.primary, fontSize: 13 },

  /* Context chip */
  contextChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  contextChipTxt: { color: C.primary, fontSize: 13, fontWeight: '600' },
  contextDivider: { width: 1, height: 14, backgroundColor: C.border, marginHorizontal: 4 },

  /* Slots */
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    width: (width - 60) / 3,
    backgroundColor: C.card, borderRadius: 12, paddingVertical: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  slotCardActive: { backgroundColor: C.primary, borderColor: C.primary },
  slotTxt:        { color: C.muted, fontSize: 14, fontWeight: '600' },

  /* Summary */
  summaryCard: {
    backgroundColor: C.card, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border, marginBottom: 22,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  summaryHeaderTxt: { color: C.primary, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  summaryIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: C.primary + '16', justifyContent: 'center', alignItems: 'center',
  },
  summaryLabel: { color: C.light, fontSize: 13, width: 96 },
  summaryValue: { color: C.white, fontSize: 14, fontWeight: '600', flex: 1 },

  motivoLbl: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  motivoInput: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    color: C.white, fontSize: 14, borderWidth: 1.5, borderColor: C.border,
    minHeight: 110, marginBottom: 22,
  },
  confirmBtn: {
    backgroundColor: C.accent, padding: 17, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  confirmBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  /* Loading / empty */
  loadBox: { alignItems: 'center', paddingVertical: 48, gap: 16 },
  loadTxt:  { color: C.muted, fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  emptyTitle: { color: C.white, fontSize: 16, fontWeight: '600' },
  emptySub:   { color: C.muted, fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
  cambiarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.primary + '16', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11,
    borderWidth: 1, borderColor: C.primary + '33', marginTop: 6,
  },
  cambiarBtnTxt: { color: C.primary, fontWeight: '600', fontSize: 14 },

  /* Nav bar */
  navBar: {
    flexDirection: 'row', gap: 10, padding: 16,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg,
  },
  backBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.surface, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: C.border,
  },
  backBtnTxt: { color: C.white, fontSize: 15, fontWeight: '600' },
  nextWrap:   { flex: 1.6 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  nextBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
