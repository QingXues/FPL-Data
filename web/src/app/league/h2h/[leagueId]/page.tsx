import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeague, getH2HMatches, getManagerNames } from "@/lib/queries";

interface Props {
  params: Promise<{ leagueId: string }>;
}

export const dynamic = "force-dynamic";

export default async function H2HLeaguePage({ params }: Props) {
  const { leagueId: leagueIdStr } = await params;
  const leagueId = parseInt(leagueIdStr, 10);

  const league = await getLeague(leagueId);
  if (!league || league.league_type !== "h2h") notFound();

  const matches = await getH2HMatches(leagueId);

  // Resolve player names
  const teamIdSet = new Set<number>();
  for (const m of matches) {
    teamIdSet.add(m.entry_1);
    teamIdSet.add(m.entry_2);
  }
  const teamIds = Array.from(teamIdSet);
  const managers = await getManagerNames(teamIds);
  const teamNames = new Map<number, string>();
  for (const tid of teamIds) {
    teamNames.set(tid, `Team ${tid}`);
  }
  for (const m of managers) {
    teamNames.set(m.team_id, m.player_name);
  }

  // Compute stats per team
  const stats = new Map<
    number,
    { wins: number; draws: number; losses: number; gf: number; ga: number; points: number }
  >();

  for (const tid of teamIds) {
    stats.set(tid, { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 });
  }

  for (const m of matches) {
    const s1 = stats.get(m.entry_1)!;
    const s2 = stats.get(m.entry_2)!;
    s1.gf += m.entry_1_points;
    s1.ga += m.entry_2_points;
    s2.gf += m.entry_2_points;
    s2.ga += m.entry_1_points;

    if (m.winner === m.entry_1) {
      s1.wins += 1;
      s1.points += 3;
      s2.losses += 1;
    } else if (m.winner === m.entry_2) {
      s2.wins += 1;
      s2.points += 3;
      s1.losses += 1;
    } else {
      s1.draws += 1;
      s1.points += 1;
      s2.draws += 1;
      s2.points += 1;
    }
  }

  const sortedTeams = Array.from(teamIds).sort((a, b) => {
    const sa = stats.get(a)!;
    const sb = stats.get(b)!;
    if (sb.points !== sa.points) return sb.points - sa.points;
    return (sb.gf - sb.ga) - (sa.gf - sa.ga);
  });

  // Head-to-head matrix
  const h2hMap = new Map<string, { w: number; d: number; l: number; gf: number; ga: number }>();
  for (const m of matches) {
    const key = `${m.entry_1}-${m.entry_2}`;
    const reverseKey = `${m.entry_2}-${m.entry_1}`;
    if (!h2hMap.has(key)) h2hMap.set(key, { w: 0, d: 0, l: 0, gf: 0, ga: 0 });
    if (!h2hMap.has(reverseKey)) h2hMap.set(reverseKey, { w: 0, d: 0, l: 0, gf: 0, ga: 0 });

    const rec = h2hMap.get(key)!;
    const rev = h2hMap.get(reverseKey)!;
    rec.gf += m.entry_1_points;
    rec.ga += m.entry_2_points;
    rev.gf += m.entry_2_points;
    rev.ga += m.entry_1_points;

    if (m.winner === m.entry_1) {
      rec.w += 1;
      rev.l += 1;
    } else if (m.winner === m.entry_2) {
      rec.l += 1;
      rev.w += 1;
    } else {
      rec.d += 1;
      rev.d += 1;
    }
  }

  // Matches list
  const events = Array.from(new Set(matches.map((m) => m.event))).sort((a, b) => a - b);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{league.league_name}</h1>
            <p className="text-slate-400">Head-to-Head League · {league.team_count} teams</p>
          </div>
          <Link href="/" className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm">
            Back
          </Link>
        </div>

        {/* Standings */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Standings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">Team</th>
                  <th className="text-right py-2">P</th>
                  <th className="text-right py-2">W</th>
                  <th className="text-right py-2">D</th>
                  <th className="text-right py-2">L</th>
                  <th className="text-right py-2">GF</th>
                  <th className="text-right py-2">GA</th>
                  <th className="text-right py-2">GD</th>
                  <th className="text-right py-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((tid, i) => {
                  const s = stats.get(tid)!;
                  const played = s.wins + s.draws + s.losses;
                  return (
                    <tr key={tid} className="border-b border-slate-700/50">
                      <td className="py-2 font-medium">{i + 1}</td>
                      <td className="py-2">{teamNames.get(tid)}</td>
                      <td className="py-2 text-right">{played}</td>
                      <td className="py-2 text-right text-emerald-400">{s.wins}</td>
                      <td className="py-2 text-right text-slate-400">{s.draws}</td>
                      <td className="py-2 text-right text-red-400">{s.losses}</td>
                      <td className="py-2 text-right">{s.gf}</td>
                      <td className="py-2 text-right">{s.ga}</td>
                      <td className="py-2 text-right font-bold">{s.gf - s.ga}</td>
                      <td className="py-2 text-right font-bold">{s.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* H2H Matrix */}
        <div className="bg-slate-800 rounded-xl p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Head-to-Head Matrix</h2>
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-2"></th>
                {sortedTeams.map((tid) => (
                  <th key={tid} className="text-center py-2 px-2">
                    {teamNames.get(tid)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((tidA) => (
                <tr key={tidA} className="border-b border-slate-700/50">
                  <td className="py-2 font-medium pr-4">{teamNames.get(tidA)}</td>
                  {sortedTeams.map((tidB) => {
                    if (tidA === tidB) {
                      return <td key={tidB} className="py-2 text-center text-slate-600">-</td>;
                    }
                    const rec = h2hMap.get(`${tidA}-${tidB}`);
                    if (!rec || rec.w + rec.d + rec.l === 0) {
                      return <td key={tidB} className="py-2 text-center text-slate-600">-</td>;
                    }
                    return (
                      <td key={tidB} className="py-2 text-center">
                        <div className="text-xs">
                          <span className="text-emerald-400">{rec.w}</span>
                          <span className="text-slate-400">/{rec.d}/</span>
                          <span className="text-red-400">{rec.l}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {rec.gf}-{rec.ga}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Matches per GW */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Matches</h2>
          <div className="space-y-4">
            {events.map((ev) => {
              const eventMatches = matches.filter((m) => m.event === ev);
              return (
                <div key={ev}>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Gameweek {ev}</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {eventMatches.map((m, i) => {
                      const isWin1 = m.winner === m.entry_1;
                      const isWin2 = m.winner === m.entry_2;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2"
                        >
                          <span className={`text-sm ${isWin1 ? "text-emerald-400 font-bold" : "text-slate-300"}`}>
                            {teamNames.get(m.entry_1)}
                          </span>
                          <span className="text-sm font-mono mx-2">
                            {m.entry_1_points} - {m.entry_2_points}
                          </span>
                          <span className={`text-sm ${isWin2 ? "text-emerald-400 font-bold" : "text-slate-300"}`}>
                            {teamNames.get(m.entry_2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
