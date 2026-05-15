import { supabase } from "./supabase";
import * as mock from "./mock";

export const SEASON = 26;
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function getManager(teamId: number) {
  if (USE_MOCK) return mock.mockManager.team_id === teamId ? mock.mockManager : null;
  const { data } = await supabase
    .from("managers")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .single();
  return data;
}

export async function getGameweekScores(teamId: number) {
  if (USE_MOCK) return mock.mockScores.filter((s) => s.team_id === teamId);
  const { data } = await supabase
    .from("gameweek_scores")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .order("event", { ascending: true });
  return data || [];
}

export async function getGameweekPicks(teamId: number) {
  if (USE_MOCK) return mock.mockPicks.filter((p) => p.team_id === teamId);
  const { data } = await supabase
    .from("gameweek_picks")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .order("event", { ascending: true })
    .order("position", { ascending: true });
  return data || [];
}

export async function getTransfers(teamId: number) {
  if (USE_MOCK) return mock.mockTransfers.filter((t) => t.team_id === teamId);
  const { data } = await supabase
    .from("transfers")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .order("event", { ascending: true });
  return data || [];
}

export async function getChips(teamId: number) {
  if (USE_MOCK) return mock.mockChips.filter((c) => c.team_id === teamId);
  const { data } = await supabase
    .from("chips")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .order("event", { ascending: true });
  return data || [];
}

export async function getManagerLeagues(teamId: number) {
  if (USE_MOCK) {
    const leagueIds = mock.mockManagerLeagues
      .filter((ml) => ml.team_id === teamId)
      .map((ml) => ml.league_id);
    return leagueIds.map((id) => ({
      league_id: id,
      leagues: mock.mockLeagues.find((l) => l.league_id === id) || null,
    }));
  }
  const { data } = await supabase
    .from("manager_leagues")
    .select("league_id, leagues(league_id, league_name, league_type, team_count)")
    .eq("team_id", teamId)
    .eq("season", SEASON);
  return data || [];
}

export async function getLeague(leagueId: number) {
  if (USE_MOCK) return mock.mockLeagues.find((l) => l.league_id === leagueId) || null;
  const { data } = await supabase
    .from("leagues")
    .select("*")
    .eq("league_id", leagueId)
    .eq("season", SEASON)
    .single();
  return data;
}

export async function getClassicStandings(leagueId: number) {
  if (USE_MOCK) return mock.mockClassicStandings.filter((s) => s.league_id === leagueId);
  const { data } = await supabase
    .from("classic_league_standings")
    .select("*")
    .eq("league_id", leagueId)
    .eq("season", SEASON)
    .order("event", { ascending: true })
    .order("rank", { ascending: true });
  return data || [];
}

export async function getH2HMatches(leagueId: number) {
  if (USE_MOCK) return mock.mockH2HMatches.filter((m) => m.league_id === leagueId);
  const { data } = await supabase
    .from("h2h_matches")
    .select("*")
    .eq("league_id", leagueId)
    .eq("season", SEASON)
    .order("event", { ascending: true });
  return data || [];
}

export async function getManagerNames(teamIds: number[]) {
  if (teamIds.length === 0) return [];
  if (USE_MOCK) return mock.mockManagerNames.filter((m) => teamIds.includes(m.team_id));
  const { data } = await supabase
    .from("managers")
    .select("team_id, player_name")
    .in("team_id", teamIds)
    .eq("season", SEASON);
  return data || [];
}

export async function getPlayerNames(elementIds: number[]) {
  if (elementIds.length === 0) return [];
  if (USE_MOCK) {
    return mock.mockPlayerNames
      .filter((p) => elementIds.includes(p.element))
      .map((p) => ({ element: p.element, web_name: p.web_name }));
  }
  const { data } = await supabase
    .from("player_history")
    .select("element, web_name")
    .in("element", elementIds)
    .eq("season", SEASON)
    .limit(elementIds.length * 2);
  const map = new Map<number, string>();
  for (const row of (data || [])) {
    if (!map.has(row.element)) {
      map.set(row.element, row.web_name);
    }
  }
  return Array.from(map.entries()).map(([element, web_name]) => ({ element, web_name }));
}
