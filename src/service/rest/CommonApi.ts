import { ENDPOINTS } from '../config';
import {
  _makeAxiosGetRequest,
  _makeAxiosPostRequest,
} from './index';
import { getAsyncStorage } from '@/utils/helper.utils';
import { ASYNC_KEYS } from '@/utils/contant.utils';
import { useAuthStore } from '@/store/authStore';
import { useGeneralStore } from '@/store/generalStore';
import { logger } from '@/utils/logger';

export const getProfile = async () => {
  const token = useAuthStore.getState().token;
  try {
    const response: any = await _makeAxiosGetRequest(
      `${ENDPOINTS.USER.USER}`,
      {},
    );
    if (response?.code)
      useAuthStore.setState({ token: token, user: response?.user });
  } catch {
    logger.error('account.getProfile.error', { scope: 'profile' });
  }
};

export const getConfig = async () => {
  try {
    const response = await _makeAxiosGetRequest(
      `${ENDPOINTS.COMMON.CONFIG}`,
      {},
    );
    if (response?.status === 200) {
      useGeneralStore.setState({ configData: response?.data });
    }
  } catch {
    logger.error('account.getConfig.error', { scope: 'config' });
  }
};
export const getOnboardingStatus = async () => {
  try {
    await _makeAxiosGetRequest(
      `${ENDPOINTS.ONBOARDING.ONBOARDING_STATUS}`,
      {},
    );
    // if (response?.status === 200) {
    // useAuthStore.setState({ onBoardingStatus: response });
    // }
  } catch {
    logger.error('account.getOnboardingStatus.error', { scope: 'onboarding' });
  }
};

export const refreshTokenRequest = async () => {
  const refreshToken = await getAsyncStorage(ASYNC_KEYS.REFRESH_TOKEN);
  if (!refreshToken) throw new Error('No refresh token');

  const response = await _makeAxiosPostRequest<{
    data?: { accessToken?: string };
  }>(
    `${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
    {
      refreshToken,
    },
  );

  return response.data?.accessToken;
};
