import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { BottomSheet, Button, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@/utils/fontIcon.utils';
import { hp, wp } from '@/utils/responsive.utils';
import { logger } from '@/utils/logger';

export default function HomeEmergencySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState(false);
  const call = async () => {
    if (opening) return;
    setOpening(true); setError(false);
    try { await Linking.openURL('tel:123'); }
    catch { setError(true); logger.warn('home.emergency.dialer_unavailable', { scope: 'home' }); }
    finally { setOpening(false); }
  };
  return (
    <BottomSheet title={t('homeRide.emergency')} visible={visible} onClose={onClose} edgeToEdge>
      {(['ambulance', 'police'] as const).map(kind => (
        <View key={kind} style={styles.row}>
          <Button title={t(`homeRide.${kind}`)} variant="secondary" disabled={opening}
            style={styles.button} accessibilityHint={t('homeRide.callEmergency')}
            onPress={() => { void call(); }}
            icon={<Ionicons name={kind === 'ambulance' ? 'medical' : 'shield-checkmark-outline'}
              size={wp('6%')} color={kind === 'ambulance' ? colors.error : colors.primary} />} />
          <Text variant="caption" tone="secondary">{t(`homeRide.${kind}Description`)}</Text>
        </View>
      ))}
      <Text variant="caption" tone="secondary">{t('homeRide.callEmergency')}</Text>
      {error && <Text tone="error">{t('menuSafety.callError')}</Text>}
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  row: { gap: hp('0.5%') },
  button: { justifyContent: 'flex-start' },
});
