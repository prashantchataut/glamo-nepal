import { ProfileForm } from "@/components/account/ProfileForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Profile Settings",
  description: "Update GLAMO NEPAL customer profile and beauty preferences.",
  path: "/account/profile",
  noIndex: true,
});

export default function ProfilePage() {
  return <ProfileForm />;
}
