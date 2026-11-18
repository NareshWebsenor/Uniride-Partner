import React, { useState } from 'react';
import { Keyboard, Linking, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from '@/components/ui';
import SwipeAction from '@/components/ui/SwipeAction';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppTranslation, type TranslationKey } from '@/hooks/useAppTranslation';
import { useHomeRideStore, type RideOffer } from '@/store/homeRideStore';
import { HOME_PICKUP } from '@/constants/homeMap';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';
import { logger } from '@/utils/logger';
import RideOtpFields from './RideOtpFields';

export default function ActiveRidePanel({ status, offer, showMessage }: {
  status: 'arriving' | 'otp' | 'started'; offer: RideOffer;
  showMessage: (title: TranslationKey, message: TranslationKey) => void;
}) {
  const colors = useThemeColor();
  const { t } = useAppTranslation();
  const arrive = useHomeRideStore(s => s.arrive);
  const startTrip = useHomeRideStore(s => s.startTrip);
  const [otp, setOtp] = useState('');
  const [opening, setOpening] = useState(false);
  const navigate = async () => {
    if (opening) return;
    setOpening(true);
    try {
      await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${HOME_PICKUP.latitude},${HOME_PICKUP.longitude}&travelmode=driving&dir_action=navigate`);
    } catch {
      logger.warn('home.navigation.unavailable', { scope: 'home' });
      showMessage('homeRide.navigate', 'homeRide.navigationError');
    } finally { setOpening(false); }
  };
  return (
    <View style={styles.content} testID={`home-${status}`}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />
      <View style={styles.rider}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceRaised }]}>
          <Text variant="caption">{offer.rider.split(' ').map(part => part[0]).slice(0, 2).join('')}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{offer.rider}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={wp('3%')} color={colors.warning} />
            <Text variant="caption" style={{ color: colors.warning }}>{offer.rating}</Text>
          </View>
        </View>
        <IconButton accessibilityLabel={t('homeRide.messageRider')}
          onPress={() => showMessage('homeRide.messageRider', 'menu.comingSoon')}
          style={styles.icon} icon={<Ionicons name="chatbubble" size={wp('5%')} color={colors.primary} />} />
        <IconButton accessibilityLabel={t('homeRide.callRider')}
          onPress={() => showMessage('homeRide.callRider', 'menu.comingSoon')}
          style={styles.icon} icon={<Ionicons name="call" size={wp('5%')} color={colors.primary} />} />
      </View>
      <View style={[styles.pickup, { backgroundColor: colors.surfaceRaised }]}>
        <Text variant="caption" tone="secondary">{t('homeRide.pickupAt')}</Text>
        <Text style={styles.address}>{offer.pickup}</Text>
        <View style={[styles.progress, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: status === 'arriving' ? '25%' : '100%' }]} />
        </View>
      </View>
      {status === 'otp' && <RideOtpFields onChange={setOtp} />}
      {status === 'started' ? (
        <View style={styles.started} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={wp('8%')} color={colors.confirmation} />
          <Text accessibilityRole="header" style={styles.name}>{t('homeRide.started')}</Text>
          <Text variant="caption" tone="secondary" style={styles.center}>{t('homeRide.startedDescription')}</Text>
        </View>
      ) : status === 'arriving' ? (
        <Button title={t('homeRide.navigate')} variant="secondary" loading={opening}
          onPress={() => { void navigate(); }}
          icon={<Ionicons name="navigate" size={wp('4%')} color={colors.textPrimary} />} />
      ) : null}
      {status !== 'started' && (
        <SwipeAction label={t(status === 'arriving' ? 'homeRide.arriving' : 'homeRide.startTrip')}
          accessibilityHint={t('homeRide.swipeHint')} resetKey={status}
          disabled={status === 'otp' && otp.length !== 4}
          onComplete={() => {
            if (status === 'arriving') arrive();
            else if (startTrip(otp)) Keyboard.dismiss();
          }} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: hp('1.5%') },
  handle: { height: hp('0.4%'), width: wp('10%'), borderRadius: 999, alignSelf: 'center', marginTop: -hp('0.5%') },
  rider: { flexDirection: 'row', alignItems: 'center', gap: wp('2%') },
  avatar: { width: wp('11%'), height: wp('11%'), borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  name: { fontSize: fSize(1.9), fontWeight: '600' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: wp('0.5%') },
  icon: { borderRadius: 999 },
  pickup: { padding: wp('3%'), borderRadius: wp('2%'), gap: hp('0.7%') },
  address: { fontSize: fSize(1.7), fontWeight: '600' },
  progress: { height: hp('0.5%'), borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  started: { alignItems: 'center', gap: hp('0.5%'), paddingVertical: hp('1%') },
  center: { textAlign: 'center' },
});
