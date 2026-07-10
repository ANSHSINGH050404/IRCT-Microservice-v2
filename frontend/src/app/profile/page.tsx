"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, getAccessToken, clearTokens, type User } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/");
      return;
    }

    auth
      .getProfile()
      .then((res) => {
        setUser(res.user);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  function handleLogout() {
    clearTokens();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="text-sm text-zinc-900 underline underline-offset-2">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Email verified</dt>
              <dd>{user?.emailVerified ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Member since</dt>
              <dd>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</dd>
            </div>
          </dl>
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium hover:bg-zinc-100"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
