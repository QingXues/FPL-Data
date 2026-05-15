"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Props {
  leagueId: number;
  leagueName: string;
  leagueType: string;
}

export default function LeagueCard({ leagueId, leagueName, leagueType }: Props) {
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from("leagues")
      .select("league_id")
      .eq("league_id", leagueId)
      .eq("season", 26)
      .single()
      .then(({ data }) => setExists(!!data));
  }, [leagueId]);

  const handleCollect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId, leagueType }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Collection failed");
        setLoading(false);
        return;
      }
      router.push(`/league/${leagueType}/${leagueId}`);
    } catch {
      alert("An error occurred");
      setLoading(false);
    }
  };

  if (exists === null) {
    return (
      <div className="bg-slate-700 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-slate-600 rounded w-3/4"></div>
      </div>
    );
  }

  if (exists) {
    return (
      <Link
        href={`/league/${leagueType}/${leagueId}`}
        className="block bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">{leagueName}</span>
          <span className="text-xs px-2 py-1 rounded bg-emerald-900/50 text-emerald-400 uppercase">
            {leagueType}
          </span>
        </div>
        <div className="text-sm text-slate-400 mt-1">View stats →</div>
      </Link>
    );
  }

  return (
    <button
      onClick={handleCollect}
      disabled={loading}
      className="w-full text-left bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors disabled:opacity-50"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{leagueName}</span>
        <span className="text-xs px-2 py-1 rounded bg-slate-600 text-slate-300 uppercase">
          {leagueType}
        </span>
      </div>
      <div className="text-sm text-emerald-400 mt-1">
        {loading ? "Collecting..." : "Click to collect →"}
      </div>
    </button>
  );
}
