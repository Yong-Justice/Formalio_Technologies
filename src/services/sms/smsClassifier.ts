import type { DeviceSms } from './smsReader';

export function isBusinessSms(_sms: DeviceSms) {
  return false;
}
