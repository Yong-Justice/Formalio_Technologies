import type { ID, Timestamps } from "./common";

export type DocumentStatus = "draft" | "pending" | "approved" | "rejected" | "archived";

export type DocumentType =
  | "invoice"
  | "receipt"
  | "contract"
  | "tax_return"
  | "financial_statement"
  | "other";

export type Document = {
  id: ID;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  ownerId: ID;
  organizationId: ID;
  tags: string[];
  metadata: Record<string, unknown>;
} & Timestamps;
