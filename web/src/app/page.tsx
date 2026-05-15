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
        setError("请输入有效的队伍 ID");
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
        setError(data.error || "数据采集失败");
        setLoading(false);
        return;
      }

      router.push(`/players/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "发生错误");
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#37003c]">
            FPL 数据平台
          </h1>
          <p className="mt-2 text-gray-500">
            输入你的 Fantasy Premier League 队伍 ID 查看数据
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="teamId" className="mb-1 block text-sm font-medium text-gray-700">
              队伍 ID
            </label>
            <input
              id="teamId"
              type="number"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="例如 12345"
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
                采集中...
              </span>
            ) : (
              "加载数据"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          你的队伍 ID 在 fantasy.premierleague.com 查看队伍时的 URL 中
        </p>
      </div>
    </main>
  );
}
