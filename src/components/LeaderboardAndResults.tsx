"use client";

import React from "react";
import { Award, Crown, EyeOff, Gift, Heart, Sparkles, Trophy } from "lucide-react";
import type { EventPhaseInfo, PublicKrathongView } from "@/lib/types";
import { KrathongArt } from "./KrathongArt";

interface LuckyDrawResult {
  id: string;
  title: string;
  sort_order: number;
  drawn_at: string | null;
  winner: {
    full_name: string;
    department: string;
    avatar_url: string | null;
  } | null;
}

interface LeaderboardAndResultsProps {
  phase: EventPhaseInfo;
  krathongs: PublicKrathongView[];
  results: {
    top3: PublicKrathongView[];
    judgePicks: PublicKrathongView[];
    luckyDraw: LuckyDrawResult[];
  } | null;
}

export function LeaderboardAndResults({
  phase,
  krathongs,
  results,
}: LeaderboardAndResultsProps) {
  if (phase.isRevealed && results) {
    return (
      <div className="space-y-5">
        {/* Official Reveal Header */}
        <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-slate-900 p-5 text-center space-y-1.5 shadow-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-200">
            <Sparkles className="w-4 h-4" />
            ประกาศผลทางการ 25 พ.ย. 2569
          </div>
          <h2 className="text-lg font-bold text-white">
            ทำเนียบผู้ชนะกิจกรรมวันลอยกระทง
          </h2>
          <p className="text-xs text-slate-300">
            เปิดเผยรายชื่อเจ้าของกระทงและผู้โชคดีจับฉลากทั้งหมดแล้ว!
          </p>
        </div>

        {/* Top 3 Contest Winners */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-300">
            <Trophy className="w-5 h-5" />
            <h3 className="text-sm font-bold">
              รางวัลประกวดกระทง + คำอธิษฐาน (อันดับ 1–3)
            </h3>
          </div>

          {results.top3.length === 0 ? (
            <p className="text-xs text-slate-400">ยังไม่มีข้อมูลผู้เข้าประกวด</p>
          ) : (
            results.top3.map((k, idx) => {
              const medals = [
                { label: "รางวัลที่ 1", badge: "bg-amber-400 text-slate-950" },
                { label: "รางวัลที่ 2", badge: "bg-slate-200 text-slate-950" },
                { label: "รางวัลที่ 3", badge: "bg-orange-400 text-slate-950" },
              ];
              const medal = medals[idx] || medals[2];
              return (
                <div
                  key={k.id}
                  className="rounded-2xl border border-amber-400/30 bg-slate-900/85 p-4 flex items-center gap-3.5"
                >
                  <KrathongArt
                    baseId={k.base_id}
                    flowerId={k.flower_id}
                    candleId={k.candle_id}
                    decorId={k.decor_id}
                    auraId={k.aura_id || "none"}
                    size="sm"
                    animate={false}
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${medal.badge}`}
                      >
                        <Crown className="w-3 h-3" />
                        {medal.label}
                      </span>
                      <span className="text-xs font-bold text-amber-300">
                        {k.vote_count} โหวต
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">
                      {k.author?.full_name || k.anonymous_code}
                    </p>
                    {k.author?.department && (
                      <p className="text-[11px] text-sky-300">{k.author.department}</p>
                    )}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      “{k.wish_text}”
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Judge's Choice 2 Prizes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-pink-300">
            <Award className="w-5 h-5" />
            <h3 className="text-sm font-bold">รางวัลโดนใจกรรมการ / ชมเชย (2 รางวัล)</h3>
          </div>

          {results.judgePicks.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
              รอคณะกรรมการประกาศรางวัลชมเชยในเมนู Admin
            </div>
          ) : (
            results.judgePicks.map((k) => (
              <div
                key={k.id}
                className="rounded-2xl border border-pink-400/30 bg-slate-900/85 p-4 flex items-center gap-3.5"
              >
                <KrathongArt
                  baseId={k.base_id}
                  flowerId={k.flower_id}
                  candleId={k.candle_id}
                  decorId={k.decor_id}
                  auraId={k.aura_id || "none"}
                  size="sm"
                  animate={false}
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-pink-400/20 border border-pink-400/40 px-2.5 py-0.5 text-[11px] font-bold text-pink-200">
                    <Award className="w-3 h-3" />
                    {k.judge_award_label || "รางวัลโดนใจกรรมการ"}
                  </span>
                  <p className="text-sm font-bold text-white">
                    {k.author?.full_name || k.anonymous_code}
                  </p>
                  {k.author?.department && (
                    <p className="text-[11px] text-sky-300">{k.author.department}</p>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    “{k.wish_text}”
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lucky Draw Winners */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <Gift className="w-5 h-5" />
            <h3 className="text-sm font-bold">ผู้โชคดีจับฉลาก Lucky Draw</h3>
          </div>

          <div className="space-y-2">
            {results.luckyDraw.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-emerald-400/25 bg-slate-900/80 p-3.5 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs text-emerald-300 font-semibold">{item.title}</p>
                  {item.winner ? (
                    <div className="mt-1">
                      <p className="text-sm font-bold text-white">
                        {item.winner.full_name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.winner.department}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">ยังไม่ได้จับฉลาก</p>
                  )}
                </div>
                {item.winner && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-200 shrink-0">
                    ผู้โชคดี 🎉
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Anonymous Leaderboard Before Reveal
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-amber-400/25 bg-slate-900/80 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-300">
          <EyeOff className="w-5 h-5" />
          <h2 className="text-sm font-bold">
            อันดับคะแนนโหวต (ยังไม่เปิดเผยชื่อเจ้าของ)
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          จะเปิดเผยชื่อเจ้าของกระทง รางวัลอันดับ 1–3, รางวัลโดนใจกรรมการ 2 รางวัล
          และผลจับฉลาก Lucky Draw พร้อมกันวันที่{" "}
          <strong className="text-amber-300">25 พ.ย. 2569 เวลา 08:00 น.</strong>
        </p>
      </div>

      {krathongs.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-12 text-center text-xs text-slate-400">
          ยังไม่มีกระทงส่งเข้าประกวด
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
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

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-amber-200">
                    {k.anonymous_code}
                    {k.is_mine ? " (ของคุณ)" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-300">
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
