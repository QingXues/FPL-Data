import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeague, getClassicStandings, getManagerNames } from "@/lib/queries";
import MultiLineChart from "@/components/MultiLineChart";

interface Props {
  params: Promise<{ leagueId: string }>;
}

export const dynamic = "force-dynamic";

const COLORS = [
  "#37003c", "#e90052", "#00ff85", "#05f0ff", "#ff6b00",
  "#7c3aed", "#db2777", "#059669", "#2563eb", "#dc2626",
];

export default async function ClassicLeaguePage({ params }: Props) {
  const { leagueId: leagueIdStr } = await params;
  const leagueId = parseInt(leagueIdStr, 10);

  const league = await getLeague(leagueId);
  if (!league || league.league_type !== "classic") notFound();

  const standings = await getClassicStandings(leagueId);

  const teamIds = Array.from(new Set(standings.map((s) => s.team_id)));
  const managers = await getManagerNames(teamIds);
  const teamNames = new Map(managers.map((m) => [m.team_id, m.player_name]));

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

  const lastEvent = events[events.length - 1];
  const currentStandings = lastEvent
    ? Array.from(byEvent.get(lastEvent)!.values()).sort((a, b) => a.rank - b.rank)
    : [];

  const eventStats = events.map((ev) => {
    const eventMap = byEvent.get(ev)!;
    const scores = Array.from(eventMap.values());
    const best = scores.reduce((b, s) => (s.event_total > b.event_total ? s : b), scores[0]);
    const worst = scores.reduce((w, s) => (s.event_total < w.event_total ? s : w), scores[0]);
    return { event: ev, best, worst };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#37003c]">{league.league_name}</h1>
          <p className="text-sm text-gray-500">传统联赛 · {league.team_count} 支队伍</p>
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
                <th className="pb-2 pr-4 text-right font-medium">总分</th>
                <th className="pb-2 text-right font-medium">上轮</th>
              </tr>
            </thead>
            <tbody>
              {currentStandings.map((s) => (
                <tr key={s.team_id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-bold text-[#37003c]">{s.rank}</td>
                  <td className="py-2 pr-4">{teamNames.get(s.team_id) || `Team ${s.team_id}`}</td>
                  <td className="py-2 pr-4 text-right font-bold">{s.total}</td>
                  <td className="py-2 text-right text-gray-500">{s.event_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">总得分趋势</h2>
          <MultiLineChart data={totalData} lines={totalLines} />
        </div>
        <div className="border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">排名趋势</h2>
          <MultiLineChart data={rankData} lines={rankLines} yReversed />
        </div>
      </div>

      <div className="border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">每轮最佳 / 最差</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
              <tr>
                <th className="pb-2 pr-4 font-medium">轮次</th>
                <th className="pb-2 pr-4 font-medium">最佳</th>
                <th className="pb-2 pr-4 text-right font-medium">得分</th>
                <th className="pb-2 pr-4 font-medium">最差</th>
                <th className="pb-2 text-right font-medium">得分</th>
              </tr>
            </thead>
            <tbody>
              {eventStats.map((es) => (
                <tr key={es.event} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{es.event}</td>
                  <td className="py-2 pr-4 font-semibold text-green-700">{teamNames.get(es.best.team_id) || `Team ${es.best.team_id}`}</td>
                  <td className="py-2 pr-4 text-right font-bold">{es.best.event_total}</td>
                  <td className="py-2 pr-4 font-semibold text-red-600">{teamNames.get(es.worst.team_id) || `Team ${es.worst.team_id}`}</td>
                  <td className="py-2 text-right font-bold">{es.worst.event_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
