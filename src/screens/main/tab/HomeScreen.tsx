import React from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Button, Container, Heading, ScreenWrapper } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { TRootStack } from '@/interface/navigation.type';

export default function HomeScreen() {
  const { t } = useAppTranslation();
  const navigation = useNavigation<NavigationProp<TRootStack>>();

  return (
    <ScreenWrapper scroll>
      <Container>
        <Heading>{t('tabs.home')}</Heading>
        <Button
          title={t('settings.title')}
          onPress={() => navigation.navigate('SettingsScreen')}
        />
      </Container>
    </ScreenWrapper>
  );
}
