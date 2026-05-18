import { z } from "zod";

export const InvoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

export const LineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().min(0).max(100),
});

export const CreateInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  dueAt: z.string().datetime(),
  lineItems: z.array(LineItemSchema).min(1),
  currency: z.string().length(3).default("XAF"),
  notes: z.string().optional(),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
