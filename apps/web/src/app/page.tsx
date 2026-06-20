import { TtsForm } from "@/components/TtsForm";

const Page = () => (
  <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-6">
    <div className="w-full max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Text to Speech</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Streaming · audio plays as it arrives
        </p>
      </div>

      <TtsForm />
    </div>
  </div>
);

export default Page;
