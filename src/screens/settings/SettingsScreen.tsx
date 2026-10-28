import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Container, Header, ScreenWrapper, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { PreferencesSection } from './components/PreferencesSection';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { t } = useAppTranslation();

  return (
    <ScreenWrapper scroll>
      <Header title={t('settings.title')} onBack={() => navigation.goBack()} />
      <Container>
        <Text tone="secondary">{t('settings.description')}</Text>
        <PreferencesSection />
      </Container>
    </ScreenWrapper>
  );
}
