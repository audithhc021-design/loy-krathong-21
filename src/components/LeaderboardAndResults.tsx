"use client";

import React from "react";
import { Heart, Trophy } from "lucide-react";
import type { PublicKrathongView } from "@/lib/types";
import { KrathongArt } from "./KrathongArt";
import { UserAvatar } from "./UserAvatar";

interface LeaderboardAndResultsProps {
  krathongs: PublicKrathongView[];
}

export function LeaderboardAndResults({
  krathongs,
}: LeaderboardAndResultsProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-amber-400/25 bg-slate-900/80 p-4 space-y-1.5">
        <div className="flex items-center gap-2 text-amber-300">
          <Trophy className="w-5 h-5" />
          <h2 className="text-sm font-bold">กระทงและคำอธิษฐานยอดนิยม</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          จัดอันดับตามคะแนนโหวตแบบเรียลไทม์จากผู้ร่วมลอยกระทงทุกท่าน
        </p>
      </div>

      {krathongs.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-12 text-center text-xs text-slate-400">
          ยังไม่มีกระทงในสายน้ำ มาร่วมลอยเป็นคนแรกกันเลย!
        </div>
      ) : (
        <div className="space-y-2.5">
          {krathongs.map((k, idx) => (
            <div
              key={k.id}
              className={`rounded-2xl border p-3.5 flex items-center gap-3 ${
                idx < 3
                  ? "border-amber-400/35 bg-gradient-to-r from-amber-500/10 to-slate-900/85"
                  : "border-slate-800 bg-slate-900/75"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  idx === 0
                    ? "bg-amber-400 text-slate-950"
                    : idx === 1
                    ? "bg-slate-200 text-slate-950"
                    : idx === 2
                    ? "bg-orange-400 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {idx + 1}
              </div>

              <KrathongArt
                baseId={k.base_id}
                flowerId={k.flower_id}
                candleId={k.candle_id}
                decorId={k.decor_id}
                auraId={k.aura_id || "none"}
                size="sm"
                animate={false}
              />

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <UserAvatar
                      avatarUrl={k.author.avatar_url}
                      displayName={k.author.display_name}
                      size="xs"
                    />
                    <span className="text-xs font-bold text-white truncate">
                      {k.author.display_name}
                    </span>
                    {k.is_mine && (
                      <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200 shrink-0">
                        ของคุณ
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 shrink-0">
                    <Heart className="w-3.5 h-3.5 fill-rose-400/40" />
                    {k.vote_count}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed line-clamp-3">
                  “{k.wish_text}”
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
