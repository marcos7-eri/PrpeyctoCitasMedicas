import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// En Expo Go SDK 53+ el push remoto no está disponible — solo configuramos
// el handler (para notificaciones locales) si NO estamos en Expo Go.
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
      shouldShowBanner: true,
      shouldShowList:   true,
    }),
  });
}

export async function registrarPushToken(usuarioId: string): Promise<void> {
  try {
    // Push remoto eliminado de Expo Go desde SDK 53 — requiere development build
    if (isExpoGo) {
      console.log('[Push] Expo Go detectado — push remoto no disponible. Usa un development build.');
      return;
    }

    if (!Device.isDevice) {
      console.log('[Push] Simulador detectado — push tokens no disponibles.');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permisos de notificación denegados');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notificaciones médicas',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2DD4BF',
      });
    }

    // El projectId viene de app.json → extra.eas.projectId (se configura con EAS)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    if (!projectId) {
      console.warn('[Push] No se encontró projectId — configura EAS en app.json para habilitar push tokens.');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    console.log('[Push] Token obtenido:', token.substring(0, 40) + '...');

    const { error } = await supabase
      .from('perfiles')
      .update({ expo_push_token: token })
      .eq('id', usuarioId);

    if (error) {
      console.error('[Push] Error guardando token:', error.message);
    } else {
      console.log('[Push] Token guardado para usuario:', usuarioId);
    }
  } catch (e: any) {
    console.error('[Push] Excepción al registrar token:', e?.message ?? e);
  }
}

export function usarNotificaciones() {
  return {
    registrarToken: registrarPushToken,
  };
}
