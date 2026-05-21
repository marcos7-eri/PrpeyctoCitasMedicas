import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = H * 0.46;

// Paleta premium para la pantalla de login
const C = {
  bg: '#060D1A',
  card: '#0B1829',
  inputBg: '#040A14',
  primary: '#2DD4BF',     // Teal brillante que destaca en fondo oscuro
  primaryDim: '#1A8C80',
  glow: '#2DD4BF',
  text: '#FFFFFF',
  muted: '#7A96AE',
  border: '#132035',
  borderFocus: '#2DD4BF',
};

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  // ── Animated values ──────────────────────────────────────────
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const cardY = useRef(new Animated.Value(70)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const f1 = useRef(new Animated.Value(0)).current;
  const f2 = useRef(new Animated.Value(0)).current;
  const f3 = useRef(new Animated.Value(0)).current;
  const f4 = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  // Particles
  const p1Y = useRef(new Animated.Value(0)).current;
  const p2Y = useRef(new Animated.Value(0)).current;
  const p3Y = useRef(new Animated.Value(0)).current;
  const p4Y = useRef(new Animated.Value(0)).current;
  const p1Op = useRef(new Animated.Value(0)).current;
  const p2Op = useRef(new Animated.Value(0)).current;
  const p3Op = useRef(new Animated.Value(0)).current;
  const p4Op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── Función de anillo de pulso ───────────────────────────
    const makeRing = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 2800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const r1 = makeRing(ring1, 0);
    const r2 = makeRing(ring2, 900);
    const r3 = makeRing(ring3, 1800);
    r1.start(); r2.start(); r3.start();

    // ── Partícula flotante ───────────────────────────────────
    const makeParticle = (
      yVal: Animated.Value,
      opVal: Animated.Value,
      delay: number,
      dur: number
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(yVal, { toValue: -130, duration: dur, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(opVal, { toValue: 0.55, duration: dur * 0.35, useNativeDriver: true }),
              Animated.timing(opVal, { toValue: 0, duration: dur * 0.65, useNativeDriver: true }),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(yVal, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(opVal, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );

    const pa1 = makeParticle(p1Y, p1Op, 0, 3200);
    const pa2 = makeParticle(p2Y, p2Op, 1100, 4000);
    const pa3 = makeParticle(p3Y, p3Op, 2200, 3600);
    const pa4 = makeParticle(p4Y, p4Op, 600, 2900);
    pa1.start(); pa2.start(); pa3.start(); pa4.start();

    // ── Entrada del logo ─────────────────────────────────────
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();

    // ── Logo pulso (empieza tras la entrada) ─────────────────
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    setTimeout(() => pulseAnim.start(), 900);

    // ── Card y campos con stagger ────────────────────────────
    Animated.parallel([
      Animated.sequence([
        Animated.delay(350),
        Animated.parallel([
          Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(cardY, { toValue: 0, tension: 40, friction: 9, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(620),
        Animated.stagger(100, [
          Animated.timing(f1, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(f2, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(f3, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(f4, { toValue: 1, duration: 450, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    return () => {
      r1.stop(); r2.stop(); r3.stop();
      pa1.stop(); pa2.stop(); pa3.stop(); pa4.stop();
      pulseAnim.stop();
    };
  }, []);

  // ── Lógica ──────────────────────────────────────────────────
  const iniciarSesion = async () => {
    if (!correo.trim() || !password) {
      Alert.alert('Campos requeridos', 'Por favor completa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error al iniciar sesión',
        error.message.includes('Invalid login credentials')
          ? 'Correo o contraseña incorrectos.'
          : error.message
      );
    }
  };

  const handleLoginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 130, useNativeDriver: true }),
    ]).start();
    iniciarSesion();
  };

  const recuperarContrasena = async () => {
    if (!correo.trim()) {
      Alert.alert('Ingresa tu correo', 'Escribe tu correo primero.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(correo.trim().toLowerCase());
    if (!error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Correo enviado ✓', 'Revisa tu bandeja de entrada.');
    }
  };

  // ── Interpolaciones de anillos ───────────────────────────────
  const ringStyle = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.5, 0] }),
    transform: [
      { scale: val.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.6] }) },
    ],
  });

  // ── Render ───────────────────────────────────────────────────
  return (
    <View style={s.screen}>

      {/* ══════════ HERO ══════════ */}
      <View style={s.hero}>

        {/* Fondo radial simulado */}
        <View style={s.radial1} />
        <View style={s.radial2} />

        {/* Anillos de pulso */}
        <Animated.View style={[s.ring, ringStyle(ring1)]} />
        <Animated.View style={[s.ring, ringStyle(ring2)]} />
        <Animated.View style={[s.ring, ringStyle(ring3)]} />

        {/* Partículas flotantes */}
        <Animated.View style={[s.particle, s.p1, { opacity: p1Op, transform: [{ translateY: p1Y }] }]} />
        <Animated.View style={[s.particle, s.p2, { opacity: p2Op, transform: [{ translateY: p2Y }] }]} />
        <Animated.View style={[s.particle, s.p3, { opacity: p3Op, transform: [{ translateY: p3Y }] }]} />
        <Animated.View style={[s.particle, s.p4, { opacity: p4Op, transform: [{ translateY: p4Y }] }]} />

        {/* Logo con pulso */}
        <Animated.View
          style={[
            s.logoOuter,
            {
              opacity: logoOpacity,
              transform: [{ scale: Animated.multiply(logoScale, logoPulse) }],
            },
          ]}
        >
          <View style={s.logoInner}>
            <Ionicons name="medical" size={40} color="#FFF" />
          </View>
        </Animated.View>

        {/* Texto del hero */}
        <Animated.View style={{ alignItems: 'center', opacity: logoOpacity }}>
          <Text style={s.appName}>CitasMóvil</Text>
          <Text style={s.tagline}>Tu salud, siempre a mano</Text>
        </Animated.View>

      </View>

      {/* ══════════ CARD ══════════ */}
      <Animated.View
        style={[
          s.card,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardY }],
          },
        ]}
      >
        {/* Borde superior teal */}
        <View style={s.cardTopBorder} />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.cardScroll}
        >
          {/* Título */}
          <Animated.View style={{ opacity: f1, transform: [{ translateY: f1.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
            <Text style={s.cardTitle}>Bienvenido de vuelta</Text>
            <Text style={s.cardSub}>Ingresa tus datos para continuar</Text>
          </Animated.View>

          {/* ── Campo Email ── */}
          <Animated.View style={[s.fieldWrap, { opacity: f2, transform: [{ translateY: f2.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
            <Text style={s.label}>CORREO ELECTRÓNICO</Text>
            <View style={[s.inputBox, emailFocused && s.inputBoxFocused]}>
              <View style={[s.inputIconWrap, emailFocused && s.inputIconWrapFocused]}>
                <Ionicons name="mail" size={16} color={emailFocused ? C.primary : C.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#3A5570"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </Animated.View>

          {/* ── Campo Contraseña ── */}
          <Animated.View style={[s.fieldWrap, { opacity: f3, transform: [{ translateY: f3.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
            <Text style={s.label}>CONTRASEÑA</Text>
            <View style={[s.inputBox, passFocused && s.inputBoxFocused]}>
              <View style={[s.inputIconWrap, passFocused && s.inputIconWrapFocused]}>
                <Ionicons name="lock-closed" size={16} color={passFocused ? C.primary : C.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor="#3A5570"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!verPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setVerPassword(!verPassword)} style={s.eyeBtn}>
                <Ionicons
                  name={verPassword ? 'eye' : 'eye-off'}
                  size={18}
                  color={passFocused ? C.primary : C.muted}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={recuperarContrasena} style={s.forgot}>
              <Text style={s.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Botón Login ── */}
          <Animated.View
            style={[
              s.fieldWrap,
              {
                opacity: f4,
                transform: [
                  { translateY: f4.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                  { scale: btnScale },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleLoginPress}
              disabled={loading}
              activeOpacity={0.85}
            >
              {/* Glow interno del botón */}
              <View style={s.btnGlow} />
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={s.btnContent}>
                  <Text style={s.btnText}>Iniciar sesión</Text>
                  <View style={s.btnArrow}>
                    <Ionicons name="arrow-forward" size={16} color={C.primary} />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divText}>¿No tienes cuenta?</Text>
              <View style={s.divLine} />
            </View>

            {/* Botón registro */}
            <TouchableOpacity
              style={s.btnGhost}
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('Register');
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="person-add-outline" size={17} color={C.primary} />
              <Text style={s.btnGhostText}>Crear cuenta nueva</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const RING_BASE = 90;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  /* ── Hero ── */
  hero: {
    height: HERO_H,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 10,
  },

  // Fondo radial (círculos grandes de color difuminado)
  radial1: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#0A3040',
    opacity: 0.7,
  },
  radial2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#0E4A5A',
    opacity: 0.4,
  },

  // Anillos de pulso
  ring: {
    position: 'absolute',
    width: RING_BASE * 2,
    height: RING_BASE * 2,
    borderRadius: RING_BASE,
    borderWidth: 1.5,
    borderColor: C.glow,
  },

  // Partículas
  particle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.primary,
  },
  p1: { width: 6, height: 6, left: W * 0.2, bottom: HERO_H * 0.15 },
  p2: { width: 4, height: 4, left: W * 0.55, bottom: HERO_H * 0.2 },
  p3: { width: 8, height: 8, left: W * 0.72, bottom: HERO_H * 0.1 },
  p4: { width: 5, height: 5, left: W * 0.38, bottom: HERO_H * 0.25 },

  // Logo
  logoOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1.5,
    borderColor: C.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A2535',
  },
  logoInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: C.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 16,
  },

  appName: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  tagline: {
    color: C.primary + 'AA',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /* ── Card ── */
  card: {
    flex: 1,
    backgroundColor: C.card,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 30,
  },
  cardTopBorder: {
    height: 3,
    marginHorizontal: 80,
    borderRadius: 2,
    backgroundColor: C.primary,
    opacity: 0.7,
    marginTop: 12,
  },
  cardScroll: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 32,
  },

  cardTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardSub: {
    color: C.muted,
    fontSize: 13,
    marginBottom: 6,
  },

  /* ── Campos ── */
  fieldWrap: { marginTop: 20 },
  label: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  inputBoxFocused: {
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIconWrap: {
    width: 46,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inputIconWrapFocused: {
    backgroundColor: C.primary + '18',
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    paddingVertical: 14,
    paddingRight: 14,
  },
  eyeBtn: { paddingHorizontal: 14 },

  forgot: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { color: C.primary, fontSize: 12, fontWeight: '600' },

  /* ── Botón principal ── */
  btn: {
    backgroundColor: C.primaryDim,
    borderRadius: 18,
    paddingVertical: 16,
    marginBottom: 4,
    overflow: 'hidden',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  btnDisabled: { opacity: 0.55 },
  btnGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Divider ── */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 20,
  },
  divLine: { flex: 1, height: 1, backgroundColor: '#132035' },
  divText: { color: '#3A5570', fontSize: 11, letterSpacing: 0.5 },

  /* ── Botón ghost (registro) ── */
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.primary + '55',
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: C.primary + '0A',
  },
  btnGhostText: {
    color: C.primary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
