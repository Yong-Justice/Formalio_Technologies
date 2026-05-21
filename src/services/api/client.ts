import axios, { AxiosError, AxiosRequestConfig } from "axios";
  import { Env } from "@/config/env";
  import { refreshTokenStorage, secureStorage, secureKeys } from "@/services/storage/secureStorage";
  import { endpoints } from "@/services/api/endpoints";
  import { observability } from "@/services/observability/observability.service";
  import { pinnedApiClientWithAuth } from "@/services/security/pinning";
  import { signRequest } from "@/services/api/signing";
  import { assertDeviceIntegrity } from "@/services/security/jailbreak";
  import type { ApiEnvelope } from "@/types/api";

  // ---------------------------------------------------------------------------
  // General-purpose axios client — non-financial routes (auth, AI, settings…)
  // ---------------------------------------------------------------------------
  export const apiClient = axios.create({
    baseURL: Env.apiBaseUrl,
    timeout: 20000,
    headers: {
      "Content-Type": "application/json",
      "X-Client": "formalio-mobile",
    },
  });

  const refreshClient = axios.create({
    baseURL: Env.apiBaseUrl,
    timeout: 20000,
    headers: {
      "Content-Type": "application/json",
      "X-Client": "formalio-mobile",
    },
  });

  type RefreshPayload = {
    accessToken: string;
    refreshToken?: string;
  };

  apiClient.interceptors.request.use(async (config) => {
    const token = await secureStorage.get(secureKeys.accessToken);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiEnvelope<never>>) => {
      const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

      if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = await refreshTokenStorage.get();
        if (!refreshToken) return Promise.reject(error);

        const refreshResponse = await refreshClient.post<ApiEnvelope<RefreshPayload>>(endpoints.auth.refresh, {
          refreshToken,
        });

        if (!refreshResponse.data.success) throw new Error(refreshResponse.data.error.message);

        await secureStorage.set(secureKeys.accessToken, refreshResponse.data.data.accessToken);
        if (refreshResponse.data.data.refreshToken) {
          await refreshTokenStorage.set(refreshResponse.data.data.refreshToken);
        }

        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${refreshResponse.data.data.accessToken}`,
        };

        return apiClient.request(originalRequest);
      } catch (refreshError) {
        await secureStorage.remove(secureKeys.accessToken);
        await refreshTokenStorage.remove();
        observability.captureException(refreshError, { operation: "jwt_refresh" });
        return Promise.reject(refreshError);
      }
    }
  );

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
      throw new Error(message || "Une erreur est survenue.");
    }
  }

  // ---------------------------------------------------------------------------
  // SSL-pinned + signed client — all financial routes
  //
  // Every call runs three gates in order:
  //   1. Device integrity  — blocks on rooted / jailbroken device
  //   2. Authentication    — reads access token from SecureStore
  //   3. Request signing   — attaches HMAC-SHA256 signature to prevent replays
  // ---------------------------------------------------------------------------
  type PinnedMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  type FinancialRequestConfig = {
    method: PinnedMethod;
    url: string;
    data?: Record<string, unknown>;
  };

  export async function financialRequest<T>(config: FinancialRequestConfig): Promise<T> {
    // Gate 1 — device integrity (throws DeviceCompromisedError if rooted/jailbroken)
    await assertDeviceIntegrity();

    // Gate 2 — authentication
    const accessToken = await secureStorage.get(secureKeys.accessToken);
    if (!accessToken) throw new Error("Not authenticated.");

    // Gate 3 — HMAC-SHA256 request signing (replay-attack prevention)
    const payload = config.data ?? {};
    const signatureHeaders = signRequest(payload) as Record<string, string>;

    const client = await pinnedApiClientWithAuth(accessToken);

    let response: Awaited<ReturnType<typeof client.get>>;

    switch (config.method) {
      case "POST":
        response = await client.post(config.url, payload, signatureHeaders);
        break;
      case "PUT":
        response = await client.put(config.url, payload, signatureHeaders);
        break;
      case "PATCH":
        response = await client.patch(config.url, payload, signatureHeaders);
        break;
      case "DELETE":
        response = await client.delete(config.url, signatureHeaders);
        break;
      default:
        response = await client.get(config.url, signatureHeaders);
    }

    const envelope = response.json as ApiEnvelope<T>;
    if (!envelope.success) throw new Error(envelope.error.message);
    return envelope.data;
  }
  
