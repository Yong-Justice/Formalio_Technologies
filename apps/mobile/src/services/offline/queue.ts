import { request } from '@/services/api/client';
import { getJson, setJson, storageKeys } from '@/services/storage/mmkv';

export type QueueMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface QueueItem {
  id: string;
  method: QueueMethod;
  url: string;
  body?: unknown;
  createdAt: string;
  retryCount: number;
}

export function getOfflineQueue(): QueueItem[] {
  return getJson<QueueItem[]>(storageKeys.offlineQueue, []);
}

export function enqueueRequest(item: Omit<QueueItem, 'createdAt' | 'retryCount'>) {
  const queue = getOfflineQueue();
  setJson(storageKeys.offlineQueue, [
    ...queue,
    { ...item, createdAt: new Date().toISOString(), retryCount: 0 }
  ]);
}

export async function flushOfflineQueue() {
  const queue = getOfflineQueue();
  const remaining: QueueItem[] = [];
  for (const item of queue) {
    try {
      await request({ method: item.method, url: item.url, data: item.body });
    } catch {
      remaining.push({ ...item, retryCount: item.retryCount + 1 });
    }
  }
  setJson(storageKeys.offlineQueue, remaining);
  return { attempted: queue.length, remaining: remaining.length };
}