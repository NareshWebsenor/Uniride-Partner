import { useToast } from '@/components/ui/Toast';
import type { AlertTone } from '@/components/ui/Toast';

export type ToastOptions = {
  placement?: 'top' | 'bottom' | 'center';
  duration?: number;
  animationType?: 'slide-in' | 'zoom-in';
  type?: 'success' | 'danger' | 'warning' | 'normal' | 'custom';
};

export const useToastMessage = () => {
  const toast = useToast();

  const showToast = (message: string, options: ToastOptions = {}) => {
    const tone: AlertTone =
      options.type === 'danger'
        ? 'error'
        : options.type === 'success' || options.type === 'warning'
        ? options.type
        : 'info';
    toast.show(message, tone, options.duration ?? 3000);
  };

  const showSuccess = (message: string, options?: ToastOptions) =>
    showToast(message, { ...options, type: 'success' });

  const showError = (message: string, options?: ToastOptions) =>
    showToast(message, { ...options, type: 'danger' });

  const showWarning = (message: string, options?: ToastOptions) =>
    showToast(message, { ...options, type: 'warning' });

  const showInfo = (message: string, options?: ToastOptions) =>
    showToast(message, { ...options, type: 'normal' });

  const clearAllToasts = () => toast.hide();

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAllToasts,
  };
};
