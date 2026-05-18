import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "accountant", "client", "staff"]);

export const CreateUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  role: UserRoleSchema,
  avatarUrl: z.string().url().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
