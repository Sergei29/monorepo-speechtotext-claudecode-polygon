import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { streamAudioToSourceBuffer } from "@/lib/streamAudio";
import { AudioPlayer } from "./AudioPlayer";

vi.mock("@/lib/streamAudio", () => ({
  streamAudioToSourceBuffer: vi.fn(),
}));

const mockStream = vi.mocked(streamAudioToSourceBuffer);

function makeMockMediaSource() {
  return {
    readyState: "open",
    addEventListener: vi.fn((event: string, cb: () => void) => {
      if (event === "sourceopen") cb(); // unblocks sourceOpenPromise immediately
    }),
    addSourceBuffer: vi.fn().mockReturnValue({}),
    endOfStream: vi.fn(),
  };
}

describe("AudioPlayer", () => {
  beforeEach(() => {
    mockStream.mockReset();
    mockStream.mockResolvedValue(undefined);
    vi.stubGlobal(
      "MediaSource",
      vi.fn(function () {
        return makeMockMediaSource();
      })
    );
    URL.createObjectURL = vi.fn().mockReturnValue("blob:fake");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders an audio element with controls", () => {
    const { container } = render(<AudioPlayer text="hello" onError={vi.fn()} />);
    const audio = container.querySelector("audio");
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute("controls");
  });

  it("calls streamAudioToSourceBuffer with the text prop", async () => {
    render(<AudioPlayer text="hello world" onError={vi.fn()} />);

    await waitFor(() => {
      expect(mockStream).toHaveBeenCalledWith(expect.objectContaining({ text: "hello world" }));
    });
  });

  it("shows the mock mode banner when onMockMode is called with true", async () => {
    mockStream.mockImplementation(async ({ onMockMode }) => {
      onMockMode(true);
    });

    render(<AudioPlayer text="hello" onError={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Mock mode/)).toBeInTheDocument();
    });
  });

  it("does not show the mock mode banner by default", () => {
    render(<AudioPlayer text="hello" onError={vi.fn()} />);
    expect(screen.queryByText(/Mock mode/)).not.toBeInTheDocument();
  });

  it("calls onError with the error message when streaming fails", async () => {
    mockStream.mockRejectedValue(new Error("TTS failed"));

    const onError = vi.fn();
    render(<AudioPlayer text="hello" onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("TTS failed");
    });
  });

  it("re-runs streaming when the text prop changes", async () => {
    const { rerender } = render(<AudioPlayer text="first" onError={vi.fn()} />);

    await waitFor(() =>
      expect(mockStream).toHaveBeenCalledWith(expect.objectContaining({ text: "first" }))
    );

    rerender(<AudioPlayer text="second" onError={vi.fn()} />);

    await waitFor(() =>
      expect(mockStream).toHaveBeenCalledWith(expect.objectContaining({ text: "second" }))
    );
  });
});
