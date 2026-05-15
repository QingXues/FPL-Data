import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeague, getClassicStandings, getManagerNames } from "@/lib/queries";
import MultiLineChart from "@/components/MultiLineChart";

interface Props {
  params: Promise<{ leagueId: string }>;
}

export const dynamic = "force-dynamic";

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default async function ClassicLeaguePage({ params }: Props) {
  const { leagueId: leagueIdStr } = await params;
  const leagueId = parseInt(leagueIdStr, 10);

  const league = await getLeague(leagueId);
  if (!league || league.league_type !== "classic") notFound();

  const standings = await getClassicStandings(leagueId);

  // Resolve names
  const teamIds = Array.from(new Set(standings.map((s) => s.team_id)));
  const managers = await getManagerNames(teamIds);
  const teamNames = new Map(managers.map((m) => [m.team_id, m.player_name]));

  // Group by team_id
  const teamMap = new Map<number, string>();
  const byEvent = new Map<number, Map<number, { rank: number; team_id: number; total: number; event_total: number }>>();

  for (const s of standings) {
    teamMap.set(s.team_id, teamNames.get(s.team_id) || `Team ${s.team_id}`);
    if (!byEvent.has(s.event)) byEvent.set(s.event, new Map());
    byEvent.get(s.event)!.set(s.team_id, {
      rank: s.rank,
      team_id: s.team_id,
      total: s.total,
      event_total: s.event_total,
    });
  }

  const events = Array.from(byEvent.keys()).sort((a, b) => a - b);
  const allTeamIds = Array.from(teamMap.keys());

  const totalData: Record<string, number | string>[] = events.map((ev) => {
    const row: Record<string, number | string> = { event: ev };
    const eventMap = byEvent.get(ev)!;
    for (const tid of allTeamIds) {
      const s = eventMap.get(tid);
      row[`team_${tid}`] = s ? s.total : 0;
    }
    return row;
  });

  const rankData: Record<string, number | string>[] = events.map((ev) => {
    const row: Record<string, number | string> = { event: ev };
    const eventMap = byEvent.get(ev)!;
    for (const tid of allTeamIds) {
      const s = eventMap.get(tid);
      row[`team_${tid}`] = s ? s.rank : 0;
    }
    return row;
  });

  const totalLines = allTeamIds.map((tid, i) => ({
    key: `team_${tid}`,
    color: COLORS[i % COLORS.length],
    name: teamMap.get(tid) || `Team ${tid}`,
  }));

  const rankLines = totalLines;

  // Current standings (last event)
  const lastEvent = events[events.length - 1];
  const currentStandings = lastEvent
    ? Array.from(byEvent.get(lastEvent)!.values()).sort((a, b) => a.rank - b.rank)
    : [];

  // Per-event best/worst
  const eventStats = events.map((ev) => {
    const eventMap = byEvent.get(ev)!;
    const scores = Array.from(eventMap.values());
    const best = scores.reduce((b, s) => (s.event_total > b.event_total ? s : b), scores[0]);
    const worst = scores.reduce((w, s) => (s.event_total < w.event_total ? s : w), scores[0]);
    return { event: ev, best, worst };
  });

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{league.league_name}</h1>
            <p className="text-slate-400">Classic League · {league.team_count} teams</p>
          </div>
          <Link href="/" className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm">
            Back
          </Link>
        </div>

        {/* Current Standings */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Standings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">Team</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-right py-2">Last GW</th>
                </tr>
              </thead>
              <tbody>
                {currentStandings.map((s) => (
                  <tr key={s.team_id} className="border-b border-slate-700/50">
                    <td className="py-2 font-medium">{s.rank}</td>
                    <td className="py-2">{teamNames.get(s.team_id) || `Team ${s.team_id}`}</td>
                    <td className="py-2 text-right font-bold">{s.total}</td>
                    <td className="py-2 text-right text-slate-400">{s.event_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4">Total Points Trend</h2>
            <MultiLineChart data={totalData} lines={totalLines} />
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4">Rank Trend</h2>
            <MultiLineChart data={rankData} lines={rankLines} yReversed />
          </div>
        </div>

        {/* Per-event best/worst */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Gameweek Best / Worst</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="text-left py-2">GW</th>
                  <th className="text-left py-2">Best</th>
                  <th className="text-right py-2">Pts</th>
                  <th className="text-left py-2">Worst</th>
                  <th className="text-right py-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {eventStats.map((es) => (
                  <tr key={es.event} className="border-b border-slate-700/50">
                    <td className="py-2">{es.event}</td>
                    <td className="py-2 text-emerald-400">{teamNames.get(es.best.team_id) || `Team ${es.best.team_id}`}</td>
                    <td className="py-2 text-right font-bold">{es.best.event_total}</td>
                    <td className="py-2 text-red-400">{teamNames.get(es.worst.team_id) || `Team ${es.worst.team_id}`}</td>
                    <td className="py-2 text-right font-bold">{es.worst.event_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
