export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const SITE_CONFIG = {
  name: "GLAMO",
  tagline: "Nepal",
  fullTitle: "GLAMO NEPAL",
  description: "Premium Nepali beauty, cosmetics and personal care curated from Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal.",
  phone: "+977 9818212188",
  whatsapp: "https://wa.me/9779818212188",
  email: "info@glamonepal.com",
  website: SITE_URL,
  address: "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal",
  currency: "NPR",
  instagramHandle: "@glamo_nepal",
  paymentMethods: ["Khalti", "eSewa", "Cash on Delivery", "Cards"],
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/glamo_nepal/",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/glamonepal",
  },
  logo: "/images/logo.svg",
  openingHours: "Su-Fr 10:00-19:00, Sa 10:00-17:00",
  coordinates: { latitude: 27.6944, longitude: 85.3244 },
} as const;

export type SiteConfig = typeof SITE_CONFIG;
