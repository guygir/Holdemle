"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-[#6aaa64] mb-4">
            Check your email!
          </h1>
          <p className="text-gray-600 mb-6">
            We&apos;ve sent you a link to confirm your account. Click the link
            in your email to get started.
          </p>
          <Link
            href="/game"
            className="inline-block py-3 px-6 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors"
          >
            Continue to Game
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-[#1a1a1b] mb-4 block"
        >
          ← Back to Home
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1a1b] mb-6">
          Create Account
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#d3d6da] rounded-lg focus:ring-2 focus:ring-[#6aaa64] focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-[#d3d6da] rounded-lg focus:ring-2 focus:ring-[#6aaa64] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#6aaa64] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
