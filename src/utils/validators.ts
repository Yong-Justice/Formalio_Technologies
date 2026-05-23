import { z } from 'zod';

const emailOrPhone = z.string().min(3, 'Téléphone ou email requis').refine((value) => {
  const trimmed = value.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const isPhone = trimmed.replace(/\D/g, '').length >= 9;
  return isEmail || isPhone;
}, 'Entrez un email valide ou un numéro de téléphone');

export const loginSchema = z.object({
  identifier: emailOrPhone,
  password: z.string().min(8, 'Mot de passe minimum 8 caractères')
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Nom complet requis'),
  phone: z.string().min(9, 'Numéro de téléphone invalide'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  referralCode: z.string().optional()
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'Code OTP à 6 chiffres')
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type OtpForm = z.infer<typeof otpSchema>;
