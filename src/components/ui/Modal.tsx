import React from 'react';
import {
  Modal as NativeModal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { hp, wp } from '@/utils/responsive.utils';
import { Ionicons } from '@/utils/fontIcon.utils';
import { Button, IconButton } from './Button';
import { Heading, Text } from './Text';

export type ModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  placement?: 'center' | 'bottom';
  dismissible?: boolean;
};

export function Modal({
  visible,
  onClose,
  title,
  children,
  placement = 'center',
  dismissible = true,
}: ModalProps) {
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const safeBottomPadding =
    placement === 'bottom' ? 0 : insets.bottom + hp('2%');
  return (
    <NativeModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissible ? onClose : undefined}
    >
      <View
        style={[
          styles.overlay,
          placement === 'bottom' && styles.bottomOverlay,
          {
            backgroundColor: colors.overlay,
            paddingTop: insets.top + hp('2%'),
            paddingBottom: safeBottomPadding,
          },
        ]}
      >
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          style={StyleSheet.absoluteFill}
          onPress={dismissible ? onClose : undefined}
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={dismissible ? onClose : undefined}
          style={[
            styles.panel,
            {
              backgroundColor: colors.surface,
              paddingBottom:
                hp('2%') + (placement === 'bottom' ? insets.bottom : 0),
            },
          ]}
        >
          <View style={styles.header}>
            {title ? (
              <Heading level={3} style={styles.title}>
                {title}
              </Heading>
            ) : (
              <View style={styles.title} />
            )}
            {dismissible ? (
              <IconButton
                accessibilityLabel={t('ui.close')}
                onPress={onClose}
                icon={
                  <Ionicons
                    name="close"
                    size={wp('6%')}
                    color={colors.textPrimary}
                  />
                }
              />
            ) : null}
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </NativeModal>
  );
}

export function BottomSheet(props: Omit<ModalProps, 'placement'>) {
  return <Modal {...props} placement="bottom" />;
}

export function ConfirmationDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      dismissible={!loading}
    >
      <Text>{message}</Text>
      <Button
        title={confirmLabel ?? t('ui.confirm')}
        onPress={onConfirm}
        loading={loading}
      />
      <Button
        title={cancelLabel ?? t('ui.cancel')}
        onPress={onClose}
        variant="outline"
        disabled={loading}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOverlay: { justifyContent: 'flex-end' },
  panel: {
    maxHeight: '90%',
    width: '100%',
    maxWidth: 720,
    padding: wp('4%'),
    borderRadius: wp('5%'),
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('1%'),
  },
  title: { flex: 1 },
  content: { gap: wp('4%') },
});
