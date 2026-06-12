import { z } from "zod";

const noHtmlRegex = /<[^>]*>/;
const stripHtml = (val: string) => val.replace(/<[^>]*>/g, "").trim();

export const contactSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .transform(stripHtml)
    .refine((v) => !noHtmlRegex.test(v), { message: "HTML tags are not allowed" }),
  email: z.string().max(254, "Email must be under 254 characters").email("Please enter a valid email address"),
  phone: z.union([
    z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number (e.g. 9818212188)"),
    z.literal(""),
  ], { error: "Enter a valid Nepal mobile number (e.g. 9818212188)" }).transform(stripHtml),
  subject: z.string()
    .min(1, "Please select a subject")
    .max(200, "Subject must be under 200 characters")
    .transform(stripHtml)
    .refine((v) => !noHtmlRegex.test(v), { message: "HTML tags are not allowed" }),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be under 2000 characters")
    .transform(stripHtml)
    .refine((v) => !noHtmlRegex.test(v), { message: "HTML tags are not allowed" }),
});

export type ContactFormData = z.infer<typeof contactSchema>;