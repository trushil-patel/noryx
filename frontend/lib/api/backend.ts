import { createSupabaseClient } from "@/lib/supabase/client";
import { readSearchStream } from "./search-stream";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

type BackendRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function backendRequest<T>(
  path: string,
  options: BackendRequestOptions & { onProgress?: (data: T) => void } = {}
): Promise<T> {
  const supabase = createSupabaseClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session?.access_token) {
    throw new Error("No active Supabase session found.");
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.ok && options.onProgress && response.body &&
      response.headers.get("content-type")?.includes("application/x-ndjson")) {
    return readSearchStream<T>(response.body, options.onProgress);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail ?? data?.message ?? "Backend request failed.");
  }

  return data as T;
}
