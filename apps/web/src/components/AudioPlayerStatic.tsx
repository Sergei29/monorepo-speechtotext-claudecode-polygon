"use client";

import { useEffect, useRef } from "react";

interface AudioPlayerStaticProps {
  audioData: string;
  audioFormat: string;
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

export const AudioPlayerStatic = ({ audioData, audioFormat }: AudioPlayerStaticProps) => {
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

  return <audio ref={audioRef} controls className="w-full" />;
};
