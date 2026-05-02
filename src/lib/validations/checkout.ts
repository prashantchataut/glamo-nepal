import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.union([
    z.string().email("Enter a valid email address"),
    z.literal(""),
  ], { error: "Enter a valid email address" }),
  phone: z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number (e.g. 9818212188)"),
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  city: z.string().min(1, "City is required"),
  ward: z.string().min(1, "Ward is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  giftWrap: z.boolean(),
  notes: z.string(),
  payment: z.enum(["Cash on Delivery", "Khalti", "eSewa", "Cards"]),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;