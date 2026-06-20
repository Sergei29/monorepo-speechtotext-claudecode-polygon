const MIME_TYPE = "audio/mpeg";

export async function streamAudioToSourceBuffer({
  text,
  sourceBuffer,
  mediaSource,
  signal,
  onFirstChunk,
  onMockMode,
}: {
  text: string;
  sourceBuffer: SourceBuffer;
  mediaSource: MediaSource;
  signal: { aborted: boolean };
  onFirstChunk: () => void;
  onMockMode: (isMock: boolean) => void;
}): Promise<void> {
  if (!MediaSource.isTypeSupported(MIME_TYPE)) {
    throw new Error(`${MIME_TYPE} is not supported by MediaSource in this browser`);
  }

  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok || !response.body) {
    const msg = await response.text().catch(() => `HTTP ${response.status}`);
    throw new Error(msg);
  }

  onMockMode(response.headers.get("X-Mock-Mode") === "true");

  const reader = response.body.getReader();
  let firstChunk = true;

  const waitForUpdateEnd = () =>
    new Promise<void>((resolve) => {
      sourceBuffer.addEventListener("updateend", () => resolve(), { once: true });
    });

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;
    if (sourceBuffer.updating) await waitForUpdateEnd();
    if (signal.aborted) break;
    sourceBuffer.appendBuffer(value);
    if (firstChunk) {
      firstChunk = false;
      onFirstChunk();
    }
  }

  if (!signal.aborted) {
    if (sourceBuffer.updating) await waitForUpdateEnd();
    mediaSource.endOfStream();
  }
}
