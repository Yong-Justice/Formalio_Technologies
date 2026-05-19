import axios, { AxiosError, AxiosRequestConfig } from "axios";
  import { Env } from "@/config/env";
  import { secureStorage, secureKeys } from "@/services/storage/secureStorage";
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
  