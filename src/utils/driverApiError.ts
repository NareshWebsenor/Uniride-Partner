import i18n from '@/localizations';
import { DriverApiError } from '@/service/rest/driverClient';

export function driverErrorMessage(error: unknown): string {
  // Backend-authored messages are already intended for the end user.
  if (error instanceof DriverApiError && error.message) return error.message;
  if (error instanceof DriverApiError && error.status === 413) return String(i18n.t('driverRegistration.uploads.tooLarge'));
  if (error instanceof DriverApiError && error.status === 503) return String(i18n.t('driverRegistration.tryShortly'));
  return String(i18n.t('driverRegistration.requestFailed'));
}
