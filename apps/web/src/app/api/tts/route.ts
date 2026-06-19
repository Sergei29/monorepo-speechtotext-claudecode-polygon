import { SpeechifyWrapper } from "@repo/speechify-client";
import { type NextRequest } from "next/server";

const speechify = new SpeechifyWrapper();

export async function POST(request: NextRequest) {
  let text: string;
  try {
    const body = await request.json();
    text = body?.text;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return Response.json({ error: "text field is required" }, { status: 400 });
  }

  try {
    const result = await speechify.textToSpeech({ text: text.trim() });

    const audioBytes = Buffer.from(result.audioData, "base64");
    const mimeType =
      result.audioFormat === "mp3"
        ? "audio/mpeg"
        : result.audioFormat === "ogg"
          ? "audio/ogg"
          : result.audioFormat === "aac"
            ? "audio/aac"
            : result.audioFormat === "pcm"
              ? "audio/pcm"
              : "audio/wav";

    return new Response(audioBytes, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(audioBytes.byteLength),
        "X-Mock-Mode": String(result.mock),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
