"use client";

import { useState } from "react";
import { Images, LayoutTemplate, MousePointerClick } from "lucide-react";
import { BannersView } from "@/components/admin/banners/BannersView";
import { GalleryView } from "@/components/admin/gallery/GalleryView";
import { PopupsView } from "@/components/admin/popups/PopupsView";
import { HomepageEditorView } from "@/components/admin/content/HomepageEditorView";

type ContentTab = "homepage" | "banners" | "gallery" | "popups";

const tabs: { id: ContentTab; label: string; help: string; icon: typeof LayoutTemplate }[] = [
  { id: "homepage", label: "Homepage", help: "Preview, publish and feature content", icon: LayoutTemplate },
  { id: "banners", label: "Banners", help: "Homepage hero and campaign slots", icon: LayoutTemplate },
  { id: "gallery", label: "Gallery", help: "Brand visuals and lookbook images", icon: Images },
  { id: "popups", label: "Popups", help: "Timed offers and capture prompts", icon: MousePointerClick },
];

export function ContentView() {
  const [tab, setTab] = useState<ContentTab>("homepage");

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-brand-border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-brand-textPrimary">Content</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Storefront content management</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">
          Manage homepage banners, gallery assets and popups from one URL-based module instead of hidden dashboard state. Blog content stays out of admin to avoid accidental SEO edits.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-4" role="tablist" aria-label="Content sections">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={`rounded-2xl border p-4 text-left transition ${active ? "border-brand-primary bg-brand-primary text-neutral-50" : "border-brand-border bg-brand-bgLight hover:border-brand-primary/40"}`}
              >
                <Icon size={18} className={active ? "text-neutral-50" : "text-brand-primary"} />
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
                <p className={`mt-1 text-xs leading-5 ${active ? "text-neutral-50/80" : "text-brand-textMuted"}`}>{item.help}</p>
              </button>
            );
          })}
        </div>
      </section>

      {tab === "homepage" && <HomepageEditorView />}
      {tab === "banners" && <BannersView />}
      {tab === "gallery" && <GalleryView />}
      {tab === "popups" && <PopupsView />}
    </div>
  );
}
