export type EnvStatus = "configured" | "missing" | "placeholder";

export interface PublicEnvCheck {
  key: string;
  label: string;
  requiredForProduction: boolean;
  value?: string;
  status: EnvStatus;
  ownerAction: string;
}

const placeholderPatterns = [/your_/i, /replace/i, /example/i, /placeholder/i, /test_/i, /demo/i, /^$/];

function statusFor(value: string | undefined): EnvStatus {
  if (!value) return "missing";
  if (placeholderPatterns.some((pattern) => pattern.test(value))) return "placeholder";
  return "configured";
}

export function getPublicEnvChecks(): PublicEnvCheck[] {
  const checks: Array<Omit<PublicEnvCheck, "status">> = [
    { key: "NEXT_PUBLIC_SITE_URL", label: "Canonical site URL", requiredForProduction: true, value: process.env.NEXT_PUBLIC_SITE_URL, ownerAction: "Set the production domain, usually https://glamonepal.com." },
    { key: "NEXT_PUBLIC_API_BASE_URL", label: "API base URL", requiredForProduction: false, value: process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1", ownerAction: "Defaults to /api/v1 for same-origin Netlify deployment. Override only for external API." },
    { key: "NEXT_PUBLIC_FIREBASE_API_KEY", label: "Firebase API key", requiredForProduction: true, value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, ownerAction: "Add Firebase web app API key from Firebase Console." },
    { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", label: "Firebase auth domain", requiredForProduction: true, value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, ownerAction: "Add Firebase auth domain from Firebase Console." },
    { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", label: "Firebase project ID", requiredForProduction: true, value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, ownerAction: "Add Firebase project ID from Firebase Console." },
    { key: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", label: "Firebase storage bucket", requiredForProduction: true, value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, ownerAction: "Add Firebase storage bucket from Firebase Console." },
    { key: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", label: "Firebase messaging sender ID", requiredForProduction: true, value: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, ownerAction: "Add Firebase messaging sender ID from Firebase Console." },
    { key: "NEXT_PUBLIC_FIREBASE_APP_ID", label: "Firebase app ID", requiredForProduction: true, value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, ownerAction: "Add Firebase app ID from Firebase Console." },
    { key: "NEXT_PUBLIC_KHALTI_PUBLIC_KEY", label: "Khalti public key", requiredForProduction: true, value: process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY, ownerAction: "Add live/test Khalti public key after merchant setup." },
    { key: "NEXT_PUBLIC_ESEWA_MERCHANT_ID", label: "eSewa merchant ID", requiredForProduction: true, value: process.env.NEXT_PUBLIC_ESEWA_MERCHANT_ID, ownerAction: "Add merchant ID after eSewa setup." },
    { key: "NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", label: "Google Analytics ID", requiredForProduction: false, value: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID, ownerAction: "Add GA4 measurement ID before marketing launch." },
    { key: "NEXT_PUBLIC_FACEBOOK_URL", label: "Facebook URL", requiredForProduction: false, value: process.env.NEXT_PUBLIC_FACEBOOK_URL, ownerAction: "Add final Facebook page URL, or remove Facebook links." },
    { key: "NEXT_PUBLIC_INSTAGRAM_URL", label: "Instagram URL", requiredForProduction: true, value: process.env.NEXT_PUBLIC_INSTAGRAM_URL, ownerAction: "Use https://www.instagram.com/glamo_nepal/." },
  ];

  return checks.map((check) => ({ ...check, status: statusFor(check.value) }));
}

export function hasProductionBlockingEnvGaps() {
  return getPublicEnvChecks().some((check) => check.requiredForProduction && check.status !== "configured");
}
