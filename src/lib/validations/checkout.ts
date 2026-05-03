import { z } from "zod";
import { PROVINCES, isValidProvinceDistrictCombo, type Province, type District } from "@/lib/nepal-location";

export const checkoutSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.union([
    z.string().email("Enter a valid email address"),
    z.literal(""),
  ], { error: "Enter a valid email address" }),
  phone: z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number (e.g. 9818212188)"),
  province: z.enum(PROVINCES as [string, ...string[]], { message: "Select a province" }),
  district: z.string().min(1, "Select a district"),
  city: z.string().min(1, "City or municipality is required"),
  ward: z.string().min(1, "Ward number is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  giftWrap: z.boolean(),
  notes: z.string(),
  payment: z.enum(["Cash on Delivery", "Khalti", "eSewa", "Cards"]),
}).refine(
  (data) => isValidProvinceDistrictCombo(data.province as Province, data.district as District),
  { message: "Selected district does not belong to this province", path: ["district"] }
);

export type CheckoutFormData = z.infer<typeof checkoutSchema>;