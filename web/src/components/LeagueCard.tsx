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
      <div className="border border-gray-200 p-4">
        <div className="h-4 w-3/4 animate-pulse bg-gray-100"></div>
      </div>
    );
  }

  if (exists) {
    return (
      <Link
        href={`/league/${leagueType}/${leagueId}`}
        className="block border border-gray-200 p-4 transition-colors hover:border-[#37003c]"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#37003c]">{leagueName}</span>
          <span className="bg-[#37003c] px-2 py-0.5 text-xs font-semibold text-white uppercase">
            {leagueType}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-500">View stats →</div>
      </Link>
    );
  }

  return (
    <button
      onClick={handleCollect}
      disabled={loading}
      className="w-full border border-gray-200 p-4 text-left transition-colors hover:border-[#37003c] disabled:opacity-50"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-[#37003c]">{leagueName}</span>
        <span className="border border-gray-300 px-2 py-0.5 text-xs uppercase text-gray-600">
          {leagueType}
        </span>
      </div>
      <div className="mt-1 text-sm text-green-700">
        {loading ? "Collecting..." : "Click to collect →"}
      </div>
    </button>
  );
}
