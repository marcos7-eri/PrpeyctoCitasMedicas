import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
}

interface HistorialItem {
  id: number;
  fecha_registro: string;
  sintomas: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
  recetas: Receta[];
  doctores: {
    perfiles: { nombre_completo: string } | null;
    especialidades: { nombre: string } | null;
  } | null;
}

function Campo({ label, valor }: { label: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <View style={s.campo}>
      <Text style={s.campoLabel}>{label}</Text>
      <Text style={s.campoValor}>{valor}</Text>
    </View>
  );
}

function HistorialCard({ item, index }: { item: HistorialItem; index: number }) {
  const [expandido, setExpandido] = useState(false);
  const anim    = useRef(new Animated.Value(0)).current;
  const entryOp = useRef(new Animated.Value(0)).current;
  const entryY  = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(entryY,  { toValue: 0, tension: 70, friction: 12, delay: Math.min(index * 80, 400), useNativeDriver: true }),
      Animated.timing(entryOp, { toValue: 1, duration: 300, delay: Math.min(index * 80, 400), useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleExpand = () => {
    setExpandido(v => !v);
    Animated.spring(anim, {
      toValue: expandido ? 0 : 1,
      tension: 80, friction: 12, useNativeDriver: false,
    }).start();
  };

  const doctor    = item.doctores?.perfiles?.nombre_completo  ?? 'Doctor';
  const especialidad = item.doctores?.especialidades?.nombre  ?? '';
  const fecha     = new Date(item.fecha_registro).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <Animated.View style={[s.cardWrap, { opacity: entryOp, transform: [{ translateY: entryY }] }]}>
      <TouchableOpacity style={s.card} onPress={toggleExpand} activeOpacity={0.8}>
        {/* Barra lateral teal */}
        <View style={s.cardBar} />

        <View style={{ flex: 1 }}>
          {/* Cabecera */}
          <View style={s.cardTop}>
            <View style={s.doctorAvatar}>
              <Text style={s.doctorAvatarTxt}>{doctor.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.doctorNombre}>{doctor}</Text>
              {especialidad ? <Text style={s.doctorEsp}>{especialidad}</Text> : null}
            </View>
            <View style={s.fechaChip}>
              <Ionicons name="calendar-outline" size={11} color={C.primary} />
              <Text style={s.fechaTxt}>{fecha}</Text>
            </View>
          </View>

          {/* Diagnóstico siempre visible */}
          {item.diagnostico ? (
            <View style={s.diagBadge}>
              <Ionicons name="checkmark-circle-outline" size={14} color={C.success} />
              <Text style={s.diagTxt} numberOfLines={expandido ? undefined : 2}>{item.diagnostico}</Text>
            </View>
          ) : (
            <Text style={s.sinDiag}>Sin diagnóstico registrado</Text>
          )}

          {/* Expandido */}
          {expandido && (
            <View style={s.expandido}>
              <Campo label="Síntomas"      valor={item.sintomas}     />
              <Campo label="Tratamiento"   valor={item.tratamiento}  />
              <Campo label="Observaciones" valor={item.observaciones}/>

              {item.recetas?.length > 0 && (
                <View style={s.recetasBox}>
                  <View style={s.recetasHeader}>
                    <Ionicons name="medical-outline" size={14} color={C.accent} />
                    <Text style={s.recetasTitle}>Recetas médicas</Text>
                  </View>
                  {item.recetas.map(r => (
                    <View key={r.id} style={s.recetaRow}>
                      <Text style={s.recetaMed}>💊 {r.medicamento}</Text>
                      <Text style={s.recetaDet}>
                        {[r.dosis, r.frecuencia, r.duracion].filter(Boolean).join(' · ') || '—'}
                      </Text>
                      {r.instrucciones ? (
                        <Text style={s.recetaInstruc}>{r.instrucciones}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Pie del card */}
          <View style={s.cardFoot}>
            {item.recetas?.length > 0 && (
              <View style={s.recetaBadge}>
                <Ionicons name="medical-outline" size={12} color={C.accent} />
                <Text style={s.recetaBadgeTxt}>{item.recetas.length} receta{item.recetas.length !== 1 ? 's' : ''}</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <Text style={s.verMasTxt}>{expandido ? 'Ver menos ↑' : 'Ver detalle ↓'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HistorialPacienteScreen() {
  const { user }              = useAuth();
  const [historial,   setHistorial]   = useState<HistorialItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [exportando,  setExportando]  = useState(false);
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
      // Resolver el pacientes.id real (distinto de auth user.id)
      const { data: pac, error: errPac } = await supabase
        .from('pacientes').select('id').eq('perfil_id', user.id).maybeSingle();

      if (!pac) { setLoading(false); return; }

      // Paso 1: historiales
      const { data: hData, error: errH } = await supabase
        .from('historial_medico')
        .select('id, fecha_registro, sintomas, diagnostico, tratamiento, observaciones, doctores(perfiles(nombre_completo), especialidades(nombre))')
        .eq('paciente_id', pac.id)
        .order('fecha_registro', { ascending: false });

      if (!hData || hData.length === 0) { setLoading(false); return; }

      // Paso 2: recetas separadas para evitar problemas de join con RLS
      const ids = hData.map((h: any) => h.id);
      const { data: rData, error: errR } = await supabase
        .from('recetas')
        .select('id, historial_id, medicamento, dosis, frecuencia, duracion, instrucciones')
        .in('historial_id', ids);

      // Combinar
      const combinado = hData.map((h: any) => ({
        ...h,
        recetas: (rData ?? []).filter((r: any) => r.historial_id === h.id),
      }));

      setHistorial(combinado as any[]);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { cargar(); }, [cargar]);

  const onRefresh = async () => { setRefreshing(true); await cargar(); setRefreshing(false); };

  const exportarPDF = async () => {
    if (historial.length === 0 || exportando) return;
    setExportando(true);
    try {
      const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
      const css = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #1a1a2e; padding: 28px 32px; }
        .top { border-bottom: 3px solid #2DD4BF; padding-bottom: 16px; margin-bottom: 22px; }
        .top h1 { font-size: 24px; color: #0a6b5e; letter-spacing: -0.5px; }
        .top .meta { font-size: 12px; color: #666; margin-top: 5px; }
        .entry { border: 1px solid #d0e0ee; border-radius: 10px; padding: 18px 20px; margin-bottom: 22px; }
        .entry-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
        .dr-name { font-size: 15px; font-weight: bold; color: #0a6b5e; }
        .dr-esp  { font-size: 12px; color: #777; margin-top: 3px; }
        .fecha   { font-size: 12px; color: #888; background: #f0fafa; border-radius: 6px; padding: 4px 10px; }
        .campo { margin-bottom: 12px; }
        .campo-lbl  { font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 3px; }
        .campo-val  { font-size: 13px; color: #2a2a3e; line-height: 1.5; }
        .recetas-box { margin-top: 14px; background: #f5f0ff; border-radius: 8px; padding: 14px; border-left: 4px solid #6366F1; }
        .recetas-title { font-size: 11px; font-weight: bold; color: #6366F1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .rec-item { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e0d8f8; }
        .rec-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .rec-med  { font-size: 13px; font-weight: bold; color: #2a2a3e; }
        .rec-det  { font-size: 12px; color: #666; margin-top: 2px; }
        .rec-inst { font-size: 12px; color: #888; font-style: italic; margin-top: 2px; }
        .footer   { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 11px; color: #aaa; text-align: center; }
      `;

      const entries = historial.map(item => {
        const drNombre = item.doctores?.perfiles?.nombre_completo ?? 'Doctor';
        const esp      = item.doctores?.especialidades?.nombre ?? '';
        const fecha    = new Date(item.fecha_registro).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

        const campos = [
          item.diagnostico  ? `<div class="campo"><div class="campo-lbl">Diagnóstico</div><div class="campo-val">${item.diagnostico}</div></div>` : '',
          item.sintomas     ? `<div class="campo"><div class="campo-lbl">Síntomas</div><div class="campo-val">${item.sintomas}</div></div>` : '',
          item.tratamiento  ? `<div class="campo"><div class="campo-lbl">Tratamiento</div><div class="campo-val">${item.tratamiento}</div></div>` : '',
          item.observaciones? `<div class="campo"><div class="campo-lbl">Observaciones</div><div class="campo-val">${item.observaciones}</div></div>` : '',
        ].join('');

        const recetasHTML = item.recetas?.length > 0 ? `
          <div class="recetas-box">
            <div class="recetas-title">Recetas médicas (${item.recetas.length})</div>
            ${item.recetas.map(r => `
              <div class="rec-item">
                <div class="rec-med">💊 ${r.medicamento}</div>
                ${[r.dosis, r.frecuencia, r.duracion].filter(Boolean).length > 0
                  ? `<div class="rec-det">${[r.dosis, r.frecuencia, r.duracion].filter(Boolean).join(' · ')}</div>`
                  : ''}
                ${r.instrucciones ? `<div class="rec-inst">${r.instrucciones}</div>` : ''}
              </div>
            `).join('')}
          </div>` : '';

        return `
          <div class="entry">
            <div class="entry-head">
              <div>
                <div class="dr-name">Dr. ${drNombre}</div>
                ${esp ? `<div class="dr-esp">${esp}</div>` : ''}
              </div>
              <div class="fecha">${fecha}</div>
            </div>
            ${campos}
            ${recetasHTML}
          </div>`;
      }).join('');

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
        <div class="top">
          <h1>Historial Médico</h1>
          <div class="meta">Generado el ${fechaHoy} &nbsp;·&nbsp; ${historial.length} registro${historial.length !== 1 ? 's' : ''}</div>
        </div>
        ${entries}
        <div class="footer">Documento generado por CitasMóvil — Solo para uso informativo</div>
      </body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Historial médico en PDF', UTI: '.pdf' });
    } catch (e) {
      console.error('[PDF] error:', e);
    } finally {
      setExportando(false);
    }
  };

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
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Mi historial médico</Text>
          <View style={s.headerPill}>
            <Ionicons name="document-text-outline" size={13} color={C.primary} />
            <Text style={s.headerPillTxt}>{historial.length} registro{historial.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        {historial.length > 0 && (
          <TouchableOpacity style={[s.pdfBtn, exportando && { opacity: 0.6 }]} onPress={exportarPDF} disabled={exportando}>
            {exportando
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Ionicons name="share-outline" size={16} color="#FFF" />
            }
            <Text style={s.pdfBtnTxt}>{exportando ? 'PDF...' : 'PDF'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {historial.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyOuter}>
            <View style={s.emptyInner}>
              <Ionicons name="document-text-outline" size={40} color={C.light} />
            </View>
          </View>
          <Text style={s.emptyTitle}>Sin historial clínico</Text>
          <Text style={s.emptySub}>Tu médico registrará tu historial después de cada consulta. Aparecerá aquí.</Text>
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={s.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          renderItem={({ item, index }) => <HistorialCard item={item} index={index} />}
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  headerTitle: { color: C.white, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  headerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.primary + '14', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 6,
    borderWidth: 1, borderColor: C.primary + '30', alignSelf: 'flex-start',
  },
  headerPillTxt: { color: C.primary, fontSize: 12, fontWeight: '700' },

  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.accent, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    alignSelf: 'center',
  },
  pdfBtnTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  lista: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  cardWrap: { marginBottom: 12 },
  card: {
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', overflow: 'hidden',
  },
  cardBar:  { width: 4, backgroundColor: C.primary },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 10 },
  doctorAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primary + '20', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.primary + '40',
  },
  doctorAvatarTxt: { color: C.primary, fontSize: 18, fontWeight: '800' },
  doctorNombre: { color: C.white, fontSize: 14, fontWeight: '700' },
  doctorEsp:    { color: C.light, fontSize: 12, marginTop: 2 },

  fechaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primary + '12', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  fechaTxt: { color: C.primary, fontSize: 10, fontWeight: '600' },

  diagBadge: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: C.success + '10', borderRadius: 10,
    padding: 10, marginHorizontal: 14, marginBottom: 10,
  },
  diagTxt:  { color: C.white, fontSize: 13, flex: 1, lineHeight: 19 },
  sinDiag:  { color: C.light, fontSize: 13, marginHorizontal: 14, marginBottom: 10, fontStyle: 'italic' },

  expandido: { paddingHorizontal: 14, paddingBottom: 10, gap: 10 },

  campo:       { gap: 4 },
  campoLabel:  { color: C.light, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  campoValor:  { color: C.muted, fontSize: 13, lineHeight: 19 },

  recetasBox: {
    backgroundColor: C.accent + '0D', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: C.accent + '25',
    gap: 10,
  },
  recetasHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recetasTitle:  { color: C.accent, fontSize: 12, fontWeight: '700' },
  recetaRow:     { gap: 3 },
  recetaMed:     { color: C.white, fontSize: 13, fontWeight: '600' },
  recetaDet:     { color: C.muted, fontSize: 12 },
  recetaInstruc: { color: C.light, fontSize: 12, fontStyle: 'italic' },

  cardFoot: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 12, gap: 8,
  },
  recetaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.accent + '14', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  recetaBadgeTxt: { color: C.accent, fontSize: 11, fontWeight: '600' },
  verMasTxt:      { color: C.primary, fontSize: 12, fontWeight: '600' },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
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
  emptySub:   { color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
