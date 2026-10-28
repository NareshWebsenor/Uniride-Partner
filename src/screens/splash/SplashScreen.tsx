import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, SafeAreaWrapper, Text } from '@/components/ui';
import BrandLogo from '@/components/layouts/auth/BrandLogo';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { TSplashStackProps } from '@/interface/navigation.type';
import { readStartupDestination } from '@/service/startup';
import { spacing } from '@/theme/tokens';
import { logger } from '@/utils/logger';

export function SplashContent({
  error,
  onRetry,
}: {
  error?: boolean;
  onRetry?: () => void;
}) {
  const colors = useThemeColor();
  const { t } = useAppTranslation();
  return (
    <SafeAreaWrapper
      statusBarColor={colors.surface}
      style={{ backgroundColor: colors.surface }}
    >
      <View style={styles.center} testID="splash-screen">
        <BrandLogo />
      </View>
      {error && (
        <View style={styles.recovery}>
          <Text tone="error" accessibilityRole="alert">
            {t('ride.startupError')}
          </Text>
          <Button variant="brand" title={t('ui.retry')} onPress={onRetry} />
        </View>
      )}
    </SafeAreaWrapper>
  );
}

export default function SplashScreen({
  navigation,
}: {
  navigation: Pick<TSplashStackProps['navigation'], 'reset'>;
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    // Preserve the existing branded transition before entering the starter Home.
    const timer = setTimeout(() => {
      readStartupDestination()
        .then(destination => {
          if (active) {
            logger.debug('startup.destination_resolved', {
              scope: destination.name,
            });
            navigation.reset({ index: 0, routes: [destination] });
          }
        })
        .catch(() => {
          if (active) {
            setFailed(true);
            logger.warn('startup.restore_failed', { scope: 'entry' });
          }
        });
    }, 700);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [attempt, navigation]);
  return (
    <SplashContent
      error={failed}
      onRetry={() => setAttempt(value => value + 1)}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  recovery: { padding: spacing.lg, gap: spacing.md },
});
