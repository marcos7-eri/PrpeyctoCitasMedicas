import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

import DashboardPaciente from '../screens/paciente/DashboardPaciente';
import ReservarCitaPaciente from '../screens/paciente/ReservarCitaPaciente';
import MisCitasPaciente from '../screens/paciente/MisCitasPaciente';
import NotificacionesPaciente from '../screens/paciente/NotificacionesPaciente';
import PerfilPaciente from '../screens/paciente/PerfilPaciente';
import { COLORS } from '../styles/theme';

const Tab = createBottomTabNavigator();

function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={badge.container}>
      <Text style={badge.text}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  text: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
});

export default function PacienteNavigator() {
  const { user } = useAuth();
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from('notificaciones')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .eq('leido', false);
      setNoLeidas(count ?? 0);
    };
    fetchCount();

    const channel = supabase
      .channel('notif_badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${user.id}` },
        () => fetchCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.header },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: COLORS.header,
          borderTopColor: '#12395C',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#CBD5E1',
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Inicio: ['home', 'home-outline'],
            Reservar: ['calendar', 'calendar-outline'],
            MisCitas: ['list', 'list-outline'],
            Notificaciones: ['notifications', 'notifications-outline'],
            Perfil: ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          const iconName = focused ? active : inactive;

          if (route.name === 'Notificaciones') {
            return (
              <View>
                <Ionicons name={iconName as any} size={size} color={color} />
                <NotifBadge count={noLeidas} />
              </View>
            );
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardPaciente}
        options={{ title: 'Inicio', headerTitle: 'CitasMóvil' }}
      />
      <Tab.Screen
        name="Reservar"
        component={ReservarCitaPaciente}
        options={{ title: 'Reservar', headerTitle: 'Reservar cita' }}
      />
      <Tab.Screen
        name="MisCitas"
        component={MisCitasPaciente}
        options={{ title: 'Mis citas', headerTitle: 'Mis citas' }}
      />
      <Tab.Screen
        name="Notificaciones"
        component={NotificacionesPaciente}
        options={{ title: 'Avisos', headerTitle: 'Notificaciones' }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilPaciente}
        options={{ title: 'Perfil', headerTitle: 'Mi perfil' }}
      />
    </Tab.Navigator>
  );
}
