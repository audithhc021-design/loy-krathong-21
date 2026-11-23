"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Leaf,
  Pause,
  Play,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react";
import { MAX_VOTES_PER_USER } from "@/lib/constants";
import type {
  EventPhaseInfo,
  PublicKrathongView,
  VoteQuotaStatus,
} from "@/lib/types";
import { KrathongArt } from "./KrathongArt";
import { UserAvatar } from "./UserAvatar";

interface RiverViewProps {
  krathongs: PublicKrathongView[];
  phase: EventPhaseInfo;
  activityStatus: VoteQuotaStatus | null;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  onVoteAction: (krathongId: string, action: "cast" | "unvote") => Promise<void>;
  onGoToBuilder: () => void;
}

const LANE_COUNT = 3;

export function RiverView({
  krathongs,
  phase,
  activityStatus,
  isLoggedIn,
  onRequireLogin,
  onVoteAction,
  onGoToBuilder,
}: RiverViewProps) {
  const [filterMode, setFilterMode] = useState<"all" | "voted" | "mine">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [shuffleSeed, setShuffleSeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // รีเฟรชสุ่มกระทงบนแม่น้ำทุกๆ 20 วินาที (หยุดนับเวลาเมื่อกดหยุดไหล หรือกำลังเปิดอ่านการ์ดกระทง)
  useEffect(() => {
    if (isPaused || selectedId !== null) {
      return;
    }
    const timer = window.setInterval(() => {
      setShuffleSeed((s) => s + 1);
    }, 20000);
    return () => clearInterval(timer);
  }, [isPaused, selectedId]);

  const selectedKrathong = useMemo(
    () => krathongs.find((k) => k.id === selectedId) ?? null,
    [krathongs, selectedId]
  );

  const filteredKrathongs = useMemo(() => {
    const list = krathongs.filter((k) => {
      if (filterMode === "voted" && !k.voted_by_me) return false;
      if (filterMode === "mine" && !k.is_mine) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      const ha = Math.sin(a.serial_no * 12.9898 + shuffleSeed * 78.233) * 43758.5453;
      const hb = Math.sin(b.serial_no * 12.9898 + shuffleSeed * 78.233) * 43758.5453;
      return ha - Math.floor(ha) - (hb - Math.floor(hb));
    });
  }, [krathongs, filterMode, shuffleSeed]);

  const batchSize = 12;
  const totalBatches = Math.max(1, Math.ceil(filteredKrathongs.length / batchSize));
  const safeBatchIndex = batchIndex % totalBatches;
  const riverKrathongs = filteredKrathongs.slice(
    safeBatchIndex * batchSize,
    safeBatchIndex * batchSize + batchSize
  );

  const lanes = useMemo(() => {
    const grouped: PublicKrathongView[][] = Array.from(
      { length: LANE_COUNT },
      () => []
    );
    riverKrathongs.forEach((k, idx) => {
      grouped[idx % LANE_COUNT].push(k);
    });
    return grouped;
  }, [riverKrathongs]);

  const votesRemaining = activityStatus
    ? Math.max(0, MAX_VOTES_PER_USER - activityStatus.votes_cast)
    : MAX_VOTES_PER_USER;

  async function handleVoteClick(k: PublicKrathongView) {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    const action: "cast" | "unvote" = k.voted_by_me ? "unvote" : "cast";
    setBusyId(k.id);
    try {
      await onVoteAction(k.id, action);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Eco Impact & Vote Quota Banner */}
      <div className="rounded-2xl border border-emerald-400/25 bg-slate-900/75 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-200">
          <Leaf className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>
            ร่วมลดขยะในแม่น้ำแล้ว{" "}
            <strong className="text-emerald-300">{krathongs.length}</strong> กระทง
          </span>
        </div>
        <span className="rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200 shrink-0">
          เหลือ {votesRemaining}/{MAX_VOTES_PER_USER} โหวต
        </span>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {(
          [
            { id: "all", label: `ทั้งหมด (${krathongs.length})` },
            {
              id: "voted",
              label: `ที่ฉันโหวต (${krathongs.filter((k) => k.voted_by_me).length})`,
            },
            { id: "mine", label: "กระทงของฉัน" },
          ] as const
        ).map((pill) => (
          <button
            key={pill.id}
            onClick={() => {
              setFilterMode(pill.id);
              setBatchIndex(0);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition shrink-0 ${
              filterMode === pill.id
                ? "bg-amber-400/20 border-amber-400 text-amber-200"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* River Only Scene */}
      <div
        className={`river-scene relative overflow-hidden rounded-3xl border border-sky-400/25 bg-gradient-to-b from-[#060f28] via-[#0a2346] to-[#072b4d] shadow-2xl ${
          isPaused ? "river-paused" : ""
        }`}
      >
        {/* Night Sky + Fireworks + Moon + Temple Fair & Riverside Silhouettes */}
        <div className="relative h-44 px-4 pt-3.5 overflow-hidden">
          <div className="relative z-20 flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-xs text-amber-200/95 font-semibold">
                คืนเพ็ญเดือนสิบสอง ๒๕๖๙
              </p>
              <p className="text-[11px] text-sky-200/80">
                {isPaused
                  ? "หยุดไหลชั่วคราว — แตะอ่านได้สบาย"
                  : "สุ่มไหลใหม่อัตโนมัติทุก 20 วิ • แตะกระทงเพื่อดูชื่อและโหวต"}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-950/70 border border-sky-300/25 px-2.5 py-1 text-[11px] font-medium text-sky-100 hover:bg-slate-900"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3 text-emerald-300" />
                    ไหลต่อ
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-amber-300" />
                    หยุดไหล
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShuffleSeed((s) => s + 1)}
                title="สุ่มสลับกระทงบนแม่น้ำทันที"
                className="inline-flex items-center gap-1 rounded-xl bg-slate-950/70 border border-sky-300/25 px-2 py-1 text-[11px] text-amber-200 hover:bg-slate-900"
              >
                <Shuffle className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Glowing Full Moon */}
          <div className="pointer-events-none absolute right-7 top-11 w-11 h-11 rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-yellow-400 shadow-[0_0_38px_rgba(251,191,36,0.7)]" />

          {/* Sky Fireworks */}
          <div
            className="pointer-events-none absolute left-9 top-10 animate-firework"
            style={{ animationDelay: "0.3s" }}
          >
            <svg width="46" height="46" viewBox="0 0 46 46">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <line
                  key={deg}
                  x1="23"
                  y1="23"
                  x2={23 + 16 * Math.cos((deg * Math.PI) / 180)}
                  y2={23 + 16 * Math.sin((deg * Math.PI) / 180)}
                  stroke="#fbbf24"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>
          <div
            className="pointer-events-none absolute left-[46%] top-9 animate-firework"
            style={{ animationDelay: "2.1s" }}
          >
            <svg width="38" height="38" viewBox="0 0 38 38">
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1="19"
                  y1="19"
                  x2={19 + 13 * Math.cos((deg * Math.PI) / 180)}
                  y2={19 + 13 * Math.sin((deg * Math.PI) / 180)}
                  stroke="#f472b6"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>

          {/* Twinkling Stars */}
          {[
            { top: "24%", left: "34%", delay: "0s" },
            { top: "36%", left: "62%", delay: "0.9s" },
            { top: "18%", left: "73%", delay: "1.5s" },
            { top: "48%", left: "22%", delay: "0.4s" },
          ].map((s, idx) => (
            <span
              key={idx}
              className="animate-twinkle pointer-events-none absolute w-1.5 h-1.5 rounded-full bg-amber-100"
              style={{ top: s.top, left: s.left, animationDelay: s.delay }}
            />
          ))}

          {/* Distant Riverside Temple Fair, Pagoda, Tents, Bank & People Floating Krathongs */}
          <svg
            viewBox="0 0 420 70"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-[68px]"
          >
            <path
              d="M0 56 Q35 44 75 52 Q125 46 185 54 Q260 48 330 53 Q380 46 420 55 L420 70 L0 70 Z"
              fill="#0b1736"
            />
            <g fill="#16254a" stroke="#fbbf24" strokeOpacity="0.35" strokeWidth="0.6">
              <rect x="44" y="42" width="18" height="12" />
              <polygon points="42,42 53,26 64,42" />
              <polygon points="48,27 53,11 58,27" fill="#fbbf24" opacity="0.6" />
              <line x1="53" y1="6" x2="53" y2="12" stroke="#fde68a" strokeWidth="1.2" />
            </g>
            <g fill="#132145">
              <rect x="74" y="39" width="44" height="16" />
              <polygon points="70,39 96,23 122,39" fill="#1e2f5e" />
              <polygon points="75,35 96,20 117,35" fill="#273b73" />
              <rect x="92" y="44" width="8" height="11" fill="#fbbf24" opacity="0.7" />
              <rect x="80" y="45" width="5" height="6" fill="#fde68a" opacity="0.55" />
              <rect x="107" y="45" width="5" height="6" fill="#fde68a" opacity="0.55" />
              <path d="M96 20 L94 14 L98 18 Z" fill="#fbbf24" opacity="0.85" />
            </g>
            <g>
              <polygon points="132,48 144,39 156,48" fill="#be185d" opacity="0.75" />
              <rect x="134" y="48" width="20" height="8" fill="#172554" />
              <polygon points="160,48 172,39 184,48" fill="#d97706" opacity="0.75" />
              <rect x="162" y="48" width="20" height="8" fill="#172554" />
              <path
                d="M53 16 Q95 28 138 38 Q165 40 194 45"
                fill="none"
                stroke="#fde68a"
                strokeWidth="0.6"
                opacity="0.6"
              />
              {[65, 80, 96, 114, 130, 146, 164, 182].map((lx, idx) => (
                <circle
                  key={lx}
                  cx={lx}
                  cy={22 + idx * 2.5}
                  r="1.5"
                  fill={["#fbbf24", "#f472b6", "#34d399", "#38bdf8"][idx % 4]}
                  opacity="0.9"
                />
              ))}
            </g>
            <path d="M0 55 L420 55 L420 70 L0 70 Z" fill="#0d1b38" />
            <line
              x1="0"
              y1="55"
              x2="420"
              y2="55"
              stroke="#38bdf8"
              strokeOpacity="0.25"
              strokeWidth="1"
            />
            <rect x="275" y="53" width="48" height="4" fill="#3b2818" />
            <rect x="282" y="57" width="3" height="10" fill="#2b1d12" />
            <rect x="314" y="57" width="3" height="10" fill="#2b1d12" />
            <g fill="#091124">
              <circle cx="144" cy="49" r="2.1" />
              <rect x="142.3" y="51.2" width="3.4" height="5" rx="1" />
              <circle cx="151" cy="49.5" r="1.9" />
              <rect x="149.4" y="51.5" width="3.2" height="4.5" rx="1" />
              <circle cx="195" cy="49" r="2" />
              <rect x="193.5" y="51" width="3" height="5" rx="1" />
              <circle cx="202" cy="50" r="1.8" />
              <rect x="200.6" y="52" width="2.8" height="4" rx="1" />
              <circle cx="212" cy="49" r="2.1" />
              <rect x="210.4" y="51" width="3.2" height="5" rx="1" />
              <circle cx="242" cy="48.5" r="2.1" />
              <rect x="240.5" y="50.7" width="3" height="5.3" rx="1" />
              <circle cx="246.5" cy="51.5" r="1.3" fill="#fbbf24" />
              <circle cx="262" cy="51.5" r="2" />
              <path d="M259 56 Q261 52.5 265 55 L264 58 L258 58 Z" />
              <ellipse cx="269" cy="59" rx="3" ry="1.2" fill="#22c55e" />
              <circle cx="269" cy="57.5" r="1" fill="#fde047" />
              <circle cx="305" cy="50" r="2" />
              <path d="M301 54 Q304 51 308 53 L307 56 L300 56 Z" />
              <ellipse cx="313" cy="58.5" rx="3.2" ry="1.2" fill="#ec4899" />
              <circle cx="313" cy="57" r="1" fill="#fde047" />
              <circle cx="352" cy="48.5" r="2.1" />
              <rect x="350.5" y="50.7" width="3" height="5.3" rx="1" />
              <circle cx="360" cy="51.8" r="1.7" />
              <path d="M357.5 56 Q359.5 53 363 55 L362 57.5 L357 57.5 Z" />
              <ellipse cx="367" cy="59" rx="2.8" ry="1.1" fill="#fbbf24" />
              <circle cx="367" cy="57.5" r="0.9" fill="#fef08a" />
            </g>
          </svg>

          {/* Distant Boat Silhouette */}
          <div className="pointer-events-none absolute bottom-0 left-0 animate-boat-glide opacity-85">
            <svg width="68" height="22" viewBox="0 0 74 24">
              <path
                d="M4 16 Q37 25 70 16 L61 21 Q37 24 13 21 Z"
                fill="#0f172a"
              />
              <rect x="28" y="9" width="16" height="7" rx="2" fill="#1e293b" />
              <circle cx="52" cy="13" r="2.2" fill="#fbbf24" />
              <circle cx="52" cy="13" r="5" fill="rgba(251,191,36,0.32)" />
            </svg>
          </div>
        </div>

        {/* Flowing Water Surface */}
        <div className="relative bg-gradient-to-b from-[#0b335c] via-[#0a2d52] to-[#071f3b] py-3">
          {/* Aquatic Creatures */}
          <div
            className="pointer-events-none absolute top-6 left-0 text-sm animate-fish-right select-none"
            style={{ animationDuration: "14s", animationDelay: "-3s" }}
          >
            🐠
          </div>
          <div
            className="pointer-events-none absolute top-28 left-0 text-xs animate-fish-left select-none"
            style={{ animationDuration: "16s", animationDelay: "-7s" }}
          >
            🐟
          </div>
          <div
            className="pointer-events-none absolute top-52 left-0 text-sm animate-jellyfish select-none"
            style={{ animationDuration: "21s", animationDelay: "-5s" }}
          >
            🪼
          </div>
          <div
            className="pointer-events-none absolute top-72 left-0 text-xs animate-fish-right select-none"
            style={{ animationDuration: "18s", animationDelay: "-11s" }}
          >
            🦐
          </div>
          <div
            className="pointer-events-none absolute bottom-16 left-0 text-sm animate-fish-left select-none"
            style={{ animationDuration: "15s", animationDelay: "-4s" }}
          >
            🐡
          </div>
          <div
            className="pointer-events-none absolute bottom-4 left-0 text-xs animate-crab select-none"
            style={{ animationDuration: "24s", animationDelay: "-9s" }}
          >
            🦀
          </div>

          {riverKrathongs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-sm text-slate-300">ยังไม่มีกระทงในหมวดนี้</p>
              {phase.canSubmitKrathong && (
                <button
                  onClick={onGoToBuilder}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  <Sparkles className="w-4 h-4" />
                  ร่วมลอยกระทงรักษ์โลก
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {lanes.map((laneItems, laneIdx) => {
                const goingRight = laneIdx % 2 === 0;
                const durationBase = 24 + laneIdx * 5;
                return (
                  <div
                    key={laneIdx}
                    className="relative h-40 w-full overflow-hidden"
                  >
                    {laneItems.map((k, itemIdx) => {
                      const count = Math.max(1, laneItems.length);
                      const duration = durationBase + (k.serial_no % 5) * 1.5;
                      const delay = -((duration / count) * itemIdx);
                      return (
                        <button
                          key={`${k.id}-${shuffleSeed}`}
                          type="button"
                          onClick={() => setSelectedId(k.id)}
                          className={`group absolute top-2 flex flex-col items-center text-center focus:outline-none ${
                            goingRight
                              ? "animate-drift-right"
                              : "animate-drift-left"
                          }`}
                          style={{
                            animationDuration: `${duration}s`,
                            animationDelay: `${delay}s`,
                          }}
                        >
                          <div className="relative transition-transform group-hover:scale-110 group-active:scale-95">
                            <KrathongArt
                              baseId={k.base_id}
                              flowerId={k.flower_id}
                              candleId={k.candle_id}
                              decorId={k.decor_id}
                              auraId={k.aura_id || "none"}
                              size="sm"
                            />
                            {k.voted_by_me && (
                              <span className="absolute -top-1 -right-1 rounded-full bg-rose-500 p-1 shadow-md">
                                <Heart className="w-3 h-3 text-white fill-white" />
                              </span>
                            )}
                            {k.is_mine && (
                              <span className="absolute -top-1 left-0 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-slate-950 shadow">
                                ของคุณ
                              </span>
                            )}
                          </div>

                          {/* ใต้กระทง: รูปโปรไฟล์วงกลมจาก LINE (ไม่แสดงชื่อ) + คำอธิษฐานย่อ */}
                          <div className="mt-1 flex items-center gap-1 max-w-[132px] rounded-full bg-slate-950/75 pl-1 pr-2 py-0.5 border border-white/10">
                            <UserAvatar
                              avatarUrl={k.author.avatar_url}
                              displayName={k.author.display_name}
                              size="xs"
                            />
                            <span className="truncate text-[10px] text-slate-100">
                              “{k.wish_text}”
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination across batches */}
          {totalBatches > 1 && (
            <div className="mt-2 mb-1 flex items-center justify-center gap-2 relative z-20">
              <button
                onClick={() =>
                  setBatchIndex((b) => (b - 1 + totalBatches) % totalBatches)
                }
                className="rounded-xl bg-slate-900/85 border border-sky-400/25 px-3 py-1.5 text-xs text-sky-100"
              >
                ← ชุดก่อนหน้า
              </button>
              <span className="text-xs text-sky-200/80">
                {safeBatchIndex + 1} / {totalBatches}
              </span>
              <button
                onClick={() => setBatchIndex((b) => (b + 1) % totalBatches)}
                className="rounded-xl bg-slate-900/85 border border-sky-400/25 px-3 py-1.5 text-xs text-sky-100"
              >
                ลอยชุดถัดไป →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Krathong Detail & Vote Modal (แสดงรูปโปรไฟล์ + ชื่อ LINE + คำอธิษฐานเมื่อกดดูกระทง) */}
      {selectedKrathong && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-gradient-to-b from-[#0d1f45] to-[#081228] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserAvatar
                  avatarUrl={selectedKrathong.author.avatar_url}
                  displayName={selectedKrathong.author.display_name}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white truncate">
                      {selectedKrathong.author.display_name}
                    </p>
                    {selectedKrathong.is_mine && (
                      <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 shrink-0">
                        ของคุณ
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-300/85">
                    กระทงรักษ์โลก #{String(selectedKrathong.serial_no).padStart(3, "0")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-full bg-slate-800/80 p-1.5 text-slate-300 hover:text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="river-scene flex justify-center py-2 rounded-2xl bg-gradient-to-b from-[#0a2346] to-[#071f3b] border border-sky-400/20">
              <KrathongArt
                baseId={selectedKrathong.base_id}
                flowerId={selectedKrathong.flower_id}
                candleId={selectedKrathong.candle_id}
                decorId={selectedKrathong.decor_id}
                auraId={selectedKrathong.aura_id || "none"}
                size="lg"
              />
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 text-center space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-amber-300/80">
                คำอธิษฐานวันลอยกระทง
              </p>
              <p className="text-sm text-white leading-relaxed">
                “{selectedKrathong.wish_text}”
              </p>
              <p className="text-xs text-slate-400 pt-1">
                คะแนนโหวตปัจจุบัน:{" "}
                <span className="text-amber-300 font-semibold">
                  {selectedKrathong.vote_count}
                </span>{" "}
                โหวต
              </p>
            </div>

            {selectedKrathong.is_mine ? (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 py-3 text-center text-xs text-slate-400">
                นี่คือกระทงของคุณครับ (กดแก้ไขได้ที่แท็บ ลอยกระทง)
              </div>
            ) : !phase.canVote ? (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 py-3 text-center text-xs text-slate-400">
                ปิดรับการโหวตชั่วคราว
              </div>
            ) : (
              <button
                disabled={busyId === selectedKrathong.id}
                onClick={() => handleVoteClick(selectedKrathong)}
                className={`w-full rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition ${
                  selectedKrathong.voted_by_me
                    ? "bg-rose-500/20 border border-rose-400/40 text-rose-200"
                    : "bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-lg"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    selectedKrathong.voted_by_me ? "fill-current" : ""
                  }`}
                />
                {selectedKrathong.voted_by_me
                  ? "ยกเลิกโหวตนี้ (เปลี่ยนใจไปโหวตอันอื่นได้)"
                  : `โหวตให้กระทงนี้ (เหลือสิทธิ์อีก ${votesRemaining} โหวต)`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
