import { ContentView } from "@/components/admin/content/ContentView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Content", description: "Manage homepage banners, blogs, gallery and popups.", path: "/admin/content", noIndex: true });
export const dynamic = "force-dynamic";

export default function ContentPage() {
  return <ContentView />;
}
