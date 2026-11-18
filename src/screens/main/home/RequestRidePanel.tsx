import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import RideRequestCountdown from '@/components/ui/RideRequestCountdown';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useHomeRideStore, type RideOffer } from '@/store/homeRideStore';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';

export default function RequestRidePanel({ offer }: { offer: RideOffer }) {
  const colors = useThemeColor();
  const { t, i18n } = useAppTranslation();
  const accept = useHomeRideStore(s => s.accept);
  const decline = useHomeRideStore(s => s.decline);
  const tick = useHomeRideStore(s => s.tick);
  return (
    <View style={styles.content} testID="home-request">
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.primary }]}>{t('homeRide.newRequest')}</Text>
          <Text style={styles.fare}>{new Intl.NumberFormat(i18n.language, {
            style: 'currency', currency: offer.currency, maximumFractionDigits: 0,
          }).format(offer.fare)}</Text>
        </View>
        <RideRequestCountdown key={offer.id} expiresAt={offer.expiresAt} durationMs={offer.durationMs}
          onExpire={tick} accessibilityLabel={t('homeRide.timeRemaining')} />
      </View>
      <View style={[styles.locations, { backgroundColor: colors.surfaceRaised }]}>
        <View style={styles.location}>
          <Ionicons name="locate-outline" size={wp('5%')} color={colors.error} />
          <Text style={styles.address}>{t('homeRide.pickupDistance', { place: offer.pickup })}</Text>
        </View>
        <View style={styles.location}>
          <Ionicons name="location" size={wp('5%')} color={colors.driverAvailable} />
          <Text style={styles.address}>{t('homeRide.tripDistance', { place: offer.dropoff })}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button title={t('homeRide.decline')} variant="outline" onPress={decline} style={styles.decline} />
        <Button title={t('homeRide.accept')} onPress={accept}
          style={[styles.accept, { backgroundColor: colors.driverAvailable }]}
          textStyle={{ color: colors.onDriverAvailable }} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: hp('2%') },
  heading: { flexDirection: 'row', alignItems: 'center', gap: wp('3%') },
  copy: { flex: 1 },
  title: { fontSize: fSize(2), fontWeight: '700' },
  fare: { fontSize: fSize(4.5), fontWeight: '800' },
  locations: { borderRadius: wp('4%'), padding: wp('3%'), gap: hp('1.5%') },
  location: { flexDirection: 'row', alignItems: 'center', gap: wp('2%') },
  address: { flex: 1, fontSize: fSize(1.8) },
  actions: { flexDirection: 'row', gap: wp('3%') },
  decline: { flex: 1 },
  accept: { flex: 2 },
});
