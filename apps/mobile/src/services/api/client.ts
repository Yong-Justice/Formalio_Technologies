import axios, { AxiosError, AxiosRequestConfig } from 'axios';
  import { Env } from '@/config/env';
  import { secureKeys, secureStorage } from '@/services/storage/secureStorage';
  import { pinnedApiClientWithAuth } from '@/services/security/pinning';
  import type { ApiEnvelope } from '@/types/api';

  // ---------------------------------------------------------------------------
  // General-purpose axios client (non-financial routes)
  // ---------------------------------------------------------------------------
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
      const message =
        axiosError.response?.data?.success === false
          ? axiosError.response.data.error.message
          : axiosError.message;
      throw new Error(message || 'Une erreur est survenue.');
    }
  }

  // ---------------------------------------------------------------------------
  // SSL-pinned client for all financial API calls
  // Replaces axios for any route that touches money, credit, or reports.
  // Uses react-native-ssl-pinning to prevent MITM on African telco networks.
  // ---------------------------------------------------------------------------
  type PinnedMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  type FinancialRequestConfig = {
    method: PinnedMethod;
    url: string;
    data?: Record<string, unknown>;
  };

  export async function financialRequest<T>(config: FinancialRequestConfig): Promise<T> {
    const accessToken = await secureStorage.get(secureKeys.accessToken);
    if (!accessToken) throw new Error('Not authenticated.');

    const client = await pinnedApiClientWithAuth(accessToken);

    let response: Awaited<ReturnType<typeof client.get>>;

    switch (config.method) {
      case 'POST':
        response = await client.post(config.url, config.data);
        break;
      case 'PUT':
        response = await client.put(config.url, config.data);
        break;
      case 'PATCH':
        response = await client.patch(config.url, config.data);
        break;
      case 'DELETE':
        response = await client.delete(config.url);
        break;
      default:
        response = await client.get(config.url);
    }

    const envelope = response.json as ApiEnvelope<T>;
    if (!envelope.success) throw new Error(envelope.error.message);
    return envelope.data;
  }
  