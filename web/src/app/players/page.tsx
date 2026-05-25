"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getManager,
  getGameweekScores,
  getGameweekPicks,
  getManagerSummary,
  getTransfers,
  getChips,
  getManagerLeagues,
  getPlayerNames,
} from "@/lib/queries";
import ScoreChart from "@/components/ScoreChart";
import RankChart from "@/components/RankChart";
import PlayerContributionChart from "@/components/PlayerContributionChart";
import LeagueCard from "@/components/LeagueCard";

const ACTIVE_TEAM_KEY = "fpl.activeTeamId";
const ADD_TEAM_KEY = "fpl.addTeam";

type Manager = Awaited<ReturnType<typeof getManager>>;
type GameweekScore = Awaited<ReturnType<typeof getGameweekScores>>[number];
type GameweekPick = Awaited<ReturnType<typeof getGameweekPicks>>[number];
type ManagerSummary = Awaited<ReturnType<typeof getManagerSummary>>;
type Transfer = Awaited<ReturnType<typeof getTransfers>>[number];
type Chip = Awaited<ReturnType<typeof getChips>>[number];
type ManagerLeague = Awaited<ReturnType<typeof getManagerLeagues>>[number];

interface PlayerData {
  manager: NonNullable<Manager>;
  scores: GameweekScore[];
  picks: GameweekPick[];
  summary: ManagerSummary;
  transfers: Transfer[];
  chips: Chip[];
  leagues: ManagerLeague[];
  transferNameMap: Map<number, string>;
  chartData: { name: string; points: number }[];
}

