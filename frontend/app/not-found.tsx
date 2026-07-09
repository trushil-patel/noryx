import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface shadow-elegant">
          <span className="text-xl font-semibold tracking-tight">M</span>
        </div>
        <h1 className="text-7xl font-semibold tracking-tight text-foreground">404</h1>
        <h2 className="mt-4 text-lg font-medium text-foreground">This memory isn&apos;t here</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for has moved, or never existed.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            Back to Memora
          </Link>
        </div>
      </div>
    </div>
  );
}