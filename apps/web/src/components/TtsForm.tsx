"use client";

import { useState } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";

export const TtsForm = () => {
  const [activeText, setActiveText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = (new FormData(e.currentTarget)).get("text") as string;
    if (!text?.trim()) return;
    setError(null);
    setActiveText(text.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        name="text"
        placeholder="Enter text to convert to speech..."
        rows={5}
        required
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700 resize-none"
      />

      <button
        type="submit"
        className="w-full rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Convert to Speech
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {activeText && (
        <AudioPlayer
          text={activeText}
          onError={(message) => {
            setError(message);
            setActiveText(null);
          }}
        />
      )}
    </form>
  );
};
