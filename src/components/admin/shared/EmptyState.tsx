"use client";

import type { ComponentType } from "react";

interface EmptyStateProps {
  icon?: ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-bgLight text-brand-textMuted">
          <Icon size={28} />
        </div>
      )}
      <h3 className="mt-4 font-display text-lg font-semibold text-brand-textPrimary">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-brand-textMuted">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-press mt-6 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white">
          {action.label}
        </button>
      )}
    </div>
  );
}