"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getAccessToken, clearTokens } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const token = getAccessToken();

  if (pathname.startsWith("/admin")) return null;

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  return (
    <nav className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <Link
        href={token ? "/" : "/login"}
        className="text-lg font-bold tracking-tight"
      >
        IRCT
      </Link>

      <div className="flex items-center gap-4">
        {token ? (
          <>
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Search
            </Link>
            <Link
              href="/profile"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
