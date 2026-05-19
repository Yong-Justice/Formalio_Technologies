export type ApiEnvelope<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: { code: string; message: string; details?: unknown } };

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}