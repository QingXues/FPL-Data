"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getManager } from "@/lib/queries";

export default function Home() {
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const id = parseInt(teamId.trim(), 10);
      if (isNaN(id)) {
        setError("Please enter a valid Team ID.");
        setLoading(false);
        return;
      }

      // Check if data already exists
      const existing = await getManager(id);
      if (existing) {
        router.push(`/players/${id}`);
        return;
      }

      // Trigger collection
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to collect data.");
        setLoading(false);
        return;
      }

      router.push(`/players/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">FPL Analytics</h1>
          <p className="mt-2 text-slate-400">Enter your Fantasy Premier League Team ID to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-slate-300 mb-1">
              Team ID
            </label>
            <input
              id="teamId"
              type="number"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="e.g. 12345"
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Collecting data...
              </span>
            ) : (
              "Load Data"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Your Team ID can be found in the URL when viewing your team on the FPL website.
        </p>
      </div>
    </main>
  );
}
