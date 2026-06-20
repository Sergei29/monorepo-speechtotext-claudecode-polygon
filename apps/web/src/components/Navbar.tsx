import Link from "next/link";

const links = [
  { href: "/", label: "Streaming" },
  { href: "/text-to-speech", label: "Text to Speech" },
];

export const Navbar = () => (
  <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
    <div className="mx-auto flex max-w-xl items-center gap-6 px-6 py-4">
      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Speechify</span>
      <div className="flex gap-4">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  </nav>
);
