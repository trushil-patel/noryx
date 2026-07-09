"use client";

import { useState } from "react";
import { backendRequest } from "@/lib/api/backend";

type AuthTestResponse = {
  success: boolean;
  message: string;
  user: {
    id: string;
    email?: string;
  };
};

export function BackendAuthTest() {
  const [result, setResult] = useState<AuthTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  async function handleTestBackendAuth() {
    try {
      setIsTesting(true);
      setError(null);
      setResult(null);

      const data = await backendRequest<AuthTestResponse>("/api/auth/me");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Backend JWT Test</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Verifies frontend token with Express backend.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTestBackendAuth}
          disabled={isTesting}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {isTesting ? "Testing..." : "Test Backend"}
        </button>
      </div>

      {result ? (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-background p-3 text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}