import { fetch as pinnedFetch } from "react-native-ssl-pinning";

  /**
   * SSL Certificate Pinning — Formalio Technologies
   *
   * Prevents man-in-the-middle attacks on mobile networks.
   * Critical in African telco infrastructure where SSL stripping is common.
   *
   * Pins both the leaf certificate and the CA certificate for rotation resilience:
   * - Leaf pin:  exact match to the current server certificate
   * - CA pin:    match to the issuing Certificate Authority
   *   If the leaf certificate is rotated, the CA pin keeps the app working
   *   until a new app version with the updated leaf pin is deployed.
   *
   * Usage:
   *   import { pinnedApiClient } from "@/services/security/pinning";
   *   const res = await pinnedApiClient.get("/v1/wallet/balance");
   */

  // ---------------------------------------------------------------------------
  // Certificate SHA-256 fingerprints
  // Replace these with your actual certificate fingerprints.
  // Run: openssl s_client -connect api.formalio.cm:443 | openssl x509 -pubkey -noout |
  //      openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
  // ---------------------------------------------------------------------------
  const CERT_PINS = {
    /** Leaf certificate — current server certificate */
    leaf: "REPLACE_WITH_LEAF_CERT_SHA256_BASE64==",
    /** CA certificate — issuing Certificate Authority */
    ca: "REPLACE_WITH_CA_CERT_SHA256_BASE64==",
  };

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.formalio.cm";

  // ---------------------------------------------------------------------------
  // Pinned fetch wrapper
  // ---------------------------------------------------------------------------
  type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  type PinnedRequestOptions = {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
    timeoutInterval?: number;
  };

  type PinnedResponse<T = unknown> = {
    status: number;
    headers: Record<string, string>;
    json: T;
  };

  async function pinnedRequest<T = unknown>(
    path: string,
    options: PinnedRequestOptions = {}
  ): Promise<PinnedResponse<T>> {
    const { method = "GET", headers: extraHeaders = {}, body, timeoutInterval = 10000 } = options;

    const response = await pinnedFetch(`${API_BASE_URL}${path}`, {
      method,
      timeoutInterval,
      sslPinning: {
        // Provide both pins — library accepts either a match
        certs: [CERT_PINS.leaf, CERT_PINS.ca],
      },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...extraHeaders,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    return response as PinnedResponse<T>;
  }

  // ---------------------------------------------------------------------------
  // Typed HTTP methods — mirrors axios API shape so it's a drop-in replacement
  // for financial API calls.
  // ---------------------------------------------------------------------------
  export const pinnedApiClient = {
    get<T = unknown>(path: string, headers?: Record<string, string>) {
      return pinnedRequest<T>(path, { method: "GET", headers });
    },

    post<T = unknown>(path: string, body?: Record<string, unknown>, headers?: Record<string, string>) {
      return pinnedRequest<T>(path, { method: "POST", body, headers });
    },

    put<T = unknown>(path: string, body?: Record<string, unknown>, headers?: Record<string, string>) {
      return pinnedRequest<T>(path, { method: "PUT", body, headers });
    },

    patch<T = unknown>(path: string, body?: Record<string, unknown>, headers?: Record<string, string>) {
      return pinnedRequest<T>(path, { method: "PATCH", body, headers });
    },

    delete<T = unknown>(path: string, headers?: Record<string, string>) {
      return pinnedRequest<T>(path, { method: "DELETE", headers });
    },
  };

  // ---------------------------------------------------------------------------
  // Helper — inject auth token into every pinned request
  // ---------------------------------------------------------------------------
  export async function pinnedApiClientWithAuth(
    accessToken: string
  ): Promise<typeof pinnedApiClient> {
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    return {
      get: (path) => pinnedApiClient.get(path, authHeader),
      post: (path, body) => pinnedApiClient.post(path, body, authHeader),
      put: (path, body) => pinnedApiClient.put(path, body, authHeader),
      patch: (path, body) => pinnedApiClient.patch(path, body, authHeader),
      delete: (path) => pinnedApiClient.delete(path, authHeader),
    };
  }
  