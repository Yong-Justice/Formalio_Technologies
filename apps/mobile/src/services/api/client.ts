import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Env } from '@/config/env';
import { secureKeys, secureStorage } from '@/services/storage/secureStorage';
import type { ApiEnvelope } from '@/types/api';

export const apiClient = axios.create({
  baseURL: Env.apiBaseUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client': 'formalio-mobile'
  }
});

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.get(secureKeys.accessToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<ApiEnvelope<T>>(config);
    if (!response.data.success) throw new Error(response.data.error.message);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiEnvelope<never>>;
    const message = axiosError.response?.data?.success === false
      ? axiosError.response.data.error.message
      : axiosError.message;
    throw new Error(message || 'Une erreur est survenue.');
  }
}