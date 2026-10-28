import { ENDPOINTS } from '../config';
import { client } from './index';
import { logger } from '@/utils/logger';

// Retained only for the deferred biometric gate session cleanup.
export const logoutCustomerSession = async (): Promise<void> => {
  try {
    logger.info('account.logout.start', { scope: 'auth' });
    await client.post(ENDPOINTS.CUSTOMER_AUTH.LOGOUT, undefined, {
      timeout: 10_000,
    });
    logger.info('account.logout.success', { scope: 'auth' });
  } catch (error: unknown) {
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : undefined;
    logger.warn('account.logout.error', {
      scope: 'auth',
      status,
    });
    throw error;
  }
};
