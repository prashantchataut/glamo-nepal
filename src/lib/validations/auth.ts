import { z } from "zod";

export const phoneSchema = z.object({
  phone: z.union([
    z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number"),
    z.literal(""),
  ], { error: "Enter a valid Nepal mobile number" }),
});

export const registerPhoneSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  phone: z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number"),
});

export const verifyCodeSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit verification code"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;
export type RegisterPhoneFormData = z.infer<typeof registerPhoneSchema>;
export type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;