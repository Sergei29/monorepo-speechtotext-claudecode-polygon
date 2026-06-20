"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export const NavLink = ({ href, children }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (isActive) {
    return (
      <span
        aria-current="page"
        className="text-sm text-zinc-900 underline dark:text-zinc-50"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      {children}
    </Link>
  );
};
