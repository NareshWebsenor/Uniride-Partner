import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useHomeRideStore } from '@/store/homeRideStore';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';

export default function IdleRidePanel({ online }: { online: boolean }) {
  const colors = useThemeColor();
  const { t } = useAppTranslation();
  const goOnline = useHomeRideStore(s => s.goOnline);
  const goOffline = useHomeRideStore(s => s.goOffline);
  const stats = [
    { icon: 'wallet-outline', value: '$120', label: t('homeRide.earned') },
    { icon: 'car-outline', value: '5', label: t('homeRide.trips') },
    { icon: 'time-outline', value: t('homeRide.duration'), label: t('homeRide.onlineTime') },
  ] as const;
  return (
    <View style={styles.content} testID={online ? 'home-online' : 'home-offline'}>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          {t(online ? 'homeRide.onlineTitle' : 'homeRide.offlineTitle')}
        </Text>
        <Text variant="caption" tone="secondary">
          {t(online ? 'homeRide.onlineDescription' : 'homeRide.offlineDescription')}
        </Text>
      </View>
      <View style={styles.stats}>
        {stats.map(stat => (
          <View key={stat.icon} style={[styles.stat, { backgroundColor: colors.surfaceRaised }]}>
            <Ionicons name={stat.icon} size={wp('5.5%')} color={colors.primary} />
            <Text style={styles.value}>{stat.value}</Text>
            <Text variant="caption" tone="secondary" style={styles.center}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <Button
        title={t(online ? 'homeRide.goOffline' : 'homeRide.goOnline')}
        onPress={online ? goOffline : goOnline}
        style={{ backgroundColor: online ? colors.textSecondary : colors.driverAvailable }}
        textStyle={{ color: colors.onDriverAvailable }}
        icon={<Ionicons name="car-sport-outline" size={wp('5%')} color={colors.onDriverAvailable} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: hp('1.8%') },
  copy: { gap: hp('0.5%') },
  title: { fontSize: fSize(2.1), fontWeight: '700' },
  stats: { flexDirection: 'row', gap: wp('2.5%') },
  stat: { flex: 1, alignItems: 'center', padding: wp('2%'), borderRadius: wp('2%'), gap: hp('0.2%') },
  value: { fontSize: fSize(1.8), fontWeight: '600', textAlign: 'center' },
  center: { textAlign: 'center' },
});
