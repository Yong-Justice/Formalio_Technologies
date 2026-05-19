import { v4 as uuidv4 } from "uuid";
  import { financialRequest } from "@/services/api/client";
  import { queueStorage, queryStorage, getJson, setJson, storageKeys } from "@/services/storage/mmkv";
  import type { Transaction } from "@/types/domain";

  export enum QueuePriority { CRITICAL = 0, HIGH = 1, NORMAL = 2 }
  export type QueueMethod = "POST" | "PUT" | "PATCH" | "DELETE";
  export type ConflictResolution = "last-write-wins" | "server-authoritative";

  export interface QueueItem {
    id: string; // idempotency key = UUID; backend deduplicates on this
    method: QueueMethod;
    url: string;
    body?: unknown;
    optimisticData?: unknown;
    priority: QueuePriority;
    conflictResolution: ConflictResolution;
    createdAt: string;
    retryCount: number;
    nextRetryAt: number; // epoch ms — when exponential backoff allows next attempt
  }

  const MAX_RETRIES = 5;
  const BASE_DELAY_MS = 1_000;
  function backoffDelay(retry: number) { return BASE_DELAY_MS * Math.pow(2, retry); }

  function readQueue() { return getJson<QueueItem[]>(queueStorage, storageKeys.queue.offlineTransactions, []); }
  function writeQueue(items: QueueItem[]) { setJson(queueStorage, storageKeys.queue.offlineTransactions, items); }
  function byPriority(items: QueueItem[]) {
    return [...items].sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : a.createdAt.localeCompare(b.createdAt));
  }

  export function getOfflineQueue() { return byPriority(readQueue()); }

  export interface EnqueueOptions {
    id?: string; method: QueueMethod; url: string; body?: unknown;
    optimisticData?: unknown; priority?: QueuePriority; conflictResolution?: ConflictResolution;
  }

  export function enqueueRequest(opts: EnqueueOptions): string {
    const id = opts.id ?? uuidv4();
    const item: QueueItem = {
      id, method: opts.method, url: opts.url, body: opts.body,
      optimisticData: opts.optimisticData,
      priority: opts.priority ?? QueuePriority.NORMAL,
      conflictResolution: opts.conflictResolution ?? "last-write-wins",
      createdAt: new Date().toISOString(), retryCount: 0, nextRetryAt: Date.now(),
    };
    writeQueue([...readQueue(), item]);
    return id;
  }

  export function removeFromQueue(id: string) { writeQueue(readQueue().filter(i => i.id !== id)); }

  export function rollbackTransaction(transactionId: string) {
    const cached = getJson<Transaction[]>(queryStorage, storageKeys.query.transactions, []);
    setJson(queryStorage, storageKeys.query.transactions,
      cached.map(t => t.id === transactionId ? { ...t, syncStatus: "failed" as const } : t));
  }

  export type FlushResult = { attempted: number; succeeded: number; retrying: number; dead: number };

  export async function flushOfflineQueue(): Promise<FlushResult> {
    const now = Date.now();
    const queue = byPriority(readQueue());
    const due = queue.filter(i => i.nextRetryAt <= now);
    let succeeded = 0, retrying = 0, dead = 0;
    const remaining = readQueue();

    for (const item of due) {
      try {
        await financialRequest({ method: item.method as "POST"|"PUT"|"PATCH"|"DELETE", url: item.url, data: item.body as Record<string,unknown> });
        const idx = remaining.findIndex(q => q.id === item.id);
        if (idx !== -1) remaining.splice(idx, 1);
        succeeded++;
      } catch {
        const retries = item.retryCount + 1;
        const idx = remaining.findIndex(q => q.id === item.id);
        if (idx === -1) continue;
        if (retries > MAX_RETRIES) {
          remaining.splice(idx, 1);
          rollbackTransaction(item.id);
          dead++;
        } else {
          remaining[idx] = { ...remaining[idx], retryCount: retries, nextRetryAt: Date.now() + backoffDelay(retries) };
          retrying++;
        }
      }
    }
    writeQueue(remaining);
    return { attempted: due.length, succeeded, retrying, dead };
  }
  