"use server";

import { speechify } from "@/lib/speechify";
import type {  TtsState } from "@/types";
import { initialTtsState } from "@/constants";

export const ttsAction = async (
  _prevState: TtsState,
  formData: FormData
): Promise<TtsState> => {
  const text = formData.get("text");

  if (!text || typeof text !== "string" || !text.trim()) {
    return { ...initialTtsState, error: "Text is required" };
  }

  try {
    const result = await speechify.textToSpeech({ text: text.trim() });
    return {
      audioData: result.audioData,
      audioFormat: result.audioFormat,
      mock: result.mock,
      error: null,
    };
  } catch (err) {
    return {
      ...initialTtsState,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};
