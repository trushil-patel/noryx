import assert from "node:assert/strict";
import test from "node:test";
import { readSearchStream } from "../lib/api/search-stream.ts";

const encoder = new TextEncoder();

test("publishes early matches before completion and handles split UTF-8 chunks", async () => {
  let controller;
  const body = new ReadableStream({ start(value) { controller = value; } });
  const seen = [];
  let first;
  const ready = new Promise(resolve => { first = resolve; });
  const result = readSearchStream(body, data => { seen.push(data); first(); });
  controller.enqueue(encoder.encode('{"items":["Python"]}\n'));
  await ready;
  assert.deepEqual(seen, [{ items: ["Python"] }]);
  const bytes = encoder.encode('{"items":["Python","café"]}\n');
  for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
  controller.close();
  assert.deepEqual(await result, { items: ["Python", "café"] });
  assert.equal(seen.length, 2);
});

test("keeps early results if the connection fails during enrichment", async () => {
  let controller;
  const body = new ReadableStream({ start(value) { controller = value; } });
  const result = readSearchStream(body, () => controller.error(new Error("disconnected")));
  controller.enqueue(encoder.encode('{"items":["Python"]}\n'));
  assert.deepEqual(await result, { items: ["Python"] });
});

test("reports failures before any results arrive", async () => {
  const body = new ReadableStream({ start(controller) { controller.error(new Error("offline")); } });
  await assert.rejects(readSearchStream(body, () => {}), /offline/);
});
