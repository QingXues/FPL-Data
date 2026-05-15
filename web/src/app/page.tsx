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

      const existing = await getManager(id);
      if (existing) {
        router.push(`/players/${id}`);
        return;
      }

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
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#37003c]">
            FPL Analytics
          </h1>
          <p className="mt-2 text-gray-500">
            Enter your Fantasy Premier League Team ID to view stats.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="teamId" className="mb-1 block text-sm font-medium text-gray-700">
              Team ID
            </label>
            <input
              id="teamId"
              type="number"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="e.g. 12345"
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[#37003c] focus:ring-1 focus:ring-[#37003c]"
              required
            />
          </div>

          {error && (
            <div className="border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#37003c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4a0050] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Collecting...
              </span>
            ) : (
              "Load Data"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          Your Team ID is in the URL when viewing your team on fantasy.premierleague.com
        </p>
      </div>
    </main>
  );
}
