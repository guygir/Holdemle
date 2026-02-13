"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => searchParams.get("redirect") || "/game",
    [searchParams]
  );
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: nickname.trim(),
        password,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Login failed");
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Link
          href="/"
          className="text-base lg:text-lg text-gray-600 hover:text-[#1a1a1b] mb-4 block"
        >
          ← Back to Home
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1a1b] mb-6">
          {redirectTo === "/game"
            ? "Sign in to play today's puzzle"
            : "Login to Hold'emle"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nickname"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname"
              required
              className="w-full px-4 py-2 border border-[#d3d6da] rounded-lg focus:ring-2 focus:ring-[#6aaa64] focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#d3d6da] rounded-lg focus:ring-2 focus:ring-[#6aaa64] focus:border-transparent"
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-[#6aaa64] text-white text-lg font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600 text-base">
          Don&apos;t have an account?{" "}
          <Link
            href={`/auth/signup${redirectTo !== "/game" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="text-[#6aaa64] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center p-6"><p className="text-gray-600">Loading...</p></main>}>
      <LoginForm />
    </Suspense>
  );
}
