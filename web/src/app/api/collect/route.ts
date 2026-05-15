import { NextRequest, NextResponse } from "next/server";
import { spawnSync } from "child_process";
import path from "path";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function runCollector(args: string[]): { success: boolean; stdout: string; stderr: string } {
  const collectorDir = path.join(process.cwd(), "..", "collector");
  const result = spawnSync("python", ["-m", "src.main", ...args], {
    cwd: collectorDir,
    env: { ...process.env },
    encoding: "utf-8",
    timeout: 120_000,
  });
  return {
    success: result.status === 0,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, leagueId, leagueType } = body;

    if (USE_MOCK) {
      // In mock mode, skip real collection and return success immediately
      if (teamId) {
        return NextResponse.json({ success: true, type: "manager", teamId });
      }
      if (leagueId && leagueType) {
        return NextResponse.json({ success: true, type: "league", leagueId, leagueType });
      }
      return NextResponse.json({ error: "Missing teamId or (leagueId + leagueType)" }, { status: 400 });
    }

    if (teamId) {
      const result = runCollector(["--mode", "collect", "--team-id", String(teamId)]);
      if (!result.success) {
        if (result.stderr.includes("ValueError")) {
          return NextResponse.json({ error: result.stderr }, { status: 400 });
        }
        return NextResponse.json({ error: result.stderr || "Collection failed" }, { status: 500 });
      }
      return NextResponse.json({ success: true, type: "manager", teamId });
    }

    if (leagueId && leagueType) {
      const result = runCollector([
        "--mode", "collect",
        "--league-id", String(leagueId),
        "--league-type", leagueType,
      ]);
      if (!result.success) {
        if (result.stdout.includes(">10") || result.stderr.includes(">10")) {
          return NextResponse.json(
            { error: "League has more than 10 teams. Collection not supported." },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: result.stderr || "Collection failed" }, { status: 500 });
      }
      return NextResponse.json({ success: true, type: "league", leagueId, leagueType });
    }

    return NextResponse.json({ error: "Missing teamId or (leagueId + leagueType)" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
