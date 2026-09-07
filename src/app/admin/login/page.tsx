"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getStoredAdminUser,
  loginWithHardcodedAdmin,
} from "../_lib/adminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to exams
  useEffect(() => {
    const existing = getStoredAdminUser();
    if (existing) {
      router.replace("/admin/exams");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const ok = await loginWithHardcodedAdmin(username, password);
    if (ok) {
      router.replace("/admin/exams");
    } else {
      setError("Invalid credentials. Please use admin / admin.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xl shadow-indigo-600/30 mx-auto text-lg">
            LF
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Langfens Admin Portal
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to manage IELTS exams, sections, and question banks.
          </p>
        </div>

        {/* Hardcoded Credentials Hint Card */}
        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Hardcoded Credentials Configured
          </div>
          <p className="text-[11px] text-indigo-300/80 font-mono">
            Username: <strong className="text-white">admin</strong> | Password:{" "}
            <strong className="text-white">admin</strong>
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Signing In..." : "Sign In as Admin"}
          </button>
        </form>

        {/* Exit back link */}
        <div className="pt-2 text-center border-t border-slate-800/80">
          <Link
            href="/home"
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            ← Back to Learner Application
          </Link>
        </div>
      </div>
    </div>
  );
}
