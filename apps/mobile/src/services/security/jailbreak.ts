import { Platform } from "react-native";
import { apiClient } from "@/services/api/client";
import { secureStorage, secureKeys } from "@/services/storage/secureStorage";
import { auditStorage } from "@/services/storage/mmkv";

export type IntegrityResult = {
  isCompromised: boolean;
  reasons: string[];
};

type DeviceIntegrityProvider = {
  check: () => IntegrityResult;
};

const nativeIntegrityProvider: DeviceIntegrityProvider | null = null;

function checkWithNativeProvider(): IntegrityResult {
  if (!nativeIntegrityProvider) {
    return { isCompromised: false, reasons: [] };
  }

  return nativeIntegrityProvider.check();
}

export function checkDeviceIntegrity(): IntegrityResult {
  return checkWithNativeProvider();
}

function writeAuditLog(reasons: string[]) {
  const entry = {
    ts: new Date().toISOString(),
    event: "device_integrity_failure",
    reasons,
  };
  const existing = auditStorage.getString("audit.integrity_log");
  const log: unknown[] = existing ? JSON.parse(existing) : [];
  log.push(entry);
  auditStorage.set("audit.integrity_log", JSON.stringify(log.slice(-100)));
}

async function reportToBackend(reasons: string[]) {
  try {
    const userId = await secureStorage.get(secureKeys.userId);
    await apiClient.post("/v1/security/device-integrity", {
      userId,
      isCompromised: true,
      reasons,
      platform: Platform.OS,
      reportedAt: new Date().toISOString(),
    });
  } catch {
    // The device may be offline; local audit logging still preserves the event.
  }
}

async function disableBiometricEnrollment() {
  await secureStorage.remove(secureKeys.biometricEnrollment);
}

/**
 * Run on app launch and before financial operations.
 * The MVP uses a no-op provider until a React Native 0.76-compatible native
 * integrity module is added.
 */
export async function runIntegrityCheck(): Promise<IntegrityResult> {
  const result = checkDeviceIntegrity();
  if (result.isCompromised) {
    writeAuditLog(result.reasons);
    await disableBiometricEnrollment();
    void reportToBackend(result.reasons);
  }
  return result;
}

export class DeviceCompromisedError extends Error {
  readonly reasons: string[];

  constructor(reasons: string[]) {
    super("Transaction blocked: device integrity check failed.");
    this.name = "DeviceCompromisedError";
    this.reasons = reasons;
  }
}

export async function assertDeviceIntegrity(): Promise<void> {
  const result = await runIntegrityCheck();
  if (result.isCompromised) throw new DeviceCompromisedError(result.reasons);
}