export default function PlayerPage() {
  const [data, setData] = useState<PlayerData | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadPlayer() {
      const storedTeamId = window.localStorage.getItem(ACTIVE_TEAM_KEY);
      const teamId = storedTeamId ? Number(storedTeamId) : NaN;
      if (!Number.isFinite(teamId)) {
        router.replace("/");
        return;
      }

      const manager = await getManager(teamId);
      if (!manager) {
        window.localStorage.removeItem(ACTIVE_TEAM_KEY);
        router.replace("/");
        return;
      }

      const [scores, picks, summary, transfers, chips, leagues] = await Promise.all([
        getGameweekScores(teamId),
        getGameweekPicks(teamId),
        getManagerSummary(teamId),
        getTransfers(teamId),
        getChips(teamId),
        getManagerLeagues(teamId),
      ]);

      const transferElementIds = new Set<number>();
      for (const t of transfers) {
        transferElementIds.add(t.element_in);
        transferElementIds.add(t.element_out);
      }
      const transferPlayerNames = await getPlayerNames(Array.from(transferElementIds));
      const transferNameMap = new Map(transferPlayerNames.map((p) => [p.element, p.web_name]));

      const playerMap = new Map<number, { points: number; name: string }>();
      for (const p of picks) {
        if (p.points === null) continue;
        const contrib = p.points * p.multiplier;
        const existing = playerMap.get(p.player_id);
        if (existing) {
          existing.points += contrib;
        } else {
          playerMap.set(p.player_id, { points: contrib, name: `Player #${p.player_id}` });
        }
      }

      const playerNames = await getPlayerNames(Array.from(playerMap.keys()));
      const nameMap = new Map(playerNames.map((p) => [p.element, p.web_name]));
      for (const [element, item] of playerMap.entries()) {
        const name = nameMap.get(element);
        if (name) item.name = name;
      }

      const chartData = Array.from(playerMap.entries())
        .map(([element, item]) => ({ element, ...item }))
        .filter((item) => item.points > 0)
        .sort((a, b) => b.points - a.points)
        .map((item) => ({ name: item.name, points: item.points }));

      if (!cancelled) {
        setData({ manager, scores, picks, summary, transfers, chips, leagues, transferNameMap, chartData });
      }
    }

    loadPlayer().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "加载队伍数据失败");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleAddTeam = () => {
    window.localStorage.setItem(ADD_TEAM_KEY, "true");
    router.push("/?addTeam=1");
  };

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="border-l-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-gray-500">正在加载队伍数据...</p>
      </main>
    );
  }

  const { manager, scores, picks, summary, transfers, chips, leagues, transferNameMap, chartData } = data;
  const totalPoints = scores.length > 0 ? scores[scores.length - 1].total_points : 0;
  const avgPoints = scores.length > 0
    ? (scores.reduce((s, g) => s + g.points, 0) / scores.length).toFixed(1)
    : "0";
  const bestGW = scores.reduce((best, g) => (g.points > best.points ? g : best), scores[0] || { event: 0, points: 0 });
  const worstGW = scores.reduce((worst, g) => (g.points < worst.points ? g : worst), scores[0] || { event: 0, points: 0 });

  const captainPicks = picks.filter((p) => p.is_captain && p.points !== null);
  const computedCaptainPoints = captainPicks.reduce((s, p) => s + (p.points || 0) * p.multiplier, 0);

  const benchPicks = picks.filter((p) => p.position >= 12 && p.points !== null);
  const computedBenchPoints = benchPicks.reduce((s, p) => s + (p.points || 0), 0);
  const captainPoints = summary?.captain_points ?? computedCaptainPoints;
  const benchPoints = summary?.bench_points ?? computedBenchPoints;
  const totalTransfers = transfers.length;
  const transferCost = scores.reduce((s, g) => s + g.event_transfers_cost, 0);
  const chipData = chips.map((c) => {
    const gw = scores.find((s) => s.event === c.event);
    return { ...c, points: gw?.points ?? 0 };
  });
  const avgScore = scores.length > 0
    ? scores.reduce((s, g) => s + g.points, 0) / scores.length
    : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#37003c]">{manager.player_name}</h1>
          <p className="text-sm text-gray-500">队伍 ID: {manager.team_id}</p>
        </div>
        <button
          type="button"
          onClick={handleAddTeam}
          className="border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-[#37003c] hover:text-[#37003c]"
        >
          添加队伍
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="总得分" value={totalPoints.toLocaleString()} />
        <StatCard label="场均得分" value={avgPoints} />
        <StatCard label="最高分轮次" value={`GW${bestGW.event}: ${bestGW.points}`} />
        <StatCard label="最低分轮次" value={`GW${worstGW.event}: ${worstGW.points}`} />
        <StatCard label="队长得分" value={captainPoints.toLocaleString()} />
        <StatCard label="替补得分" value={benchPoints.toLocaleString()} />
        <StatCard label="转会扣分" value={`-${transferCost}`} />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">每轮得分</h2>
          <ScoreChart data={scores.map((s) => ({ event: s.event, points: s.points }))} />
        </div>
        <div className="border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">总排名趋势</h2>
          <RankChart data={scores.map((s) => ({ event: s.event, rank: s.overall_rank ?? null }))} />
        </div>
      </div>

      <div className="mb-8 border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">球员贡献排行</h2>
        <PlayerContributionChart data={chartData} />
      </div>

      <div className="mb-8 border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">卡片使用</h2>
        {chipData.length === 0 ? (
          <p className="text-sm text-gray-500">尚未使用卡片</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {chipData.map((c) => (
              <div key={`${c.name}-${c.event}`} className="border border-gray-200 p-3">
                <div className="text-xs uppercase text-gray-500">{c.name.toUpperCase()}</div>
                <div className="text-lg font-bold text-[#37003c]">GW{c.event}</div>
                <div className="text-sm font-semibold text-green-700">{c.points} pts</div>
                <div className="text-xs text-gray-400">
                  vs avg {avgScore.toFixed(1)} ({c.points >= avgScore ? "+" : ""}{(c.points - avgScore).toFixed(1)})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8 border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          转会 ({totalTransfers} 次, -{transferCost} 分)
        </h2>
        {transfers.length === 0 ? (
          <p className="text-sm text-gray-500">无转会记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
                <tr>
                  <th className="pb-2 pr-4 font-medium">轮次</th>
                  <th className="pb-2 pr-4 font-medium">转出</th>
                  <th className="pb-2 font-medium">转入</th>
                </tr>
              </thead>
              <tbody>
                {transfers.slice(0, 20).map((t, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{t.event}</td>
                    <td className="py-2 pr-4 text-red-600">{transferNameMap.get(t.element_out) || `#${t.element_out}`}</td>
                    <td className="py-2 text-green-700">{transferNameMap.get(t.element_in) || `#${t.element_in}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">联赛</h2>
        {leagues.length === 0 ? (
          <p className="text-sm text-gray-500">未找到联赛</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {leagues.map((l) => {
              const league = (l as Record<string, unknown>).leagues as { league_id: number; league_name: string; league_type: string; team_count: number } | null;
              if (!league) return null;
              return (
                <LeagueCard
                  key={league.league_id}
                  leagueId={league.league_id}
                  leagueName={league.league_name}
                  leagueType={league.league_type}
                />
              );
            })}</div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-gray-200 p-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-bold text-[#37003c]">{value}</div>
    </div>
  );
}
