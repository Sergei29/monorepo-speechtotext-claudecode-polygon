"use client";

import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  text: string;
  onError: (message: string) => void;
}

export const AudioPlayer = ({ text, onError }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMock, setIsMock] = useState(false);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let aborted = false;
    const mediaSource = new MediaSource();
    const objectUrl = URL.createObjectURL(mediaSource);

    // Register the listener BEFORE setting audio.src to avoid sourceopen race
    const sourceOpenPromise = new Promise<void>((resolve) => {
      mediaSource.addEventListener("sourceopen", () => resolve(), { once: true });
    });
    audio.src = objectUrl;

    const run = async () => {
      await sourceOpenPromise;
      URL.revokeObjectURL(objectUrl);

      if (aborted) return;

      const mimeType = "audio/mpeg";
      if (!MediaSource.isTypeSupported(mimeType)) {
        throw new Error(`${mimeType} is not supported by MediaSource in this browser`);
      }

      const sourceBuffer = mediaSource.addSourceBuffer(mimeType);

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok || !response.body) {
        const msg = await response.text().catch(() => `HTTP ${response.status}`);
        throw new Error(msg);
      }

      setIsMock(response.headers.get("X-Mock-Mode") === "true");

      const reader = response.body.getReader();
      let firstChunk = true;

      const waitForUpdateEnd = () =>
        new Promise<void>((resolve) => {
          sourceBuffer.addEventListener("updateend", () => resolve(), { once: true });
        });

      while (!aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        if (sourceBuffer.updating) await waitForUpdateEnd();
        if (aborted) break;
        sourceBuffer.appendBuffer(value);
        if (firstChunk) {
          firstChunk = false;
          audio.play().catch((err: Error) => {
            if (err.name !== "AbortError") console.error(err);
          });
        }
      }

      if (!aborted) {
        if (sourceBuffer.updating) await waitForUpdateEnd();
        mediaSource.endOfStream();
      }
    };

    run().catch((err: Error) => {
      if (!aborted) onErrorRef.current(err.message);
    });

    return () => {
      aborted = true;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      if (mediaSource.readyState === "open") {
        try { mediaSource.endOfStream(); } catch { /* already closed */ }
      }
    };
  }, [text]);

  return (
    <div className="space-y-2">
      <audio ref={audioRef} controls className="w-full" />
      {isMock && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Mock mode —{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            SPEECHIFY_MOCK_MODE=false
          </code>{" "}
          and a real API key to enable live synthesis.
        </p>
      )}
    </div>
  );
};
