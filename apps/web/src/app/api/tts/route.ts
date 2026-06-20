import { PassThrough, Readable } from "stream";
import { type NextRequest } from "next/server";
import { speechify } from "@/lib/speechify";

const toWebStream = (nodeStream: Readable): ReadableStream<Uint8Array> => {
  const pass = new PassThrough();
  nodeStream.pipe(pass);
  return Readable.toWeb(pass) as ReadableStream<Uint8Array>;
};

// Node.js runtime required — speechify-client uses Node.js 'stream' internally
export const runtime = "nodejs";

export const POST = async (request: NextRequest): Promise<Response> => {
  let text: string;
  try {
    const body = await request.json();
    text = body?.text;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "text field is required" }, { status: 400 });
  }

  try {
    const nodeStream = await speechify.textToSpeechStream({ text: text.trim() });
    const webStream = toWebStream(nodeStream);

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Mock-Mode": String(speechify.isMockMode),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
