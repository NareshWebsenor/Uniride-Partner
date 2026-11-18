import { useRef } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useDriverOnboardingStore } from '@/store/driverOnboardingStore';
import { canFinish } from '@/utils/driverOnboarding';
import { logger } from '@/utils/logger';

export function useOnboardingCompletion(onFinished: () => void) {
  const { t } = useAppTranslation();
  const pending = useRef(false);
  return () => {
    if (pending.current || !canFinish(useDriverOnboardingStore.getState()))
      return;
    pending.current = true;
    Keyboard.dismiss();
    Alert.alert(
      t('driverOnboarding.previewTitle'),
      t('driverOnboarding.previewMessage'),
      [
        {
          text: t('ui.cancel'),
          style: 'cancel',
          onPress: () => {
            pending.current = false;
          },
        },
        {
          text: t('driverOnboarding.finish'),
          onPress: () => {
            if (!useDriverOnboardingStore.getState().completePreview()) {
              pending.current = false;
              return;
            }
            logger.info('driver_onboarding.preview_completed', { scope: 'ui' });
            onFinished();
          },
        },
      ],
      { cancelable: false },
    );
  };
}
