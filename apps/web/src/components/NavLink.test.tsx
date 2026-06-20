import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NavLink } from "./NavLink";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NavLink", () => {
  describe("when the link is inactive", () => {
    it("renders a clickable anchor element", () => {
      mockUsePathname.mockReturnValue("/text-to-speech");
      render(<NavLink href="/">Streaming</NavLink>);
      expect(screen.getByRole("link", { name: "Streaming" })).toBeInTheDocument();
    });

    it("anchor points to the correct href", () => {
      mockUsePathname.mockReturnValue("/text-to-speech");
      render(<NavLink href="/">Streaming</NavLink>);
      expect(screen.getByRole("link", { name: "Streaming" })).toHaveAttribute("href", "/");
    });
  });

  describe("when the link is active", () => {
    it("does not render a clickable link", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavLink href="/">Streaming</NavLink>);
      expect(screen.queryByRole("link")).toBeNull();
    });

    it("renders the label text", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavLink href="/">Streaming</NavLink>);
      expect(screen.getByText("Streaming")).toBeInTheDocument();
    });

    it("marks the element as current page", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavLink href="/">Streaming</NavLink>);
      expect(screen.getByText("Streaming")).toHaveAttribute("aria-current", "page");
    });

    it("applies underline styling", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavLink href="/">Streaming</NavLink>);
      expect(screen.getByText("Streaming")).toHaveClass("underline");
    });
  });

  it("uses exact pathname match so nested routes do not trigger active state", () => {
    mockUsePathname.mockReturnValue("/text-to-speech/settings");
    render(<NavLink href="/text-to-speech">Text to Speech</NavLink>);
    expect(screen.getByRole("link", { name: "Text to Speech" })).toBeInTheDocument();
  });
});
