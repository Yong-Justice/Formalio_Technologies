import { z } from "zod";

export const DocumentStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
  "archived",
]);

export const DocumentTypeSchema = z.enum([
  "invoice",
  "receipt",
  "contract",
  "tax_return",
  "financial_statement",
  "other",
]);

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  type: DocumentTypeSchema,
  fileUrl: z.string().url(),
  fileSize: z.number().positive(),
  mimeType: z.string(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial();

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
