import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { streamAudioToSourceBuffer } from "./streamAudio";

// Emits each chunk synchronously then closes
function makeStream(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

function makeSourceBuffer() {
  const updateEndCallbacks: Array<() => void> = [];
  return {
    updating: false,
    appendBuffer: vi.fn(),
    addEventListener: vi.fn((_event: string, cb: () => void) => {
      updateEndCallbacks.push(cb);
    }),
    triggerUpdateEnd() {
      updateEndCallbacks.shift()?.();
    },
  };
}

function makeMediaSource() {
  return { endOfStream: vi.fn() };
}

function makeResponse(
  body: ReadableStream<Uint8Array> | null,
  {
    ok = true,
    status = 200,
    mockMode = null,
  }: { ok?: boolean; status?: number; mockMode?: string | null } = {}
): Response {
  return {
    ok,
    status,
    body,
    headers: { get: (k: string) => (k === "X-Mock-Mode" ? mockMode : null) },
    text: async () => `HTTP ${status}`,
  } as unknown as Response;
}

describe("streamAudioToSourceBuffer", () => {
  beforeEach(() => {
    vi.stubGlobal("MediaSource", { isTypeSupported: vi.fn().mockReturnValue(true) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to /api/tts with the provided text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(makeStream())));

    await streamAudioToSourceBuffer({
      text: "hello world",
      sourceBuffer: makeSourceBuffer() as any,
      mediaSource: makeMediaSource() as any,
      signal: { aborted: false },
      onFirstChunk: vi.fn(),
      onMockMode: vi.fn(),
    });

    expect(fetch).toHaveBeenCalledWith("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello world" }),
    });
  });

  it("appends every chunk to sourceBuffer then calls endOfStream", async () => {
    const chunk1 = new Uint8Array([1, 2, 3]);
    const chunk2 = new Uint8Array([4, 5, 6]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(makeStream(chunk1, chunk2))));

    const sourceBuffer = makeSourceBuffer();
    const mediaSource = makeMediaSource();

    await streamAudioToSourceBuffer({
      text: "hi",
      sourceBuffer: sourceBuffer as any,
      mediaSource: mediaSource as any,
      signal: { aborted: false },
      onFirstChunk: vi.fn(),
      onMockMode: vi.fn(),
    });

    expect(sourceBuffer.appendBuffer).toHaveBeenCalledTimes(2);
    expect(sourceBuffer.appendBuffer).toHaveBeenNthCalledWith(1, chunk1);
    expect(sourceBuffer.appendBuffer).toHaveBeenNthCalledWith(2, chunk2);
    expect(mediaSource.endOfStream).toHaveBeenCalledOnce();
  });

  it("calls onFirstChunk exactly once regardless of chunk count", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          makeResponse(makeStream(new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])))
        )
    );

    const onFirstChunk = vi.fn();

    await streamAudioToSourceBuffer({
      text: "hi",
      sourceBuffer: makeSourceBuffer() as any,
      mediaSource: makeMediaSource() as any,
      signal: { aborted: false },
      onFirstChunk,
      onMockMode: vi.fn(),
    });

    expect(onFirstChunk).toHaveBeenCalledOnce();
  });

  it("calls onMockMode(true) when X-Mock-Mode header is 'true'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(makeStream(), { mockMode: "true" }))
    );

    const onMockMode = vi.fn();

    await streamAudioToSourceBuffer({
      text: "hi",
      sourceBuffer: makeSourceBuffer() as any,
      mediaSource: makeMediaSource() as any,
      signal: { aborted: false },
      onFirstChunk: vi.fn(),
      onMockMode,
    });

    expect(onMockMode).toHaveBeenCalledWith(true);
  });

  it("calls onMockMode(false) when X-Mock-Mode header is absent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(makeStream())));

    const onMockMode = vi.fn();

    await streamAudioToSourceBuffer({
      text: "hi",
      sourceBuffer: makeSourceBuffer() as any,
      mediaSource: makeMediaSource() as any,
      signal: { aborted: false },
      onFirstChunk: vi.fn(),
      onMockMode,
    });

    expect(onMockMode).toHaveBeenCalledWith(false);
  });

  it("throws with the error body when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(null, { ok: false, status: 500 }))
    );

    await expect(
      streamAudioToSourceBuffer({
        text: "hi",
        sourceBuffer: makeSourceBuffer() as any,
        mediaSource: makeMediaSource() as any,
        signal: { aborted: false },
        onFirstChunk: vi.fn(),
        onMockMode: vi.fn(),
      })
    ).rejects.toThrow("HTTP 500");
  });

  it("throws when audio/mpeg is not supported by MediaSource", async () => {
    vi.stubGlobal("MediaSource", { isTypeSupported: vi.fn().mockReturnValue(false) });

    await expect(
      streamAudioToSourceBuffer({
        text: "hi",
        sourceBuffer: makeSourceBuffer() as any,
        mediaSource: makeMediaSource() as any,
        signal: { aborted: false },
        onFirstChunk: vi.fn(),
        onMockMode: vi.fn(),
      })
    ).rejects.toThrow("audio/mpeg is not supported");
  });

  it("skips appending and endOfStream when signal is already aborted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(makeStream(new Uint8Array([1]))))
    );

    const sourceBuffer = makeSourceBuffer();
    const mediaSource = makeMediaSource();

    await streamAudioToSourceBuffer({
      text: "hi",
      sourceBuffer: sourceBuffer as any,
      mediaSource: mediaSource as any,
      signal: { aborted: true },
      onFirstChunk: vi.fn(),
      onMockMode: vi.fn(),
    });

    expect(sourceBuffer.appendBuffer).not.toHaveBeenCalled();
    expect(mediaSource.endOfStream).not.toHaveBeenCalled();
  });
});
