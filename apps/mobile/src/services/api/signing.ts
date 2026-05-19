import CryptoJS from "crypto-js";
  import { Env } from "@/config/env";

  // ---------------------------------------------------------------------------
  // Transaction Request Signing
  //
  // Every financial API request includes an HMAC-SHA256 signature to prevent
  // replay attacks. The backend verifies:
  //   1. signature = HMAC-SHA256("${timestamp}.${body}", secretKey)
  //   2. timestamp is within an acceptable drift window (±30 s recommended)
  //
  // Added to every financial request:
  //   X-Signature  — HMAC-SHA256 hex digest
  //   X-Timestamp  — Unix milliseconds (string)
  // ---------------------------------------------------------------------------

  export function signRequest(
    payload: object,
    secretKey: string = Env.requestSigningSecret
  ): { "X-Signature": string; "X-Timestamp": string } {
    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = CryptoJS.HmacSHA256(`${timestamp}.${body}`, secretKey).toString();
    return { "X-Signature": signature, "X-Timestamp": timestamp };
  }

  /**
   * Verify a signature — for local dev / backend parity testing.
   * Never expose the secret key on the client in production.
   */
  export function verifySignature(
    payload: object,
    signature: string,
    timestamp: string,
    secretKey: string = Env.requestSigningSecret,
    toleranceMs = 30_000
  ): boolean {
    const age = Math.abs(Date.now() - Number(timestamp));
    if (age > toleranceMs) return false;
    const body = JSON.stringify(payload);
    const expected = CryptoJS.HmacSHA256(`${timestamp}.${body}`, secretKey).toString();
    return expected === signature;
  }
  