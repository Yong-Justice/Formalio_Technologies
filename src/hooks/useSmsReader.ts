import { readDeviceSms } from '@/services/sms/smsReader';

export function useSmsReader() {
  return { readDeviceSms };
}
