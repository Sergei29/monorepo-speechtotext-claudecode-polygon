"use client";

import { useRef, useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }

      setIsMock(res.headers.get("X-Mock-Mode") === "true");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      setTimeout(() => audioRef.current?.play(), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Text to Speech
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Powered by Speechify
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech..."
            rows={5}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700 resize-none"
          />

          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="w-full rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Generating..." : "Convert to Speech"}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {audioUrl && (
          <div className="space-y-2">
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full"
            />
            {isMock && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Mock mode — set{" "}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                  SPEECHIFY_MOCK_MODE=false
                </code>{" "}
                and add your API key to use real speech synthesis.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
