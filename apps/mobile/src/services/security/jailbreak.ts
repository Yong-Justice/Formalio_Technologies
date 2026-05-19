import JailMonkey from "react-native-jail-monkey";
  import { apiClient } from "@/services/api/client";
  import { secureStorage, secureKeys } from "@/services/storage/secureStorage";
  import { auditStorage } from "@/services/storage/mmkv";

  export type IntegrityResult = {
    isCompromised: boolean;
    reasons: string[];
  };

  export function checkDeviceIntegrity(): IntegrityResult {
    const reasons: string[] = [];
    if (JailMonkey.isJailBroken())       reasons.push("rooted_or_jailbroken");
    if (JailMonkey.hookDetected())        reasons.push("runtime_hook_detected");
    if (JailMonkey.canMockLocation())     reasons.push("mock_location_enabled");
    if (JailMonkey.isOnExternalStorage()) reasons.push("app_on_external_storage");
    if (JailMonkey.AdbEnabled())          reasons.push("adb_enabled");
    return { isCompromised: reasons.length > 0, reasons };
  }

  function writeAuditLog(reasons: string[]) {
    const entry = { ts: new Date().toISOString(), event: "device_integrity_failure", reasons };
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
        platform: require("react-native").Platform.OS,
        reportedAt: new Date().toISOString(),
      });
    } catch {
      // Silently swallow — device may be offline
    }
  }

  async function disableBiometricEnrollment() {
    await secureStorage.remove(secureKeys.biometricEnrollment);
  }

  /**
   * Run on app launch and before any transaction.
   * Returns result so the UI can show a warning banner — do not crash.
   * Some legitimate users have rooted devices for accessibility reasons.
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

  /** Thrown by assertDeviceIntegrity() to block transaction initiation */
  export class DeviceCompromisedError extends Error {
    readonly reasons: string[];
    constructor(reasons: string[]) {
      super("Transaction blocked: device integrity check failed.");
      this.name = "DeviceCompromisedError";
      this.reasons = reasons;
    }
  }

  /** Call at the start of every financial operation — throws if compromised */
  export async function assertDeviceIntegrity(): Promise<void> {
    const result = await runIntegrityCheck();
    if (result.isCompromised) throw new DeviceCompromisedError(result.reasons);
  }
  