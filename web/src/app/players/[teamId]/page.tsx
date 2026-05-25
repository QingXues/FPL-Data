"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const ACTIVE_TEAM_KEY = "fpl.activeTeamId";

export default function LegacyPlayerPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();

  useEffect(() => {
    const teamId = Number(params.teamId);
    if (Number.isFinite(teamId)) {
      window.localStorage.setItem(ACTIVE_TEAM_KEY, String(teamId));
    }
    router.replace("/players");
  }, [params.teamId, router]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-gray-500">正在打开队伍数据...</p>
    </main>
  );
}
