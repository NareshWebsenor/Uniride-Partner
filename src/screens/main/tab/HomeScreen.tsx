import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '@/components/background/AppBackground';
import { IconButton, Modal, Text } from '@/components/ui';
import { useAppTranslation, type TranslationKey } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useHomeRideLifecycle } from '@/hooks/useHomeRideLifecycle';
import { useHomeRideStore } from '@/store/homeRideStore';
import type { TRootStack } from '@/interface/navigation.type';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';
import { statusBarStyleForColor } from '@/utils/theme.utils';
import HomeMap from '../home/HomeMap';
import IdleRidePanel from '../home/IdleRidePanel';
import RequestRidePanel from '../home/RequestRidePanel';
import ActiveRidePanel from '../home/ActiveRidePanel';
import HomeEmergencySheet from '../home/HomeEmergencySheet';

export default function HomeScreen() {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<TRootStack>>();
  const ride = useHomeRideStore(s => s.ride);
  const [emergency, setEmergency] = useState(false);
  const [message, setMessage] = useState<{ title: TranslationKey; body: TranslationKey } | null>(null);
  useHomeRideLifecycle();
  const online = ride.status !== 'offline';
  const hasRide = ride.status !== 'offline' && ride.status !== 'online';
  return (
    <AppBackground backgroundColor={colors.surfaceRaised} extendUnderStatusBar
      statusBarStyle={statusBarStyleForColor(colors.surfaceRaised)}>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <View style={styles.container} testID="home-screen">
          <View style={styles.map}>
            <HomeMap showRoute={hasRide} />
            <View style={[styles.toolbar, { top: top + hp('1%') }]} pointerEvents="box-none">
              <View style={[styles.status, { backgroundColor: online ? colors.driverAvailable : colors.surface }]}>
                <View style={[styles.dot, { backgroundColor: online ? colors.onDriverAvailable : colors.border }]} />
                <Text style={[styles.statusText, { color: online ? colors.onDriverAvailable : colors.textPrimary }]}>
                  {t(online ? 'homeRide.online' : 'homeRide.offline')}
                </Text>
              </View>
              <View style={styles.topActions}>
                <IconButton accessibilityLabel={t('homeRide.emergency')} onPress={() => setEmergency(true)}
                  style={[styles.round, { backgroundColor: colors.surface }]}
                  icon={<Ionicons name="medical" size={wp('5.5%')} color={colors.error} />} />
                <IconButton accessibilityLabel={t('profile.notifications')}
                  onPress={() => navigation.navigate('NotificationsScreen')}
                  style={[styles.round, { backgroundColor: colors.surface }]}
                  icon={<Ionicons name="notifications" size={wp('5.5%')} color={colors.textPrimary} />} />
              </View>
            </View>
          </View>
          <ScrollView style={[styles.panel, { backgroundColor: colors.surface }]}
            contentContainerStyle={styles.panelContent} keyboardShouldPersistTaps="handled" bounces={false}>
            {ride.status === 'offline' || ride.status === 'online' ? <IdleRidePanel online={online} />
              : ride.status === 'request' ? <RequestRidePanel offer={ride.offer} />
              : <ActiveRidePanel status={ride.status} offer={ride.offer}
                showMessage={(title, body) => setMessage({ title, body })} />}
            <Text variant="caption" tone="secondary" style={styles.demo}>{t('homeRide.demo')}</Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <HomeEmergencySheet visible={emergency} onClose={() => setEmergency(false)} />
      <Modal visible={message !== null} title={message ? t(message.title) : undefined} onClose={() => setMessage(null)}>
        <Text>{message ? t(message.body) : ''}</Text>
      </Modal>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, minHeight: hp('20%') },
  toolbar: { position: 'absolute', left: wp('5%'), right: wp('5%'), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: wp('2%') },
  status: { flexDirection: 'row', alignItems: 'center', gap: wp('1.5%'), borderRadius: 999, paddingHorizontal: wp('3%'), paddingVertical: hp('0.7%'), maxWidth: '50%' },
  dot: { width: wp('2%'), height: wp('2%'), borderRadius: 999 },
  statusText: { fontSize: fSize(1.7), fontWeight: '600', flexShrink: 1 },
  topActions: { flexDirection: 'row', gap: wp('2%') },
  round: { borderRadius: 999 },
  panel: { flexGrow: 0, maxHeight: '64%', borderTopLeftRadius: wp('6%'), borderTopRightRadius: wp('6%'), marginTop: -hp('1%') },
  panelContent: { paddingHorizontal: wp('5%'), paddingTop: hp('2%'), paddingBottom: hp('1%') },
  demo: { textAlign: 'center', marginTop: hp('0.7%'), fontSize: fSize(1.2) },
});
