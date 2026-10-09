import type { BackendKnowledgeItem } from "./knowledge";

const PREFIX = "noryx-library:v1:";
const MAX_AGE = 24 * 60 * 60 * 1000;
type Snapshot<T> = { savedAt: number; data: T };

// Browser storage is optional. Quota errors must not break library loading.
export class UserCache<T> {
  private memory = new Map<string, Snapshot<T>>();
  private pending = new Map<string, { revision: string; promise: Promise<T> }>();
  private epoch = 0;
  private revisions = new Map<string, number>();

  private revision(userId: string): string {
    return `${this.epoch}:${this.revisions.get(userId) ?? 0}`;
  }

  private changed(userId: string) {
    this.revisions.set(userId, (this.revisions.get(userId) ?? 0) + 1);
  }
  private storage: () => Storage;
  private valid: (value: unknown) => value is T;

  constructor(storage: () => Storage, valid: (value: unknown) => value is T) {
    this.storage = storage;
    this.valid = valid;
  }

  read(userId: string): T | null {
    try {
      const entry = this.memory.get(userId) ?? JSON.parse(
        this.storage().getItem(PREFIX + userId) ?? "null",
      );
      if (!entry || typeof entry.savedAt !== "number" ||
        Date.now() - entry.savedAt > MAX_AGE || entry.savedAt > Date.now() ||
        !this.valid(entry.data)) return null;
      this.memory.set(userId, entry);
      return entry.data;
    } catch {
      return null;
    }
  }

  write(userId: string, data: T) {
    this.changed(userId);
    const entry = { savedAt: Date.now(), data };
    this.memory.set(userId, entry);
    try {
      this.storage().setItem(PREFIX + userId, JSON.stringify(entry));
    } catch { /* Keep the memory snapshot if persistence is unavailable. */ }
  }

  update(userId: string, updater: (data: T) => T) {
    this.changed(userId);
    const data = this.read(userId);
    // A mutation response alone is not a complete library snapshot.
    if (data !== null) this.write(userId, updater(data));
  }

  async refresh(userId: string, loader: () => Promise<T>): Promise<T> {
    const revision = this.revision(userId);
    const existing = this.pending.get(userId);
    if (existing?.revision === revision) return existing.promise;
    const promise = (async () => {
      const data = await loader();
      // Do not overwrite a save/delete or repopulate storage after sign-out.
      if (this.revision(userId) !== revision) {
        const current = this.read(userId);
        if (current !== null) return current;
        throw new Error("Your library changed. Please reload to refresh it.");
      }
      this.write(userId, data);
      return data;
    })();
    this.pending.set(userId, { revision, promise });
    try {
      return await promise;
    } finally {
      if (this.pending.get(userId)?.promise === promise) this.pending.delete(userId);
    }
  }

  clear() {
    this.epoch++;
    this.revisions.clear();
    this.memory.clear();
    this.pending.clear();
    try {
      const storage = this.storage();
      for (let index = storage.length - 1; index >= 0; index--) {
        const key = storage.key(index);
        if (key?.startsWith(PREFIX)) storage.removeItem(key);
      }
    } catch { /* Sign-out must also work when browser storage is blocked. */ }
  }
}

function isLibrary(value: unknown): value is BackendKnowledgeItem[] {
  return Array.isArray(value) && value.every((item) =>
    item && typeof item.id === "string" &&
    typeof item.original_url === "string" && typeof item.platform === "string" &&
    typeof item.created_at === "string" && typeof item.status === "string" &&
    [item.title, item.summary, item.why_it_matters, item.source_type].every(
      (value) => value == null || typeof value === "string",
    ) &&
    (item.key_takeaways == null || (Array.isArray(item.key_takeaways) &&
      item.key_takeaways.every((value: unknown) => typeof value === "string"))) &&
    (item.custom_tags == null || (Array.isArray(item.custom_tags) &&
      item.custom_tags.every((tag: unknown) => typeof tag === "string"))) &&
    (item.knowledge_tags == null || (Array.isArray(item.knowledge_tags) &&
      item.knowledge_tags.every((tag: { tag?: unknown } | null) =>
        tag && typeof tag.tag === "string"))),
  );
}

export const libraryCache = new UserCache<BackendKnowledgeItem[]>(
  () => window.localStorage,
  isLibrary,
);
