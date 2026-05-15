const SEASON = 26;

export const mockManager = {
  team_id: 12345,
  player_name: "Alex Ferguson",
  season: SEASON,
  last_event_collected: 10,
};

export const mockScores = Array.from({ length: 10 }, (_, i) => ({
  team_id: 12345,
  event: i + 1,
  points: [65, 48, 72, 55, 80, 60, 45, 70, 58, 75][i],
  total_points: [65, 113, 185, 240, 320, 380, 425, 495, 553, 628][i],
  rank: [120000, 95000, 78000, 82000, 65000, 68000, 71000, 62000, 64000, 58000][i],
  bank: 5,
  value: 1000 + i * 5,
  event_transfers: i === 5 ? 2 : 0,
  event_transfers_cost: i === 5 ? 4 : 0,
  points_on_bench: [8, 12, 5, 15, 3, 10, 7, 6, 9, 4][i],
  season: SEASON,
}));

export const mockPicks: Record<string, unknown>[] = [];
const players = [
  { element: 301, name: "Haaland" },
  { element: 302, name: "Salah" },
  { element: 303, name: "Saka" },
  { element: 304, name: "Palmer" },
  { element: 305, name: "Watkins" },
  { element: 306, name: "Foden" },
  { element: 307, name: "Son" },
  { element: 308, name: "Luis Diaz" },
  { element: 309, name: "Alexander-Arnold" },
  { element: 310, name: "Gabriel" },
  { element: 311, name: "van Dijk" },
  { element: 312, name: "Pickford" },
  { element: 313, name: "Mbeumo" },
  { element: 314, name: "Gordon" },
  { element: 315, name: "Estupinan" },
  { element: 316, name: "Isak" },
  { element: 317, name: "B.Fernandes" },
];

for (let gw = 1; gw <= 10; gw++) {
  for (let pos = 1; pos <= 15; pos++) {
    const p = players[pos - 1];
    const isCaptain = pos === 1;
    const isVice = pos === 2;
    const basePoints = [12, 8, 6, 10, 5, 7, 4, 3, 6, 4, 5, 3, 2, 1, 0][pos - 1];
    const gwVariation = [2, -1, 3, 0, -2, 1, 4, -1, 0, 2][gw - 1] || 0;
    mockPicks.push({
      team_id: 12345,
      event: gw,
      element: p.element,
      position: pos,
      multiplier: isCaptain ? 2 : pos <= 11 ? 1 : 0,
      is_captain: isCaptain,
      is_vice_captain: isVice,
      points: Math.max(0, basePoints + gwVariation),
      season: SEASON,
    });
  }
}

export const mockTransfers = [
  { team_id: 12345, event: 3, element_in: 316, element_out: 315, element_in_cost: 55, element_out_cost: 45, season: SEASON },
  { team_id: 12345, event: 6, element_in: 317, element_out: 313, element_in_cost: 75, element_out_cost: 60, season: SEASON },
];

export const mockChips = [
  { team_id: 12345, event: 5, name: "bb", season: SEASON },
  { team_id: 12345, event: 8, name: "tc", season: SEASON },
];

export const mockManagerLeagues = [
  { team_id: 12345, league_id: 98765, season: SEASON },
  { team_id: 12345, league_id: 87654, season: SEASON },
];

export const mockLeagues = [
  { league_id: 98765, league_name: "Work Classic", league_type: "classic", season: SEASON, team_count: 8 },
  { league_id: 87654, league_name: "Office H2H", league_type: "h2h", season: SEASON, team_count: 6 },
];

export const mockClassicStandings = (() => {
  const teams = [
    { team_id: 12345, name: "Alex Ferguson" },
    { team_id: 12346, name: "Pep Guardiola" },
    { team_id: 12347, name: "Jurgen Klopp" },
    { team_id: 12348, name: "Mikel Arteta" },
    { team_id: 12349, name: "Erik ten Hag" },
    { team_id: 12350, name: "Ange Postecoglou" },
    { team_id: 12351, name: "Unai Emery" },
    { team_id: 12352, name: "Eddie Howe" },
  ];
  const result: Record<string, unknown>[] = [];
  for (let gw = 1; gw <= 10; gw++) {
    const gwScores = teams.map((t) => ({
      team_id: t.team_id,
      event: gw,
      event_total: 40 + Math.floor(Math.random() * 45),
    }));
    const runningTotals = new Map<number, number>();
    for (const s of gwScores) {
      runningTotals.set(s.team_id, (runningTotals.get(s.team_id) || 0) + s.event_total);
    }
    const sorted = teams
      .map((t) => ({ ...t, total: runningTotals.get(t.team_id) || 0 }))
      .sort((a, b) => b.total - a.total);
    sorted.forEach((t, i) => {
      result.push({
        league_id: 98765,
        team_id: t.team_id,
        event: gw,
        rank: i + 1,
        total: t.total,
        event_total: gwScores.find((s) => s.team_id === t.team_id)?.event_total || 0,
        season: SEASON,
      });
    });
  }
  return result;
})();

export const mockH2HMatches = (() => {
  const teams = [12345, 12346, 12347, 12348, 12349, 12350];
  const result: Record<string, unknown>[] = [];
  for (let gw = 1; gw <= 10; gw++) {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i += 2) {
      const t1 = shuffled[i];
      const t2 = shuffled[i + 1];
      const p1 = 40 + Math.floor(Math.random() * 45);
      const p2 = 40 + Math.floor(Math.random() * 45);
      let winner = null;
      if (p1 > p2) winner = t1;
      else if (p2 > p1) winner = t2;
      result.push({
        league_id: 87654,
        event: gw,
        entry_1: t1,
        entry_1_points: p1,
        entry_2: t2,
        entry_2_points: p2,
        winner,
        season: SEASON,
      });
    }
  }
  return result;
})();

export const mockManagerNames = [
  { team_id: 12345, player_name: "Alex Ferguson" },
  { team_id: 12346, player_name: "Pep Guardiola" },
  { team_id: 12347, player_name: "Jurgen Klopp" },
  { team_id: 12348, player_name: "Mikel Arteta" },
  { team_id: 12349, player_name: "Erik ten Hag" },
  { team_id: 12350, player_name: "Ange Postecoglou" },
  { team_id: 12351, player_name: "Unai Emery" },
  { team_id: 12352, player_name: "Eddie Howe" },
];

export const mockPlayerNames = players.map((p) => ({ element: p.element, web_name: p.name }));
