import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { radii, sizes, spacing } from '@/theme/tokens';
import { Ionicons } from '@/utils/fontIcon.utils';
import { IconButton } from './Button';
import { Heading, Text } from './Text';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';
export type AlertProps = {
  title?: string;
  message: string;
  tone?: AlertTone;
  onDismiss?: () => void;
};

export function Alert({
  title,
  message,
  tone = 'info',
  onDismiss,
}: AlertProps) {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const borderColor = tone === 'info' ? colors.primary : colors[tone];
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.alert,
        { backgroundColor: colors.surfaceRaised, borderColor },
      ]}
    >
      <View style={styles.message}>
        {title ? <Heading level={3}>{title}</Heading> : null}
        <Text>{message}</Text>
      </View>
      {onDismiss ? (
        <IconButton
          accessibilityLabel={t('ui.dismiss')}
          onPress={onDismiss}
          icon={
            <Ionicons
              name="close"
              size={sizes.icon}
              color={colors.textPrimary}
            />
          }
        />
      ) : null}
    </View>
  );
}

export type ToastMessage =
  | string
  | { key: string; values?: Record<string, string | number> };
type ToastValue = {
  show: (message: ToastMessage, tone?: AlertTone, duration?: number) => void;
  hide: () => void;
};
const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: ToastMessage;
    tone: AlertTone;
    duration: number;
    id: number;
  } | null>(null);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const hide = useCallback(() => setToast(null), []);
  const show = useCallback(
    (message: ToastMessage, tone: AlertTone = 'info', duration = 4000) => {
      setToast({ message, tone, duration, id: Date.now() });
    },
    [],
  );
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = setTimeout(hide, toast.duration);
    return () => clearTimeout(timeout);
  }, [toast, hide]);
  const context = useMemo(() => ({ show, hide }), [show, hide]);
  return (
    <ToastContext.Provider value={context}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={[styles.toast, { bottom: insets.bottom + spacing.md }]}
        >
          <Alert
            message={
              typeof toast.message === 'string'
                ? toast.message
                : t(toast.message.key, toast.message.values)
            }
            tone={toast.tone}
            onDismiss={hide}
          />
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast requires ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  alert: {
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: { flex: 1, gap: spacing.xs },
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    maxWidth: sizes.maxContentWidth,
    alignSelf: 'center',
  },
});
