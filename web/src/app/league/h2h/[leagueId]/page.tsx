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

  const events = Array.from(new Set(matches.map((m) => m.event))).sort((a, b) => a - b);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#37003c]">{league.league_name}</h1>
          <p className="text-sm text-gray-500">Head-to-Head 联赛 · {league.team_count} 支队伍</p>
        </div>
        <Link href="/" className="border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-[#37003c] hover:text-[#37003c]">
          返回
        </Link>
      </div>

      <div className="mb-8 border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">积分榜</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
              <tr>
                <th className="pb-2 pr-4 font-medium">排名</th>
                <th className="pb-2 pr-4 font-medium">队伍</th>
                <th className="pb-2 pr-4 text-right font-medium">赛</th>
                <th className="pb-2 pr-4 text-right font-medium">胜</th>
                <th className="pb-2 pr-4 text-right font-medium">平</th>
                <th className="pb-2 pr-4 text-right font-medium">负</th>
                <th className="pb-2 pr-4 text-right font-medium">进球</th>
                <th className="pb-2 pr-4 text-right font-medium">失球</th>
                <th className="pb-2 pr-4 text-right font-medium">净胜</th>
                <th className="pb-2 text-right font-medium">积分</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((tid, i) => {
                const s = stats.get(tid)!;
                const played = s.wins + s.draws + s.losses;
                return (
                  <tr key={tid} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-bold text-[#37003c]">{i + 1}</td>
                    <td className="py-2 pr-4">{teamNames.get(tid)}</td>
                    <td className="py-2 pr-4 text-right">{played}</td>
                    <td className="py-2 pr-4 text-right font-semibold text-green-700">{s.wins}</td>
                    <td className="py-2 pr-4 text-right text-gray-500">{s.draws}</td>
                    <td className="py-2 pr-4 text-right font-semibold text-red-600">{s.losses}</td>
                    <td className="py-2 pr-4 text-right">{s.gf}</td>
                    <td className="py-2 pr-4 text-right">{s.ga}</td>
                    <td className="py-2 pr-4 text-right font-bold">{s.gf - s.ga}</td>
                    <td className="py-2 text-right font-bold">{s.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8 overflow-x-auto border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">对阵矩阵</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
            <tr>
              <th className="pb-2 pr-4"></th>
              {sortedTeams.map((tid) => (
                <th key={tid} className="pb-2 px-2 text-center text-xs">
                  {teamNames.get(tid)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((tidA) => (
              <tr key={tidA} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium text-xs">{teamNames.get(tidA)}</td>
                {sortedTeams.map((tidB) => {
                  if (tidA === tidB) {
                    return <td key={tidB} className="py-2 text-center text-gray-300">—</td>;
                  }
                  const rec = h2hMap.get(`${tidA}-${tidB}`);
                  if (!rec || rec.w + rec.d + rec.l === 0) {
                    return <td key={tidB} className="py-2 text-center text-gray-300">—</td>;
                  }
                  return (
                    <td key={tidB} className="py-2 text-center text-xs">
                      <div>
                        <span className="text-green-700">{rec.w}</span>
                        <span className="text-gray-400">/{rec.d}/</span>
                        <span className="text-red-600">{rec.l}</span>
                      </div>
                      <div className="text-gray-400">{rec.gf}-{rec.ga}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">比赛</h2>
        <div className="space-y-4">
          {events.map((ev) => {
            const eventMatches = matches.filter((m) => m.event === ev);
            return (
              <div key={ev}>
                <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">第 {ev} 轮</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {eventMatches.map((m, i) => {
                    const isWin1 = m.winner === m.entry_1;
                    const isWin2 = m.winner === m.entry_2;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between border border-gray-100 px-3 py-2"
                      >
                        <span className={`text-sm ${isWin1 ? "font-bold text-[#37003c]" : "text-gray-600"}`}>
                          {teamNames.get(m.entry_1)}
                        </span>
                        <span className="text-sm font-mono font-semibold text-gray-700">
                          {m.entry_1_points} - {m.entry_2_points}
                        </span>
                        <span className={`text-sm ${isWin2 ? "font-bold text-[#37003c]" : "text-gray-600"}`}>
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
    </main>
  );
}
