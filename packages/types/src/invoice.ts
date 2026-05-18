import type { ID, Timestamps } from "./common";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type InvoiceLineItem = {
  id: ID;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
};

export type Invoice = {
  id: ID;
  invoiceNumber: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  clientId: ID;
  organizationId: ID;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  notes?: string;
} & Timestamps;
