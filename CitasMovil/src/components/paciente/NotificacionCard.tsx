import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notificacion } from '../../types';
import { COLORS } from '../../styles/theme';
import { formatTimeAgo } from '../../utils/fechas';

const TIPO_ICONS: Record<string, { icon: string; color: string }> = {
  confirmacion: { icon: 'checkmark-circle', color: '#10B981' },
  recordatorio: { icon: 'alarm', color: '#3B82F6' },
  cancelacion: { icon: 'close-circle', color: '#EF4444' },
  cambio: { icon: 'swap-horizontal', color: '#F59E0B' },
  default: { icon: 'notifications', color: '#319795' },
};

interface Props {
  notificacion: Notificacion;
  onPress: (notificacion: Notificacion) => void;
}

export default function NotificacionCard({ notificacion, onPress }: Props) {
  const tipoInfo = TIPO_ICONS[notificacion.tipo] || TIPO_ICONS.default;

  return (
    <TouchableOpacity
      style={[styles.card, notificacion.leido && styles.cardLeida]}
      onPress={() => onPress(notificacion)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: tipoInfo.color + '22' }]}>
        <Ionicons name={tipoInfo.icon as any} size={22} color={tipoInfo.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.titulo} numberOfLines={1}>{notificacion.titulo}</Text>
          {!notificacion.leido && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.mensaje} numberOfLines={2}>{notificacion.mensaje}</Text>
        <Text style={styles.tiempo}>{formatTimeAgo(notificacion.fecha_envio)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    alignItems: 'flex-start',
  },
  cardLeida: {
    opacity: 0.65,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titulo: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  mensaje: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  tiempo: {
    color: COLORS.light,
    fontSize: 11,
  },
});
