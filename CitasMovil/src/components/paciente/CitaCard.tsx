import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cita } from '../../types';
import { COLORS, STATUS_COLORS, STATUS_LABELS } from '../../styles/theme';
import { formatFecha, formatHora } from '../../utils/fechas';

interface CitaCardProps {
  cita: Cita;
  onCancelar?: (cita: Cita) => void;
  onReagendar?: (cita: Cita) => void;
}

export default function CitaCard({ cita, onCancelar, onReagendar }: CitaCardProps) {
  const statusColor = STATUS_COLORS[cita.estado] || COLORS.light;
  const statusLabel = STATUS_LABELS[cita.estado] || cita.estado;
  const doctorName  = cita.doctores?.perfiles?.nombre_completo || 'Doctor';
  const especialidad = cita.doctores?.especialidades?.nombre || '';

  const hoy = new Date().toISOString().split('T')[0];
  const puedeAccion = (cita.estado === 'pendiente' || cita.estado === 'confirmada') && cita.fecha >= hoy;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.fecha}>{formatFecha(cita.fecha)}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.doctorName}>{doctorName}</Text>
        </View>
        {especialidad ? (
          <View style={styles.row}>
            <Ionicons name="medical-outline" size={16} color={COLORS.light} />
            <Text style={styles.especialidad}>{especialidad}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Ionicons name="time-outline" size={16} color={COLORS.light} />
          <Text style={styles.hora}>{formatHora(cita.hora_inicio)}</Text>
        </View>
        {cita.motivo ? (
          <View style={styles.row}>
            <Ionicons name="clipboard-outline" size={16} color={COLORS.light} />
            <Text style={styles.motivo} numberOfLines={2}>{cita.motivo}</Text>
          </View>
        ) : null}
        {cita.motivo_cancelacion ? (
          <View style={styles.motivoCancelRow}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.error} />
            <Text style={styles.motivoCancelTxt} numberOfLines={2}>{cita.motivo_cancelacion}</Text>
          </View>
        ) : null}
      </View>

      {puedeAccion && (onReagendar || onCancelar) && (
        <View style={styles.acciones}>
          {onReagendar && (
            <TouchableOpacity style={styles.reagendarBtn} onPress={() => onReagendar(cita)}>
              <Ionicons name="calendar-outline" size={15} color={COLORS.primary} />
              <Text style={styles.reagendarText}>Reagendar</Text>
            </TouchableOpacity>
          )}
          {onCancelar && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancelar(cita)}>
              <Ionicons name="close-circle-outline" size={15} color={COLORS.error} />
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  fecha: { color: COLORS.muted, fontSize: 13 },

  body: { gap: 8 },
  row:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doctorName:  { color: COLORS.white, fontSize: 16, fontWeight: '600', flex: 1 },
  especialidad:{ color: COLORS.light, fontSize: 13, flex: 1 },
  hora:        { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  motivo:      { color: COLORS.muted, fontSize: 13, flex: 1 },

  motivoCancelRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: COLORS.error + '10', borderRadius: 8, padding: 8, marginTop: 4,
  },
  motivoCancelTxt: { color: COLORS.error, fontSize: 12, flex: 1 },

  /* Acciones */
  acciones: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reagendarBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: COLORS.primary + '14',
    borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  reagendarText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  cancelBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: COLORS.error + '10',
    borderRadius: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORS.error + '30',
  },
  cancelText: { color: COLORS.error, fontSize: 13, fontWeight: '600' },
});
