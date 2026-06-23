import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Alert, Linking, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { API_URL } from '../../lib/api';

const C = {
  bg: '#060D1A',
  card: '#0B1829',
  surface: '#0F2035',
  primary: '#2DD4BF',
  primaryDark: '#0D9488',
  accent: '#6366F1',
  white: '#FFFFFF',
  muted: '#94A3B8',
  light: '#64748B',
  border: '#1E3A5F',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#F43F5E',
  emergencia: '#FF1744',
};

const SUGERENCIAS = [
  'Tengo dolor de cabeza intenso',
  'Me duele el estómago',
  'Tengo fiebre y tos',
  'Dolor en el pecho',
  'Dificultad para respirar',
  'Dolor en las articulaciones',
];

interface ChatMensaje {
  id: string;
  rol: 'usuario' | 'asistente';
  contenido: string;
  urgencia?: string;
  especialidad?: string;
  agendar?: boolean;
}

// ─── Burbuja de chat ───────────────────────────────────────────────────────
function Burbuja({ msg }: { msg: ChatMensaje }) {
  const esUsuario  = msg.rol === 'usuario';
  const esEmerg    = msg.urgencia === 'emergencia';
  const esUrgente  = msg.urgencia === 'urgente';

  return (
    <View style={[s.burbujaRow, esUsuario && s.burbujaRowDer]}>
      {!esUsuario && (
        <View style={s.avatar}>
          <Ionicons name="medkit" size={14} color={C.primary} />
        </View>
      )}
      <View style={[
        s.burbuja,
        esUsuario  ? s.burbujaUser : s.burbujaBot,
        esEmerg    && s.burbujaEmerg,
        esUrgente  && !esEmerg && s.burbujaUrgente,
      ]}>
        {esEmerg && (
          <View style={s.bannerEmerg}>
            <Ionicons name="warning" size={13} color="#FFF" />
            <Text style={s.bannerTexto}> EMERGENCIA — LLAMA AL 911</Text>
          </View>
        )}
        {esUrgente && !esEmerg && (
          <View style={s.bannerUrgente}>
            <Ionicons name="alert-circle" size={13} color={C.warning} />
            <Text style={[s.bannerTexto, { color: C.warning }]}> Atención urgente recomendada</Text>
          </View>
        )}
        <Text style={[s.burbujaTexto, esUsuario && { color: C.white }]}>
          {msg.contenido}
        </Text>
        {!esUsuario && msg.especialidad && (
          <View style={s.especialidadRow}>
            <Ionicons name="medical" size={11} color={C.primary} />
            <Text style={s.especialidadTexto}> {msg.especialidad}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Indicador "escribiendo..." ────────────────────────────────────────────
function Typing() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anim = (d: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(d, { toValue: -5, duration: 280, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0,  duration: 280, useNativeDriver: true }),
      ]));
    Animated.parallel(dots.map((d, i) => anim(d, i * 140))).start();
  }, []);

  return (
    <View style={[s.burbujaRow, { marginBottom: 12 }]}>
      <View style={s.avatar}><Ionicons name="medkit" size={14} color={C.primary} /></View>
      <View style={[s.burbuja, s.burbujaBot, { paddingVertical: 14, paddingHorizontal: 18 }]}>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {dots.map((d, i) => (
            <Animated.View key={i} style={[s.dot, { transform: [{ translateY: d }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────
export default function ChatIAScreen() {
  const { user } = useAuth();
  const nav = useNavigation<any>();
  const flatRef = useRef<FlatList>(null);

  const [mensajes, setMensajes]         = useState<ChatMensaje[]>([]);
  const [input, setInput]               = useState('');
  const [cargando, setCargando]         = useState(false);
  const [sesionId, setSesionId]         = useState<string | null>(null);
  const [pacienteId, setPacienteId]     = useState<string | null>(null);
  const [agendarInfo, setAgendarInfo]   = useState<{ especialidad: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('pacientes')
        .select('id')
        .eq('perfil_id', user.id)
        .single();
      if (!data) return;
      setPacienteId(data.id);
      try {
        const res  = await fetch(`${API_URL}/ia/sesion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paciente_id: data.id }),
        });
        const json = await res.json();
        if (json.id) setSesionId(json.id);
      } catch { /* se crea en el primer mensaje */ }
    })();
  }, [user]);

  const scrollAbajo = useCallback(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const enviar = async (texto?: string) => {
    const msg = (texto ?? input).trim();
    if (!msg || cargando || !pacienteId) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    setAgendarInfo(null);

    const msgUser: ChatMensaje = { id: `u-${Date.now()}`, rol: 'usuario', contenido: msg };
    setMensajes(prev => [...prev, msgUser]);
    setCargando(true);
    scrollAbajo();

    try {
      const res  = await fetch(`${API_URL}/ia/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: msg, paciente_id: pacienteId, sesion_id: sesionId }),
      });
      const data = await res.json();

      // Si el backend devolvió un error HTTP, mostrarlo directamente
      if (!res.ok) {
        const errTexto = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || `Error ${res.status} del servidor`;
        setMensajes(prev => [...prev, {
          id: `e-${Date.now()}`, rol: 'asistente', contenido: ` Error del servidor:\n${errTexto}`,
        }]);
        setCargando(false);
        scrollAbajo();
        return;
      }

      if (!sesionId && data.sesion_id) setSesionId(data.sesion_id);

      const msgBot: ChatMensaje = {
        id: `b-${Date.now()}`,
        rol: 'asistente',
        contenido: data.respuesta || 'Sin respuesta.',
        urgencia: data.urgencia,
        especialidad: data.especialidad_sugerida,
        agendar: data.recomienda_agendar,
      };

      if (data.es_emergencia) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          '🚨 EMERGENCIA MÉDICA',
          'Los síntomas que describes pueden ser una emergencia. Llama al 911 o ve a urgencias AHORA.',
          [
            { text: 'Llamar al 911', style: 'destructive', onPress: () => Linking.openURL('tel:911') },
            { text: 'Entendido' },
          ]
        );
      } else if (data.urgencia === 'urgente') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      setMensajes(prev => [...prev, msgBot]);
      if (data.recomienda_agendar && data.especialidad_sugerida) {
        setAgendarInfo({ especialidad: data.especialidad_sugerida });
      }
    } catch {
      setMensajes(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          rol: 'asistente',
          contenido: 'Error de conexión con el servidor. Verifica que el backend esté activo.',
        },
      ]);
    } finally {
      setCargando(false);
      scrollAbajo();
    }
  };

  // ── Empty state con sugerencias ──
  const EmptyState = () => (
    <ScrollView contentContainerStyle={s.empty} showsVerticalScrollIndicator={false}>
      <View style={s.emptyIcon}>
        <Ionicons name="medkit" size={38} color={C.primary} />
      </View>
      <Text style={s.emptyTitle}>Asistente Médico</Text>
      <Text style={s.emptySubtitle}>
        Cuéntame tus síntomas y te orientaré sobre qué especialista consultar.
      </Text>
      <Text style={s.disclaimer}>
        ⚕️ Este asistente no reemplaza la consulta médica profesional
      </Text>
      <Text style={s.sugeLabel}>Síntomas frecuentes</Text>
      <View style={s.chips}>
        {SUGERENCIAS.map((sg, i) => (
          <TouchableOpacity key={i} style={s.chip} onPress={() => enviar(sg)} activeOpacity={0.7}>
            <Text style={s.chipTexto}>{sg}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Lista de mensajes */}
      <FlatList
        ref={flatRef}
        data={mensajes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Burbuja msg={item} />}
        contentContainerStyle={[s.lista, mensajes.length === 0 && { flex: 1 }]}
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={cargando ? <Typing /> : null}
        onContentSizeChange={scrollAbajo}
      />

      {/* Banner de agendar cita */}
      {agendarInfo && (
        <TouchableOpacity
          style={s.agendarBanner}
          onPress={() => nav.navigate('Reservar')}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar" size={18} color="#FFF" />
          <Text style={s.agendarTexto}>
            Agendar cita — {agendarInfo.especialidad}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Barra de entrada */}
      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Describe tus síntomas..."
          placeholderTextColor={C.light}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || cargando) && s.sendBtnOff]}
          onPress={() => enviar()}
          disabled={!input.trim() || cargando}
          activeOpacity={0.8}
        >
          {cargando
            ? <ActivityIndicator size="small" color="#FFF" />
            : <Ionicons name="send" size={19} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  lista: { padding: 16, paddingBottom: 4 },

  // Empty state
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#0D3035', borderWidth: 2, borderColor: C.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle:    { fontSize: 20, fontWeight: '700', color: C.white, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  disclaimer:    { fontSize: 12, color: C.light, textAlign: 'center', marginBottom: 28, fontStyle: 'italic' },
  sugeLabel:     { fontSize: 13, color: C.light, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 10 },
  chips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
  },
  chipTexto: { color: C.muted, fontSize: 13 },

  // Burbuja
  burbujaRow:    { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 8 },
  burbujaRowDer: { flexDirection: 'row-reverse' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#0D3035', borderWidth: 1, borderColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  burbuja: {
    maxWidth: '78%', borderRadius: 18, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  burbujaUser:    { backgroundColor: C.primaryDark, borderBottomRightRadius: 4 },
  burbujaBot:     { backgroundColor: C.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
  burbujaEmerg:   { borderColor: C.emergencia, borderWidth: 1.5 },
  burbujaUrgente: { borderColor: C.warning, borderWidth: 1.5 },
  burbujaTexto:   { color: C.muted, fontSize: 14, lineHeight: 20 },

  // Banners dentro de burbuja
  bannerEmerg: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.emergencia, borderRadius: 6, padding: 6, marginBottom: 8,
  },
  bannerUrgente: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2C1F0A', borderRadius: 6, padding: 6, marginBottom: 8,
  },
  bannerTexto: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  especialidadRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  especialidadTexto: { color: C.primary, fontSize: 12, fontWeight: '600' },

  // Typing dots
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary },

  // Agendar banner
  agendarBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.primaryDark, paddingVertical: 14, paddingHorizontal: 20,
  },
  agendarTexto: { flex: 1, color: C.white, fontWeight: '600', fontSize: 14 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  input: {
    flex: 1, color: C.white, fontSize: 15, maxHeight: 100,
    backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  sendBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryDark, justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { backgroundColor: C.border },
});
