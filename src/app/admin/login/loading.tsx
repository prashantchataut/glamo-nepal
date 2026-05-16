export default function AdminLoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bgLight" aria-label="Loading admin login">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-2xl border-4 border-brand-primary border-t-transparent" />
        <p className="text-sm text-brand-textMuted">Loading admin login...</p>
      </div>
    </div>
  );
}