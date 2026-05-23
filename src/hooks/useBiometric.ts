import { useState, useEffect } from "react";
  import * as LocalAuthentication from "expo-local-authentication";
  import { analytics } from "@/services/analytics/analytics.service";

  type BiometricType = "fingerprint" | "facial" | "iris" | "none";

  type UseBiometricReturn = {
    isSupported: boolean;
    isEnrolled: boolean;
    biometricType: BiometricType;
    authenticate: () => Promise<boolean>;
  };

  export function useBiometric(): UseBiometricReturn {
    const [isSupported, setIsSupported] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [biometricType, setBiometricType] = useState<BiometricType>("none");

    useEffect(() => {
      (async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsSupported(compatible);

        if (compatible) {
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          setIsEnrolled(enrolled);

          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType("facial");
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType("fingerprint");
          } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            setBiometricType("iris");
          }
        }
      })();
    }, []);

    const authenticate = async (): Promise<boolean> => {
      if (!isSupported || !isEnrolled) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm your identity",
        fallbackLabel: "Use PIN",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      analytics.track(result.success ? "biometric_auth_succeeded" : "biometric_auth_failed", {
        biometricType,
      });

      return result.success;
    };

    return { isSupported, isEnrolled, biometricType, authenticate };
  }
  
