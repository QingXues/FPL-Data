import { notFound } from "next/navigation";
import Link from "next/link";
import LeagueCard from "@/components/LeagueCard";
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

  // Score stats
  const totalPoints = scores.length > 0 ? scores[scores.length - 1].total_points : 0;
  const avgPoints = scores.length > 0
    ? (scores.reduce((s, g) => s + g.points, 0) / scores.length).toFixed(1)
    : "0";
  const bestGW = scores.reduce((best, g) => (g.points > best.points ? g : best), scores[0] || { event: 0, points: 0 });
  const worstGW = scores.reduce((worst, g) => (g.points < worst.points ? g : worst), scores[0] || { event: 0, points: 0 });

  // Captain stats
  const captainPicks = picks.filter((p) => p.is_captain && p.points !== null);
  const captainPoints = captainPicks.reduce((s, p) => s + (p.points || 0) * p.multiplier, 0);
  const captainSuccess = scores.length > 0
    ? captainPicks.filter((cp) => {
        const gwPicks = picks.filter((p) => p.event === cp.event && p.points !== null);
        const maxPts = Math.max(...gwPicks.map((p) => p.points || 0));
        return (cp.points || 0) >= maxPts;
      }).length
    : 0;

  // Bench stats
  const benchPicks = picks.filter((p) => p.position >= 12 && p.points !== null);
  const benchPoints = benchPicks.reduce((s, p) => s + (p.points || 0), 0);

  // Transfer stats
  const totalTransfers = transfers.length;
  const transferCost = scores.reduce((s, g) => s + g.event_transfers_cost, 0);

  // Player contribution (aggregate points * multiplier across all GWs)
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
  // Resolve names from player_history
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

  // Chip stats
  const chipData = chips.map((c) => {
    const gw = scores.find((s) => s.event === c.event);
    return { ...c, points: gw?.points ?? 0 };
  });
  const avgScore = scores.length > 0
    ? scores.reduce((s, g) => s + g.points, 0) / scores.length
    : 0;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{manager.player_name}</h1>
            <p className="text-slate-400">Team ID: {manager.team_id}</p>
          </div>
          <Link href="/" className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm">
            Back
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Points" value={totalPoints.toLocaleString()} />
          <StatCard label="Avg / GW" value={avgPoints} />
          <StatCard label="Best GW" value={`GW${bestGW.event}: ${bestGW.points}`} />
          <StatCard label="Worst GW" value={`GW${worstGW.event}: ${worstGW.points}`} />
          <StatCard label="Captain Points" value={captainPoints.toLocaleString()} />
          <StatCard label="Captain Success" value={`${captainSuccess}/${captainPicks.length}`} />
          <StatCard label="Bench Points" value={benchPoints.toLocaleString()} />
          <StatCard label="Transfer Cost" value={`-${transferCost}`} />
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4">Points per Gameweek</h2>
            <ScoreChart data={scores.map((s) => ({ event: s.event, points: s.points }))} />
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4">Overall Rank Trend</h2>
            <RankChart data={scores.map((s) => ({ event: s.event, rank: s.rank }))} />
          </div>
        </div>

        {/* Player Contributions */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Top Player Contributions</h2>
          <PlayerContributionChart data={chartData} />
        </div>

        {/* Chips */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Chip Usage</h2>
          {chipData.length === 0 ? (
            <p className="text-slate-400">No chips used yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {chipData.map((c) => (
                <div key={`${c.name}-${c.event}`} className="bg-slate-700 rounded-lg p-3">
                  <div className="text-xs text-slate-400 uppercase">{c.name.toUpperCase()}</div>
                  <div className="text-xl font-bold">GW{c.event}</div>
                  <div className="text-sm text-emerald-400">{c.points} pts</div>
                  <div className="text-xs text-slate-400">
                    vs avg {avgScore.toFixed(1)} ({c.points >= avgScore ? "+" : ""}{(c.points - avgScore).toFixed(1)})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transfers */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">
            Transfers ({totalTransfers} total, -{transferCost} pts)
          </h2>
          {transfers.length === 0 ? (
            <p className="text-slate-400">No transfers recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="text-left py-2">GW</th>
                    <th className="text-left py-2">Out</th>
                    <th className="text-left py-2">In</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.slice(0, 20).map((t, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-2">{t.event}</td>
                      <td className="py-2 text-red-400">#{t.element_out}</td>
                      <td className="py-2 text-emerald-400">#{t.element_in}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leagues */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Leagues</h2>
          {leagues.length === 0 ? (
            <p className="text-slate-400">No leagues found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
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
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
