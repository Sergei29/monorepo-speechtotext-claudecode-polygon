"use client";

import { useEffect, useRef, useState } from "react";
import { streamAudioToSourceBuffer } from "@/lib/streamAudio";

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

      const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");

      await streamAudioToSourceBuffer({
        text,
        sourceBuffer,
        mediaSource,
        signal: { get aborted() { return aborted; } },
        onFirstChunk: () => {
          audio.play().catch((err: Error) => {
            if (err.name !== "AbortError") console.error(err);
          });
        },
        onMockMode: setIsMock,
      });
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
