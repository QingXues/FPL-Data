import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getManager,
  getGameweekScores,
  getGameweekPicks,
  getTransfers,
  getChips,
  getManagerLeagues,
  getPlayerNames,
} from "@/lib/queries";
import ScoreChart from "@/components/ScoreChart";
import RankChart from "@/components/RankChart";
import PlayerContributionChart from "@/components/PlayerContributionChart";
import LeagueCard from "@/components/LeagueCard";

interface Props {
  params: Promise<{ teamId: string }>;
}

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: Props) {
  const { teamId: teamIdStr } = await params;
  const teamId = parseInt(teamIdStr, 10);

  const manager = await getManager(teamId);
  if (!manager) notFound();

  const scores = await getGameweekScores(teamId);
  const picks = await getGameweekPicks(teamId);
  const transfers = await getTransfers(teamId);
  const chips = await getChips(teamId);
  const leagues = await getManagerLeagues(teamId);

  const totalPoints = scores.length > 0 ? scores[scores.length - 1].total_points : 0;
  const avgPoints = scores.length > 0
    ? (scores.reduce((s, g) => s + g.points, 0) / scores.length).toFixed(1)
    : "0";
  const bestGW = scores.reduce((best, g) => (g.points > best.points ? g : best), scores[0] || { event: 0, points: 0 });
  const worstGW = scores.reduce((worst, g) => (g.points < worst.points ? g : worst), scores[0] || { event: 0, points: 0 });

  const captainPicks = picks.filter((p) => p.is_captain && p.points !== null);
  const captainPoints = captainPicks.reduce((s, p) => s + (p.points || 0) * p.multiplier, 0);
  const captainSuccess = scores.length > 0
    ? captainPicks.filter((cp) => {
        const gwPicks = picks.filter((p) => p.event === cp.event && p.points !== null);
        const maxPts = Math.max(...gwPicks.map((p) => p.points || 0));
        return (cp.points || 0) >= maxPts;
      }).length
    : 0;

  const benchPicks = picks.filter((p) => p.position >= 12 && p.points !== null);
  const benchPoints = benchPicks.reduce((s, p) => s + (p.points || 0), 0);

  const totalTransfers = transfers.length;
  const transferCost = scores.reduce((s, g) => s + g.event_transfers_cost, 0);

  const playerMap = new Map<number, { points: number; name: string }>();
  for (const p of picks) {
    if (p.points === null) continue;
    const contrib = p.points * p.multiplier;
    const existing = playerMap.get(p.element);
    if (existing) {
      existing.points += contrib;
    } else {
      playerMap.set(p.element, { points: contrib, name: `Player #${p.element}` });
    }
  }

  const elementIds = Array.from(playerMap.keys());
  const playerNames = await getPlayerNames(elementIds);
  const nameMap = new Map(playerNames.map((p) => [p.element, p.web_name]));
  for (const [element, data] of playerMap.entries()) {
    const name = nameMap.get(element);
    if (name) data.name = name;
  }

  const contributions = Array.from(playerMap.entries())
    .map(([element, data]) => ({ element, ...data }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 15);

  const chartData = contributions.map((c) => ({ name: c.name, points: c.points }));

  const chipData = chips.map((c) => {
    const gw = scores.find((s) => s.event === c.event);
    return { ...c, points: gw?.points ?? 0 };
  });
  const avgScore = scores.length > 0
    ? scores.reduce((s, g) => s + g.points, 0) / scores.length
    : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#37003c]">{manager.player_name}</h1>
          <p className="text-sm text-gray-500">Team ID: {manager.team_id}</p>
        </div>
        <Link href="/" className="border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-[#37003c] hover:text-[#37003c]">
          Back
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Points" value={totalPoints.toLocaleString()} />
        <StatCard label="Avg / GW" value={avgPoints} />
        <StatCard label="Best GW" value={`GW${bestGW.event}: ${bestGW.points}`} />
        <StatCard label="Worst GW" value={`GW${worstGW.event}: ${worstGW.points}`} />
        <StatCard label="Captain Points" value={captainPoints.toLocaleString()} />
        <StatCard label="Captain Success" value={`${captainSuccess}/${captainPicks.length}`} />
        <StatCard label="Bench Points" value={benchPoints.toLocaleString()} />
        <StatCard label="Transfer Cost" value={`-${transferCost}`} />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Points per Gameweek</h2>
          <ScoreChart data={scores.map((s) => ({ event: s.event, points: s.points }))} />
        </div>
        <div className="border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Overall Rank Trend</h2>
          <RankChart data={scores.map((s) => ({ event: s.event, rank: s.rank }))} />
        </div>
      </div>

      <div className="mb-8 border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Top Player Contributions</h2>
        <PlayerContributionChart data={chartData} />
      </div>

      <div className="mb-8 border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Chip Usage</h2>
        {chipData.length === 0 ? (
          <p className="text-sm text-gray-500">No chips used yet.</p>
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
          Transfers ({totalTransfers} total, -{transferCost} pts)
        </h2>
        {transfers.length === 0 ? (
          <p className="text-sm text-gray-500">No transfers recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
                <tr>
                  <th className="pb-2 pr-4 font-medium">GW</th>
                  <th className="pb-2 pr-4 font-medium">Out</th>
                  <th className="pb-2 font-medium">In</th>
                </tr>
              </thead>
              <tbody>
                {transfers.slice(0, 20).map((t, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{t.event}</td>
                    <td className="py-2 pr-4 text-red-600">#{t.element_out}</td>
                    <td className="py-2 text-green-700">#{t.element_in}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Leagues</h2>
        {leagues.length === 0 ? (
          <p className="text-sm text-gray-500">No leagues found.</p>
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
