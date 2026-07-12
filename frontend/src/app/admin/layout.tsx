"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getAdminAccessToken, clearAdminTokens } from "@/lib/api";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Stations", href: "/admin/stations" },
  { label: "Trains", href: "/admin/trains" },
  { label: "Routes", href: "/admin/routes" },
  { label: "Schedules", href: "/admin/schedules" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = getAdminAccessToken();

  useEffect(() => {
    if (pathname !== "/admin/login" && !token) {
      router.replace("/admin/login");
    }
  }, [pathname, token, router]);

  if (pathname === "/admin/login") {
    return (
      <div className="flex flex-1 flex-col bg-zinc-50">
        {children}
      </div>
    );
  }

  if (!token) return null;

  function handleLogout() {
    clearAdminTokens();
    router.push("/admin/login");
  }

  return (
    <div className="flex flex-1">
      <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white">
        <div className="flex h-14 items-center border-b border-zinc-200 px-4">
          <Link href="/admin" className="text-lg font-bold tracking-tight">
            IRCT Admin
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-200 p-3">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-zinc-50 p-6">{children}</main>
    </div>
  );
}
