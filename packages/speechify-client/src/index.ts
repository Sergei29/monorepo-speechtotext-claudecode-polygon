import { PassThrough, Readable } from "stream";
import { SpeechifyClient } from "@speechify/api";

const MOCK_AUDIO_URL = "https://samplelib.com/mp3/sample-speech-1m.mp3";

export interface TTSRequest {
  text: string;
  voiceId?: string;
  audioFormat?: "mp3" | "wav" | "ogg" | "aac" | "pcm";
}

export interface TTSStreamRequest {
  text: string;
  voiceId?: string;
  accept?: "audio/mpeg" | "audio/ogg" | "audio/aac" | "audio/pcm";
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

const fetchMockAsBase64 = async (): Promise<string> => {
  const res = await fetch(MOCK_AUDIO_URL);
  if (!res.ok) throw new Error(`Mock audio fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer()).toString("base64");
};

const fetchMockAsStream = async (): Promise<Readable> => {
  const res = await fetch(MOCK_AUDIO_URL);
  if (!res.ok) throw new Error(`Mock audio fetch failed: ${res.status}`);

  const pass = new PassThrough();
  const reader = res.body!.getReader();

  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          pass.end();
          break;
        }
        pass.push(value);
      }
    } catch (err) {
      pass.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return pass;
};

export class SpeechifyWrapper {
  private readonly mockMode: boolean;
  private client: SpeechifyClient | null = null;

  constructor(config: SpeechifyWrapperConfig = {}) {
    this.mockMode = config.mockMode ?? process.env.SPEECHIFY_MOCK_MODE === "true";

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

  textToSpeech = async (request: TTSRequest): Promise<TTSResponse> => {
    const { text, voiceId = "george", audioFormat = "mp3" } = request;

    if (this.mockMode) {
      return {
        audioData: await fetchMockAsBase64(),
        audioFormat: "mp3",
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
  };

  textToSpeechStream = async (request: TTSStreamRequest): Promise<Readable> => {
    const { text, voiceId = "george", accept = "audio/mpeg" } = request;

    if (this.mockMode) {
      return fetchMockAsStream();
    }

    return this.client!.tts.audio.stream({
      input: text,
      voiceId,
      accept,
      model: "simba-english",
    });
  };

  get isMockMode(): boolean {
    return this.mockMode;
  }
}
