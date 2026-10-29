// Each line is a complete result set: keyword matches, then enriched matches.
export async function readSearchStream<T>(
  body: ReadableStream<Uint8Array>,
  onProgress: (data: T) => void,
): Promise<T> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let latest: T | undefined;
  function publish(line: string) {
    if (!line.trim()) return;
    latest = JSON.parse(line) as T;
    onProgress(latest);
  }
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let end: number;
      while ((end = buffer.indexOf("\n")) >= 0) {
        publish(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
      }
      if (done) break;
    }
    publish(buffer);
  } catch (error) {
    // Preserve usable matches if enrichment is interrupted.
    if (latest === undefined) throw error;
  } finally {
    reader.releaseLock();
  }
  if (latest === undefined) throw new Error("Search returned no response.");
  return latest;
}
