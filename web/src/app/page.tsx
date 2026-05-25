"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getManager } from "@/lib/queries";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const MOCK_TEAM_ID = 12345;
const ACTIVE_TEAM_KEY = "fpl.activeTeamId";
const ADD_TEAM_KEY = "fpl.addTeam";

interface TeamAccount {
  teamId: number;
  playerName: string;
}
export default function Home() {
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const addingTeam = new URLSearchParams(window.location.search).get("addTeam") === "1"
      || window.localStorage.getItem(ADD_TEAM_KEY) === "true";
    if (addingTeam) {
      window.localStorage.removeItem(ADD_TEAM_KEY);
      setShowForm(true);
      return;
    }

    const activeTeamId = window.localStorage.getItem(ACTIVE_TEAM_KEY);
    if (activeTeamId) {
      router.replace("/players");
      return;
    }

    setShowForm(true);
  }, [router]);

  const saveTeamAccount = (account: TeamAccount) => {
    window.localStorage.setItem(ACTIVE_TEAM_KEY, String(account.teamId));

    const rawAccounts = window.localStorage.getItem("fpl.teamAccounts");
    const accounts = rawAccounts ? JSON.parse(rawAccounts) as TeamAccount[] : [];
    const nextAccounts = [
      account,
      ...accounts.filter((item) => item.teamId !== account.teamId),
    ];
    window.localStorage.setItem("fpl.teamAccounts", JSON.stringify(nextAccounts));
  };

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
        saveTeamAccount({ teamId: id, playerName: existing.player_name });
        router.push("/players");
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

      const collected = await getManager(id);
      if (!collected) {
        setError(
          USE_MOCK
            ? `当前是示例数据模式，请使用队伍 ID ${MOCK_TEAM_ID}`
            : "采集已完成，但没有读到队伍数据，请检查队伍 ID 或数据库读取权限"
        );
        setLoading(false);
        return;
      }

      saveTeamAccount({ teamId: id, playerName: collected.player_name });
      router.push("/players");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "发生错误");
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#37003c]">
            FPL 数据平台
          </h1>
          <p className="mt-2 text-sm text-gray-500">正在打开已保存的队伍...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#37003c]">
            FPL 数据平台
          </h1>
          <p className="mt-2 text-gray-500">
            添加一个 Fantasy Premier League 队伍
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
