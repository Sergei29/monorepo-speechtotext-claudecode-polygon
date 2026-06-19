import { SpeechifyClient } from "@speechify/api";

export interface TTSRequest {
  text: string;
  voiceId?: string;
  audioFormat?: "mp3" | "wav" | "ogg" | "aac" | "pcm";
}

export interface TTSResponse {
  audioData: string;
  audioFormat: string;
  mock: boolean;
}

export interface SpeechifyWrapperConfig {
  apiKey?: string;
  mockMode?: boolean;
}

function buildMockWav(): string {
  const sampleRate = 8000;
  const numSamples = 800; // 0.1s of silence
  const dataSize = numSamples;
  const riffSize = 36 + dataSize;

  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(riffSize, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20);  // PCM format
  buf.writeUInt16LE(1, 22);  // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate, 28); // byte rate (8-bit mono)
  buf.writeUInt16LE(1, 32);  // block align
  buf.writeUInt16LE(8, 34);  // bits per sample
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(dataSize, 40);
  buf.fill(0x80, 44); // unsigned 8-bit silence

  return buf.toString("base64");
}

export class SpeechifyWrapper {
  private readonly mockMode: boolean;
  private client: SpeechifyClient | null = null;

  constructor(config: SpeechifyWrapperConfig = {}) {
    this.mockMode =
      config.mockMode ?? process.env.SPEECHIFY_MOCK_MODE === "true";

    if (!this.mockMode) {
      const apiKey = config.apiKey ?? process.env.SPEECHIFY_API_KEY;
      if (!apiKey) {
        throw new Error(
          "SPEECHIFY_API_KEY is required when not in mock mode. Set SPEECHIFY_MOCK_MODE=true to use mock mode."
        );
      }
      this.client = new SpeechifyClient({ token: apiKey });
    }
  }

  async textToSpeech(request: TTSRequest): Promise<TTSResponse> {
    const { text, voiceId = "george", audioFormat = "mp3" } = request;

    if (this.mockMode) {
      return {
        audioData: buildMockWav(),
        audioFormat: "wav",
        mock: true,
      };
    }

    const response = await this.client!.tts.audio.speech({
      input: text,
      voiceId,
      audioFormat,
    });

    return {
      audioData: response.audioData,
      audioFormat: response.audioFormat,
      mock: false,
    };
  }

  get isMockMode(): boolean {
    return this.mockMode;
  }
}
