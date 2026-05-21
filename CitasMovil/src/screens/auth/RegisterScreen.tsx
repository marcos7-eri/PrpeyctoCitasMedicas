import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

const C = {
  bg: '#060D1A',
  card: '#0B1829',
  surface: '#0F2035',
  primary: '#2DD4BF',
  primaryDim: '#1A8C80',
  accent: '#6366F1',
  accentDim: '#4338CA',
  white: '#FFFFFF',
  muted: '#94A3B8',
  light: '#64748B',
  border: '#1E3A5F',
  error: '#F43F5E',
};

const GENEROS = ['Masculino', 'Femenino', 'Otro'];

function parseFecha(texto: string): string | null {
  const partes = texto.split('/');
  if (partes.length !== 3) return null;
  const [d, m, y] = partes;
  if (!d || !m || !y || y.length !== 4) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [paso, setPaso] = useState<'datos' | 'extra'>('datos');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombreCompleto: '',
    correo: '',
    password: '',
    confirmarPassword: '',
    telefono: '',
    fechaNacimiento: '',
    genero: '',
  });

  // ── Animated values ──
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-60)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(80)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const stepBar = useRef(new Animated.Value(0)).current;
  const f1 = useRef(new Animated.Value(0)).current;
  const f2 = useRef(new Animated.Value(0)).current;
  const f3 = useRef(new Animated.Value(0)).current;
  const f4 = useRef(new Animated.Value(0)).current;
  const f5 = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const successPulse = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Orb pulses
    const makeOrb = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );

    makeOrb(orb1, 0).start();
    makeOrb(orb2, 1800).start();

    // Entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(headerY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(cardOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.stagger(80, [f1, f2, f3, f4, f5].map(f =>
        Animated.spring(f, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true })
      )),
    ]).start();
  }, []);

  const fieldStyle = (val: Animated.Value) => ({
    opacity: val,
    transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  });

  const goToPaso2 = () => {
    const err = validarPaso1();
    if (err) { Alert.alert('Datos incompletos', err); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Slide out then in
    Animated.sequence([
      Animated.timing(slideX, { toValue: -width, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      setPaso('extra');
      slideX.setValue(width);
      // Re-animate fields
      [f1, f2, f3, f4, f5].forEach(f => f.setValue(0));
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(stepBar, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: false }),
        Animated.stagger(80, [f1, f2, f3, f4, f5].map(f =>
          Animated.spring(f, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true })
        )),
      ]).start();
    });
  };

  const goBack = () => {
    if (paso === 'extra') {
      Animated.timing(slideX, { toValue: width, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
        setPaso('datos');
        slideX.setValue(-width);
        [f1, f2, f3, f4, f5].forEach(f => f.setValue(0));
        Animated.parallel([
          Animated.timing(slideX, { toValue: 0, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(stepBar, { toValue: 0, duration: 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: false }),
          Animated.stagger(80, [f1, f2, f3, f4, f5].map(f =>
            Animated.spring(f, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true })
          )),
        ]).start();
      });
    } else {
      navigation.goBack();
    }
  };

  const pressBtn = (onPress: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.94, tension: 200, friction: 10, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start(onPress);
  };

  const validarPaso1 = (): string | null => {
    if (!form.nombreCompleto.trim()) return 'El nombre completo es requerido.';
    if (!form.correo.trim()) return 'El correo electrónico es requerido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) return 'El correo no es válido.';
    if (!form.password) return 'La contraseña es requerida.';
    if (form.password.length < 6) return 'La contraseña debe tener mínimo 6 caracteres.';
    if (form.password !== form.confirmarPassword) return 'Las contraseñas no coinciden.';
    if (!form.telefono.trim()) return 'El teléfono es requerido.';
    return null;
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const registrarse = async () => {
    setLoading(true);
    try {
      const email = form.correo.trim().toLowerCase();
      const password = form.password;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre_completo: form.nombreCompleto.trim(), rol: 'paciente' } },
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate_limit')) {
          Alert.alert(
            'Límite de correos alcanzado',
            'El plan gratuito de Supabase limita el envío de correos de confirmación.\n\nSolución: Ve a tu panel de Supabase → Authentication → Providers → Email → desactiva "Confirm email".',
            [{ text: 'Entendido' }]
          );
          return;
        }
        if (msg.includes('already registered') || msg.includes('user already exists')) {
          Alert.alert(
            'Correo ya registrado',
            'Este correo ya tiene una cuenta. ¿Deseas iniciar sesión?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') },
            ]
          );
          return;
        }
        throw new Error(authError.message);
      }

      if (!authData.user) throw new Error('No se recibió información del usuario.');
      const userId = authData.user.id;

      if (!authData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          Alert.alert(
            'Confirma tu correo',
            'Hemos enviado un correo de verificación a:\n' + email + '\n\nConfírmalo y luego inicia sesión.',
            [{ text: 'Ir al login', onPress: () => navigation.navigate('Login') }]
          );
          return;
        }
      }

      const { error: perfilError } = await supabase.from('perfiles').upsert(
        { id: userId, nombre_completo: form.nombreCompleto.trim(), correo: email, telefono: form.telefono.trim(), rol: 'paciente', estado: 'activo' },
        { onConflict: 'id' }
      );
      if (perfilError) throw new Error(`Error al guardar perfil: ${perfilError.message}`);

      const pacientePayload: Record<string, any> = { perfil_id: userId };
      if (form.fechaNacimiento.trim()) {
        const fecha = parseFecha(form.fechaNacimiento.trim());
        if (fecha) pacientePayload.fecha_nacimiento = fecha;
      }
      if (form.genero) pacientePayload.genero = form.genero;

      const { error: pacienteError } = await supabase.from('pacientes').insert(pacientePayload);
      if (pacienteError && !pacienteError.message.includes('duplicate')) {
        console.warn('Paciente insert warning:', pacienteError.message);
      }

      await supabase.from('notificaciones').insert({
        usuario_id: userId,
        titulo: '¡Bienvenido a CitasMóvil!',
        mensaje: `Hola ${form.nombreCompleto.trim().split(' ')[0]}, tu cuenta fue creada exitosamente.`,
        tipo: 'confirmacion',
        leido: false,
        fecha_envio: new Date().toISOString(),
      });

      // Success pulse
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(successPulse, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(successPulse, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      Alert.alert(
        '¡Cuenta creada!',
        `Bienvenido ${form.nombreCompleto.trim().split(' ')[0]}. Ya puedes acceder a CitasMóvil.`,
        [{ text: 'Ingresar', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error al registrarse', err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const orb1Style = {
    transform: [
      { scale: orb1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) },
      { translateY: orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
    ],
    opacity: orb1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 0.55, 0.35] }),
  };

  const orb2Style = {
    transform: [
      { scale: orb2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) },
      { translateX: orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) },
    ],
    opacity: orb2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.25, 0.45, 0.25] }),
  };

  const stepBarWidth = stepBar.interpolate({ inputRange: [0, 1], outputRange: ['10%', '90%'] });
  const stepBarColor = stepBar.interpolate({ inputRange: [0, 1], outputRange: [C.primary, C.accent] });

  const isFocused = (name: string) => focusedField === name;
  const fieldBorder = (name: string) => isFocused(name) ? C.primary : C.border;
  const fieldIcon = (name: string) => isFocused(name) ? C.primary : C.light;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Background orbs */}
      <Animated.View style={[s.orb1, orb1Style]} />
      <Animated.View style={[s.orb2, orb2Style]} />

      {/* Top bar */}
      <Animated.View style={[s.topBar, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
        <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>

        <View style={s.stepSection}>
          <View style={s.stepLabels}>
            <Text style={[s.stepLabel, paso === 'datos' && s.stepLabelActive]}>Cuenta</Text>
            <Text style={[s.stepLabel, paso === 'extra' && s.stepLabelActive]}>Perfil</Text>
          </View>
          <View style={s.stepTrack}>
            <Animated.View style={[s.stepFill, { width: stepBarWidth, backgroundColor: stepBarColor }]} />
          </View>
        </View>

        <View style={s.stepBadge}>
          <Text style={s.stepBadgeText}>{paso === 'datos' ? '1' : '2'}/2</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header block */}
        <Animated.View style={[s.headerBlock, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
          <View style={s.iconRing}>
            <View style={s.iconInner}>
              <Ionicons name={paso === 'datos' ? 'person-add-outline' : 'medical-outline'} size={28} color={C.primary} />
            </View>
          </View>
          <Text style={s.title}>
            {paso === 'datos' ? 'Crear cuenta' : 'Datos de perfil'}
          </Text>
          <Text style={s.sub}>
            {paso === 'datos'
              ? 'Información básica para tu cuenta médica'
              : 'Opcional — puedes completarlo luego en tu perfil'}
          </Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[s.card, { opacity: cardOp, transform: [{ translateY: cardY }, { translateX: slideX }] }]}>
          {paso === 'datos' ? (
            <>
              <Animated.View style={fieldStyle(f1)}>
                <FieldLabel>Nombre completo</FieldLabel>
                <View style={[s.inputRow, { borderColor: fieldBorder('nombre') }]}>
                  <Ionicons name="person-outline" size={18} color={fieldIcon('nombre')} />
                  <TextInput
                    style={s.input}
                    placeholder="Juan Pérez García"
                    placeholderTextColor={C.light}
                    value={form.nombreCompleto}
                    onChangeText={v => set('nombreCompleto', v)}
                    autoCapitalize="words"
                    onFocus={() => setFocusedField('nombre')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </Animated.View>

              <Animated.View style={fieldStyle(f2)}>
                <FieldLabel>Correo electrónico</FieldLabel>
                <View style={[s.inputRow, { borderColor: fieldBorder('correo') }]}>
                  <Ionicons name="mail-outline" size={18} color={fieldIcon('correo')} />
                  <TextInput
                    style={s.input}
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor={C.light}
                    value={form.correo}
                    onChangeText={v => set('correo', v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('correo')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </Animated.View>

              <Animated.View style={fieldStyle(f3)}>
                <FieldLabel>Contraseña</FieldLabel>
                <View style={[s.inputRow, { borderColor: fieldBorder('pass') }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={fieldIcon('pass')} />
                  <TextInput
                    style={s.input}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={C.light}
                    value={form.password}
                    onChangeText={v => set('password', v)}
                    secureTextEntry={!verPassword}
                    onFocus={() => setFocusedField('pass')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
                    <Ionicons name={verPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={C.light} />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View style={fieldStyle(f4)}>
                <FieldLabel>Confirmar contraseña</FieldLabel>
                <View style={[s.inputRow, { borderColor: fieldBorder('pass2') }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={fieldIcon('pass2')} />
                  <TextInput
                    style={s.input}
                    placeholder="Repite la contraseña"
                    placeholderTextColor={C.light}
                    value={form.confirmarPassword}
                    onChangeText={v => set('confirmarPassword', v)}
                    secureTextEntry={!verPassword}
                    onFocus={() => setFocusedField('pass2')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </Animated.View>

              <Animated.View style={fieldStyle(f5)}>
                <FieldLabel>Teléfono</FieldLabel>
                <View style={[s.inputRow, { borderColor: fieldBorder('tel') }]}>
                  <Ionicons name="call-outline" size={18} color={fieldIcon('tel')} />
                  <TextInput
                    style={s.input}
                    placeholder="+504 9999-9999"
                    placeholderTextColor={C.light}
                    value={form.telefono}
                    onChangeText={v => set('telefono', v)}
                    keyboardType="phone-pad"
                    onFocus={() => setFocusedField('tel')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </Animated.View>

              <Animated.View style={[{ transform: [{ scale: btnScale }] }, { marginTop: 28 }]}>
                <TouchableOpacity
                  style={s.btn}
                  onPress={() => pressBtn(goToPaso2)}
                  activeOpacity={0.9}
                >
                  <Text style={s.btnText}>Siguiente</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View style={fieldStyle(f1)}>
                <FieldLabel>Fecha de nacimiento (opcional)</FieldLabel>
                <View style={[s.inputRow, { borderColor: fieldBorder('fecha') }]}>
                  <Ionicons name="calendar-outline" size={18} color={fieldIcon('fecha')} />
                  <TextInput
                    style={s.input}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={C.light}
                    value={form.fechaNacimiento}
                    onChangeText={v => set('fechaNacimiento', v)}
                    keyboardType="numbers-and-punctuation"
                    onFocus={() => setFocusedField('fecha')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </Animated.View>

              <Animated.View style={fieldStyle(f2)}>
                <FieldLabel>Género (opcional)</FieldLabel>
                <View style={s.generoRow}>
                  {GENEROS.map((g, i) => (
                    <TouchableOpacity
                      key={g}
                      style={[s.generoBtn, form.genero === g && s.generoBtnOn]}
                      onPress={() => { set('genero', form.genero === g ? '' : g); Haptics.selectionAsync(); }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={i === 0 ? 'male-outline' : i === 1 ? 'female-outline' : 'person-outline'}
                        size={16}
                        color={form.genero === g ? C.primary : C.light}
                      />
                      <Text style={[s.generoTxt, form.genero === g && s.generoTxtOn]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              {/* Summary card */}
              <Animated.View style={[s.resumen, fieldStyle(f3)]}>
                <View style={s.resumenHeader}>
                  <Ionicons name="checkmark-circle" size={18} color={C.primary} />
                  <Text style={s.resumenTitle}>Resumen de tu cuenta</Text>
                </View>
                <ResRow icon="person-outline" value={form.nombreCompleto} label="Nombre" />
                <ResRow icon="mail-outline" value={form.correo} label="Correo" />
                <ResRow icon="call-outline" value={form.telefono} label="Teléfono" />
                {form.genero ? <ResRow icon="people-outline" value={form.genero} label="Género" /> : null}
              </Animated.View>

              <Animated.View style={[{ transform: [{ scale: btnScale }] }, fieldStyle(f4), { marginTop: 20 }]}>
                <TouchableOpacity
                  style={[s.btn, s.btnAccent, loading && { opacity: 0.7 }]}
                  onPress={() => pressBtn(registrarse)}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text style={s.btnText}>Creando cuenta...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="rocket-outline" size={20} color="#FFF" />
                      <Text style={s.btnText}>Crear mi cuenta</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={fieldStyle(f5)}>
                <TouchableOpacity style={s.skipBtn} onPress={registrarse} disabled={loading}>
                  <Text style={s.skipText}>Omitir datos opcionales</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </Animated.View>

        {/* Login link */}
        <Animated.View style={[s.loginLink, { opacity: cardOp }]}>
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>o</Text>
            <View style={s.dividerLine} />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={s.loginLinkText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={{ color: C.primary, fontWeight: '700' }}>Iniciar sesión</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

function ResRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.resRow}>
      <View style={s.resIconBox}>
        <Ionicons name={icon as any} size={13} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.resLabelText}>{label}</Text>
        <Text style={s.resValueText} numberOfLines={1}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  orb1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: C.primary, top: -80, right: -100,
    opacity: 0.35,
  },
  orb2: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: C.accent, bottom: 80, left: -80,
    opacity: 0.25,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  stepSection: { flex: 1 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stepLabel: { fontSize: 11, color: C.light, fontWeight: '600', letterSpacing: 0.3 },
  stepLabelActive: { color: C.primary },
  stepTrack: {
    height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden',
  },
  stepFill: { height: '100%', borderRadius: 2 },
  stepBadge: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  stepBadgeText: { color: C.primary, fontSize: 12, fontWeight: '700' },

  scroll: { paddingHorizontal: 24, paddingBottom: 48 },

  headerBlock: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  iconRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.primary + '18',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5, borderColor: C.primary + '44',
  },
  iconInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.primary + '28',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { color: C.white, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: C.muted, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 },

  card: {
    backgroundColor: C.card,
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },

  fieldLabel: {
    color: C.muted, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 8, marginTop: 18,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14,
  },
  input: { flex: 1, color: C.white, fontSize: 15 },

  generoRow: { flexDirection: 'row', gap: 8 },
  generoBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', backgroundColor: C.surface,
    gap: 4,
  },
  generoBtnOn: { borderColor: C.primary, backgroundColor: C.primary + '1A' },
  generoTxt: { color: C.light, fontSize: 12, fontWeight: '500' },
  generoTxtOn: { color: C.primary, fontWeight: '700' },

  resumen: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    marginTop: 20, borderWidth: 1, borderColor: C.primary + '33',
  },
  resumenHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resumenTitle: { color: C.primary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  resRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  resIconBox: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.primary + '1A',
    justifyContent: 'center', alignItems: 'center',
  },
  resLabelText: { color: C.light, fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },
  resValueText: { color: C.white, fontSize: 13, fontWeight: '500', marginTop: 1 },

  btn: {
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  btnAccent: {
    backgroundColor: C.accent,
    shadowColor: C.accent,
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { color: C.light, fontSize: 13, textDecorationLine: 'underline' },

  loginLink: { alignItems: 'center', marginTop: 28 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, width: '100%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { color: C.light, fontSize: 12, fontWeight: '600' },
  loginLinkText: { color: C.muted, fontSize: 14 },
});
