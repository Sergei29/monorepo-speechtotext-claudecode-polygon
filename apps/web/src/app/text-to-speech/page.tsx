import { TtsActionForm } from "@/components/TtsActionForm";

const Page = () => (
  <div className="flex flex-1 items-center justify-center p-6">
    <div className="w-full max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Text to Speech</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Server action · full audio returned before playback
        </p>
      </div>
      <TtsActionForm />
    </div>
  </div>
);

export default Page;
