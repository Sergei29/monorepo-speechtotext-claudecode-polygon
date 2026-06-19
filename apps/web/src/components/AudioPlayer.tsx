"use client";

import { useEffect, useRef } from "react";

interface AudioPlayerProps {
  audioData: string;
  audioFormat: string;
  mock: boolean;
}

const mimeForFormat = (format: string): string => {
  switch (format) {
    case "mp3": return "audio/mpeg";
    case "ogg": return "audio/ogg";
    case "aac": return "audio/aac";
    case "pcm": return "audio/pcm";
    default:    return "audio/wav";
  }
};

export const AudioPlayer = ({ audioData, audioFormat, mock }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const bytes = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mimeForFormat(audioFormat) });
    const url = URL.createObjectURL(blob);

    const onCanPlay = () => {
      audio.play().catch((err: Error) => {
        if (err.name !== "AbortError") console.error(err);
      });
    };

    audio.addEventListener("canplay", onCanPlay, { once: true });
    audio.src = url;
    audio.load();

    return () => {
      audio.removeEventListener("canplay", onCanPlay);
      URL.revokeObjectURL(url);
    };
  }, [audioData, audioFormat]);

  return (
    <div className="space-y-2">
      <audio ref={audioRef} controls className="w-full" />
      {mock && (
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
