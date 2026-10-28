import React, { useState } from 'react';
import { Alert, Card, Heading, Switch, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useBiometricAppLock } from '@/context/BiometricAppLockContext';
import {
  type BiometricFailure,
  disableBiometricAppLock,
  enableBiometricAppLock,
} from '@/service/biometricAppLock';

export function BiometricAppLockPreference() {
  const { t } = useAppTranslation();
  const { enabled, updateEnabled } = useBiometricAppLock();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<BiometricFailure | null>(null);

  const onValueChange = async (nextEnabled: boolean) => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = nextEnabled
      ? await enableBiometricAppLock({
          title: t('appLock.promptTitle'),
          subtitle: t('appLock.promptSubtitle'),
          cancel: t('appLock.promptCancel'),
        })
      : await disableBiometricAppLock();
    if (result.success) {
      updateEnabled(nextEnabled);
    } else {
      setError(result.reason);
    }
    setBusy(false);
  };

  return (
    <Card>
      <Heading level={2}>{t('appLock.settingsTitle')}</Heading>
      <Text tone="secondary">{t('appLock.settingsDescription')}</Text>
      <Switch
        label={t('appLock.settingsToggle')}
        accessibilityLabel={t('appLock.settingsToggle')}
        value={enabled}
        onValueChange={onValueChange}
        disabled={busy}
      />
      {busy ? <Text tone="secondary">{t('appLock.authenticating')}</Text> : null}
      {error ? (
        <Alert tone="error" message={t(`appLock.errors.${error}`)} />
      ) : null}
    </Card>
  );
}
