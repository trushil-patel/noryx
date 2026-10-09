import assert from "node:assert/strict";
import test from "node:test";
import { UserCache } from "../lib/api/library-cache.ts";

function storage() {
  const entries = new Map();
  return {
    get length() { return entries.size; },
    key: (index) => [...entries.keys()][index] ?? null,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
}

const createCache = (disk = storage()) => new UserCache(() => disk, Array.isArray);
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("a returning user can read persisted content without waiting for the network", async () => {
  const disk = storage();
  createCache(disk).write("alice", ["saved card"]);
  const reopened = createCache(disk);
  const network = deferred();
  const refresh = reopened.refresh("alice", () => network.promise);
  assert.deepEqual(reopened.read("alice"), ["saved card"]);
  network.resolve(["fresh card"]);
  assert.deepEqual(await refresh, ["fresh card"]);
  assert.deepEqual(createCache(disk).read("alice"), ["fresh card"]);
});

test("accounts have separate snapshots and mutations", () => {
  const cache = createCache();
  cache.write("alice", ["alice card"]);
  assert.equal(cache.read("bob"), null);
  cache.write("bob", ["bob card"]);
  cache.update("alice", () => []);
  assert.deepEqual(cache.read("alice"), []);
  assert.deepEqual(cache.read("bob"), ["bob card"]);
});

test("concurrent reads for the same account share one network request", async () => {
  const cache = createCache();
  const network = deferred();
  let calls = 0;
  const loader = () => { calls++; return network.promise; };
  const first = cache.refresh("alice", loader);
  const second = cache.refresh("alice", loader);
  assert.equal(calls, 1);
  network.resolve(["card"]);
  assert.deepEqual(await first, await second);
});

test("a slow refresh cannot restore a deleted card or overwrite edited tags", async () => {
  const cache = createCache();
  cache.write("alice", ["keep", "delete"]);
  const network = deferred();
  const refresh = cache.refresh("alice", () => network.promise);
  cache.update("alice", () => ["edited"]);
  network.resolve(["keep", "delete"]);
  assert.deepEqual(await refresh, ["edited"]);
  assert.deepEqual(cache.read("alice"), ["edited"]);
});

test("sign-out clears persisted data and prevents an in-flight read restoring it", async () => {
  const disk = storage();
  disk.setItem("unrelated", "keep");
  const cache = createCache(disk);
  cache.write("alice", ["private"]);
  cache.write("bob", ["also private"]);
  const network = deferred();
  const refresh = cache.refresh("alice", () => network.promise);
  cache.clear();
  network.resolve(["private"]);
  await assert.rejects(refresh, /library changed/);
  assert.equal(createCache(disk).read("alice"), null);
  assert.equal(createCache(disk).read("bob"), null);
  assert.equal(disk.getItem("unrelated"), "keep");
});

test("network failure retains cached content and permits a subsequent retry", async () => {
  const cache = createCache();
  cache.write("alice", ["cached"]);
  await assert.rejects(cache.refresh("alice", async () => { throw new Error("offline"); }));
  assert.deepEqual(cache.read("alice"), ["cached"]);
  assert.deepEqual(await cache.refresh("alice", async () => ["online"]), ["online"]);
});

test("blocked storage does not break successful reads or memory caching", async () => {
  const cache = new UserCache(() => { throw new Error("blocked"); }, Array.isArray);
  assert.equal(cache.read("alice"), null);
  assert.deepEqual(await cache.refresh("alice", async () => ["card"]), ["card"]);
  assert.deepEqual(cache.read("alice"), ["card"]);
  assert.doesNotThrow(() => cache.clear());
});

test("corrupt, expired, or invalid persisted snapshots are ignored", () => {
  const disk = storage();
  const key = "noryx-library:v1:alice";
  for (const value of ["{broken", JSON.stringify({ savedAt: 1, data: [] }),
    JSON.stringify({ savedAt: Date.now(), data: "not an array" })]) {
    disk.setItem(key, value);
    assert.equal(createCache(disk).read("alice"), null);
  }
});

test("mutating an uncached library does not create an incomplete snapshot", () => {
  const cache = createCache();
  cache.update("alice", () => ["new card"]);
  assert.equal(cache.read("alice"), null);
});


test("refreshes for different users do not invalidate each other", async () => {
  const cache = createCache();
  const aliceNetwork = deferred();
  const bobNetwork = deferred();
  const alice = cache.refresh("alice", () => aliceNetwork.promise);
  const bob = cache.refresh("bob", () => bobNetwork.promise);
  aliceNetwork.resolve(["alice card"]);
  await alice;
  bobNetwork.resolve(["bob card"]);
  assert.deepEqual(await bob, ["bob card"]);
});
