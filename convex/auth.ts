import { convexAuth } from "@convex-dev/auth/server";
import { Phone } from "@convex-dev/auth/providers/Phone";

const PhoneProvider = Phone({
  id: "phone",
  sendVerificationRequest: async ({ identifier: phone, token, provider }) => {
    // TODO: Replace with actual SMS provider (e.g., Twilio, Khalti SMS, MSG91)
    // In development only, log verification codes for testing.
    if (process.env.NODE_ENV === "development") {
      console.log(`[AUTH] Phone verification code for ${phone}: ${token}`);
    }
  },
});

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [PhoneProvider],
});