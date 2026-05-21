import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';

interface Props {
  icon: string;
  titulo: string;
  valor: string;
  color?: string;
}

export default function CardInfo({ icon, titulo, valor, color = COLORS.primary }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    color: COLORS.light,
    fontSize: 11,
    textAlign: 'center',
  },
  valor: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
