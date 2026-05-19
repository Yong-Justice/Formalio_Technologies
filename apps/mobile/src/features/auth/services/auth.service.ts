import * as LocalAuthentication from 'expo-local-authentication';
import { request } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { analytics } from '@/services/analytics/analytics.service';
import { User } from '@/types/domain';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  register(payload: { fullName: string; phone: string; email?: string; password: string; referralCode?: string }) {
    return request<{ userId: string; requiresOtp: boolean }>({
      method: 'POST',
      url: endpoints.auth.register,
      data: payload
    });
  },
  verifyOtp(payload: { phone: string; otp: string }) {
    return request<AuthResponse>({ method: 'POST', url: endpoints.auth.verifyOtp, data: payload });
  },
  login(payload: { identifier: string; password: string }) {
    return request<AuthResponse>({ method: 'POST', url: endpoints.auth.login, data: payload });
  },
  refresh(refreshToken: string) {
    return request<AuthResponse>({ method: 'POST', url: endpoints.auth.refresh, data: { refreshToken } });
  },
  me() {
    return request<User>({ method: 'GET', url: endpoints.auth.me });
  },
  async biometricPrompt() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Déverrouiller Formalio',
      cancelLabel: 'Annuler',
      disableDeviceFallback: false
    });
    analytics.track(result.success ? 'biometric_auth_succeeded' : 'biometric_auth_failed', { source: 'auth_service' });
    return result.success;
  }
};
