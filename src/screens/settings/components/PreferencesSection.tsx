import React from 'react';
import { Alert, Card, Heading, RadioButton, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useLanguage } from '@/hooks/useLanguage';
import { supportedLanguages } from '@/localizations';
import { useThemeStore } from '@/store/themeStore';

const themeModes = ['light', 'dark', 'system'] as const;

export function PreferencesSection() {
  const { t } = useAppTranslation();
  const { language, changeLanguage, error } = useLanguage();
  const preference = useThemeStore(state => state.preference);
  const setPreference = useThemeStore(state => state.setPreference);
  const themeSaveFailed = useThemeStore(state => state.persistenceError);

  return (
    <>
      <Card>
        <Heading level={2}>{t('settings.appearance')}</Heading>
        {themeModes.map(mode => (
          <RadioButton
            key={mode}
            value={preference === mode}
            onValueChange={() => setPreference(mode)}
            label={t(`settings.${mode}`)}
          />
        ))}
        {themeSaveFailed && (
          <Alert tone="error" message={t('settings.themeSaveError')} />
        )}
      </Card>
      <Card>
        <Heading level={2}>{t('settings.language')}</Heading>
        {supportedLanguages.map(code => (
          <RadioButton
            key={code}
            value={language === code}
            onValueChange={() => changeLanguage(code)}
            label={t(`language.${code}`)}
          />
        ))}
        {error && <Alert tone="error" message={t(error)} />}
        <Text variant="caption" tone="secondary">
          {t('settings.restored')}
        </Text>
      </Card>
    </>
  );
}
