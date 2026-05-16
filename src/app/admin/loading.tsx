export default function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bgLight" aria-label="Loading admin panel">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        <p className="text-sm text-brand-textMuted">Loading admin panel...</p>
      </div>
    </div>
  );
}