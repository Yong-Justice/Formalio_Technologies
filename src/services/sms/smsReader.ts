export type DeviceSms = {
  id: string;
  body: string;
  sender?: string;
  receivedAt?: string;
};

export async function readDeviceSms(): Promise<DeviceSms[]> {
  return [];
}
