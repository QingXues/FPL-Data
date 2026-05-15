import { supabase } from "./supabase";

export const SEASON = 26;

export async function getManager(teamId: number) {
  const { data } = await supabase
    .from("managers")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .single();
  return data;
}

export async function getGameweekScores(teamId: number) {
  const { data } = await supabase
    .from("gameweek_scores")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .order("event", { ascending: true });
  return data || [];
}

export async function getGameweekPicks(teamId: number) {
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
  const { data } = await supabase
    .from("transfers")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .order("event", { ascending: true });
  return data || [];
}

export async function getChips(teamId: number) {
  const { data } = await supabase
    .from("chips")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .order("event", { ascending: true });
  return data || [];
}

export async function getManagerLeagues(teamId: number) {
  const { data } = await supabase
    .from("manager_leagues")
    .select("league_id, leagues(league_id, league_name, league_type, team_count)")
    .eq("team_id", teamId)
    .eq("season", SEASON);
  return data || [];
}

export async function getLeague(leagueId: number) {
  const { data } = await supabase
    .from("leagues")
    .select("*")
    .eq("league_id", leagueId)
    .eq("season", SEASON)
    .single();
  return data;
}

export async function getClassicStandings(leagueId: number) {
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
  const { data } = await supabase
    .from("managers")
    .select("team_id, player_name")
    .in("team_id", teamIds)
    .eq("season", SEASON);
  return data || [];
}

export async function getPlayerNames(elementIds: number[]) {
  if (elementIds.length === 0) return [];
  const { data } = await supabase
    .from("player_history")
    .select("element, web_name")
    .in("element", elementIds)
    .eq("season", SEASON)
    .limit(elementIds.length * 2);
  // Deduplicate by element
  const map = new Map<number, string>();
  for (const row of (data || [])) {
    if (!map.has(row.element)) {
      map.set(row.element, row.web_name);
    }
  }
  return Array.from(map.entries()).map(([element, web_name]) => ({ element, web_name }));
}
