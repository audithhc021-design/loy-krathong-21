"use client";

import React, { useCallback, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  Award,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Gift,
  Lock,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { EventPhaseInfo, MissionStatus, PhaseOverride } from "@/lib/types";
import { KrathongArt } from "./KrathongArt";

interface AdminPayload {
  storageMode: "supabase" | "local-dev";
  phase: EventPhaseInfo;
  users: Array<{
    id: string;
    full_name: string;
    department: string;
    quiz_passed: boolean;
    missionStatus: MissionStatus;
  }>;
  krathongs: Array<{
    id: string;
    serial_no: number;
    base_id: string;
    flower_id: string;
    candle_id: string;
    decor_id: string;
    aura_id?: string;
    wish_text: string;
    is_hidden: boolean;
    is_judge_pick: boolean;
    judge_award_label: string | null;
    vote_count: number;
    rank: number | null;
    author: {
      id: string;
      full_name: string;
      department: string;
    } | null;
  }>;
  prizes: Array<{
    id: string;
    title: string;
    sort_order: number;
    winner_user_id: string | null;
    drawn_at: string | null;
    winner: {
      id: string;
      full_name: string;
      department: string;
    } | null;
  }>;
  eligiblePool: Array<{
    id: string;
    full_name: string;
    department: string;
  }>;
  summary: {
    totalUsers: number;
    totalKrathongs: number;
    totalVotes: number;
    totalEligibleAll: number;
    remainingPoolCount: number;
  };
}

interface AdminPortalProps {
  onParentRefresh: () => Promise<void>;
}

export function AdminPortal({ onParentRefresh }: AdminPortalProps) {
  const [password, setPassword] = useState("");
  const [unlockedPassword, setUnlockedPassword] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<AdminPayload | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"draw" | "judge" | "moderate" | "phase">(
    "draw"
  );

  // Lucky Draw Stage state
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>("");
  const [newPrizeTitle, setNewPrizeTitle] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningName, setSpinningName] = useState<string>("");
  const [spinningDept, setSpinningDept] = useState<string>("");
  const [latestWinner, setLatestWinner] = useState<{
    full_name: string;
    department: string;
    prizeTitle: string;
  } | null>(null);
  const [directorFullscreen, setDirectorFullscreen] = useState(false);

  const loadAdmin = useCallback(async (pwd: string) => {
    const res = await fetch("/api/admin", {
      headers: { "x-admin-password": pwd },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "รหัสผ่านไม่ถูกต้อง");
    setAdminData(data);
    setSelectedPrizeId((prev) => {
      if (prev && data.prizes.some((p: { id: string }) => p.id === prev)) {
        return prev;
      }
      const nextUndrawn = data.prizes.find(
        (p: { winner_user_id: string | null }) => !p.winner_user_id
      );
      return nextUndrawn?.id || data.prizes[0]?.id || "";
    });
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("lk69_admin_pwd");
    if (saved) {
      loadAdmin(saved)
        .then(() => setUnlockedPassword(saved))
        .catch(() => sessionStorage.removeItem("lk69_admin_pwd"));
    }
  }, [loadAdmin]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    try {
      await loadAdmin(password);
      sessionStorage.setItem("lk69_admin_pwd", password);
      setUnlockedPassword(password);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "รหัสผ่านไม่ถูกต้อง");
    }
  }

  async function runAdminAction(body: Record<string, unknown>) {
    if (!unlockedPassword) return null;
    setActionMsg(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": unlockedPassword,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setActionMsg(data.error || "ดำเนินการไม่สำเร็จ");
      return null;
    }
    if (data.adminState) {
      setAdminData(data.adminState);
    } else if (data.summary) {
      setAdminData(data);
    }
    await onParentRefresh();
    return data;
  }

  async function handleDirectorSpin() {
    if (!adminData || !selectedPrizeId || isSpinning) return;
    if (adminData.eligiblePool.length === 0) {
      setActionMsg("ไม่มีรายชื่อที่ทำภารกิจครบเหลืออยู่ในกล่องสุ่มแล้ว");
      return;
    }

    const prize = adminData.prizes.find((p) => p.id === selectedPrizeId);
    setLatestWinner(null);
    setActionMsg(null);
    setIsSpinning(true);

    // Visual cycling animation for recording video with the Director!
    const pool = adminData.eligiblePool;
    const interval = setInterval(() => {
      const sample = pool[Math.floor(Math.random() * pool.length)];
      setSpinningName(sample.full_name);
      setSpinningDept(sample.department);
    }, 80);

    try {
      const [res] = await Promise.all([
        runAdminAction({ action: "draw_lucky_winner", prizeId: selectedPrizeId }),
        new Promise((r) => setTimeout(r, 2400)),
      ]);
      clearInterval(interval);
      if (res?.drawnWinner) {
        setSpinningName(res.drawnWinner.full_name);
        setSpinningDept(res.drawnWinner.department);
        setLatestWinner({
          full_name: res.drawnWinner.full_name,
          department: res.drawnWinner.department,
          prizeTitle: prize?.title || "รางวัล Lucky Draw",
        });
        confetti({
          particleCount: 130,
          spread: 95,
          origin: { y: 0.55 },
        });
        setTimeout(
          () => confetti({ particleCount: 90, spread: 120, origin: { y: 0.45 } }),
          350
        );
      }
    } finally {
      clearInterval(interval);
      setIsSpinning(false);
    }
  }

  if (!unlockedPassword || !adminData) {
    return (
      <form
        onSubmit={handleUnlock}
        className="rounded-3xl border border-amber-400/25 bg-slate-900/85 p-6 space-y-4 shadow-xl"
      >
        <div className="flex items-center gap-2 text-amber-300">
          <Lock className="w-5 h-5" />
          <h2 className="text-base font-bold">เข้าสู่ระบบเมนูแอดมิน</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          สำหรับคณะกรรมการคัดเลือกรางวัลชมเชย 2 รางวัล, ตรวจสอบข้อความ,
          และเปิดหน้าจอกดสุ่มจับฉลาก Lucky Draw ให้ผู้อำนวยการถ่ายวิดีโอ
        </p>

        {authError && (
          <div className="rounded-xl bg-rose-500/15 border border-rose-400/30 p-3 text-xs text-rose-200">
            {authError}
          </div>
        )}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="กรอกรหัสผ่านแอดมิน (ค่าเริ่มต้น: loykrathong2569)"
          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
        />

        <button
          type="submit"
          className="w-full rounded-2xl bg-amber-400 py-3 text-sm font-bold text-slate-950 shadow-lg"
        >
          ปลดล็อกเมนูแอดมิน
        </button>
      </form>
    );
  }

  const judgePickCount = adminData.krathongs.filter((k) => k.is_judge_pick).length;

  const luckyDrawStage = (
    <div
      className={`${
        directorFullscreen
          ? "fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#07112b] via-[#0d2250] to-[#061026] p-6 flex flex-col justify-center"
          : "rounded-3xl border border-amber-400/35 bg-gradient-to-b from-[#0c1d44] to-[#081229] p-5"
      } space-y-4 shadow-2xl`}
    >
      <div className="flex items-center justify-between gap-2 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2 text-amber-300">
          <Gift className="w-5 h-5" />
          <h3 className="text-sm sm:text-base font-bold">
            โหมดจับฉลากสด (สำหรับผู้อำนวยการกดสุ่ม)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setDirectorFullscreen((f) => !f)}
          className="inline-flex items-center gap-1 rounded-xl bg-slate-800/90 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200"
        >
          {directorFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              ย่อจอ
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              ขยายเต็มจอถ่ายคลิป
            </>
          )}
        </button>
      </div>

      <div className="max-w-xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 rounded-2xl px-4 py-2.5 border border-slate-800">
          <span>รายชื่อผู้ทำภารกิจครบ (คงเหลือในกล่องสุ่ม):</span>
          <span className="text-base font-bold text-emerald-300">
            {adminData.summary.remainingPoolCount} / {adminData.summary.totalEligibleAll} คน
          </span>
        </div>

        {/* Prize Selector */}
        <div>
          <label className="block text-xs text-amber-200 mb-1.5 font-medium">
            เลือกรางวัลที่จะกดสุ่มในรอบนี้:
          </label>
          <select
            value={selectedPrizeId}
            onChange={(e) => {
              setSelectedPrizeId(e.target.value);
              setLatestWinner(null);
            }}
            disabled={isSpinning}
            className="w-full rounded-2xl bg-slate-950 border border-amber-400/30 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
          >
            {adminData.prizes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.winner ? `(ได้ผู้โชคดีแล้ว: ${p.winner.full_name})` : "(ยังไม่สุ่ม)"}
              </option>
            ))}
          </select>
        </div>

        {/* Spotlight Reel Display */}
        <div className="rounded-3xl border-2 border-amber-400/40 bg-gradient-to-b from-slate-950/90 to-[#0e224d] px-5 py-8 text-center space-y-3 shadow-inner">
          {isSpinning ? (
            <>
              <p className="text-xs uppercase tracking-widest text-amber-300 animate-pulse">
                กำลังสุ่มรายชื่อผู้โชคดี...
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-white transition-all">
                {spinningName}
              </p>
              <p className="text-xs sm:text-sm text-sky-300">{spinningDept}</p>
            </>
          ) : latestWinner ? (
            <>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950">
                <Sparkles className="w-3.5 h-3.5" />
                ขอแสดงความยินดี!
              </div>
              <p className="text-xs text-amber-200">{latestWinner.prizeTitle}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                {latestWinner.full_name}
              </p>
              <p className="text-sm text-sky-300">{latestWinner.department}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-amber-200">
                พร้อมจับฉลากผู้โชคดี
              </p>
              <p className="text-xs text-slate-400">
                กดปุ่มสีทองด้านล่างเพื่อสุ่ม 1 รายชื่อจากพนักงานที่ทำครบ 3 ภารกิจ
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleDirectorSpin}
          disabled={isSpinning || adminData.eligiblePool.length === 0 || !selectedPrizeId}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 py-4 text-base font-extrabold text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.35)] hover:brightness-105 disabled:opacity-50 active:scale-[0.99] transition"
        >
          {isSpinning ? "กำลังหมุนสุ่มรายชื่อ..." : "🎉 กดสุ่มผู้โชคดี!"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Admin Summary Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
          <p className="text-lg font-bold text-white">{adminData.summary.totalUsers}</p>
          <p className="text-[11px] text-slate-400">ผู้ลงทะเบียน</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
          <p className="text-lg font-bold text-amber-300">
            {adminData.summary.totalKrathongs}
          </p>
          <p className="text-[11px] text-slate-400">กระทงที่ส่ง</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
          <p className="text-lg font-bold text-emerald-300">
            {adminData.summary.totalEligibleAll}
          </p>
          <p className="text-[11px] text-slate-400">ทำครบ 3 ภารกิจ</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800">
        {(
          [
            { id: "draw", label: "จับฉลาก" },
            { id: "judge", label: `ชมเชย (${judgePickCount}/2)` },
            { id: "moderate", label: "ตรวจงาน" },
            { id: "phase", label: "ช่วงเวลา" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              subTab === t.id
                ? "bg-amber-400 text-slate-950"
                : "text-slate-300 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div className="rounded-2xl bg-rose-500/15 border border-rose-400/30 p-3 text-xs text-rose-200">
          {actionMsg}
        </div>
      )}

      {subTab === "draw" && (
        <div className="space-y-4">
          {luckyDrawStage}

          {/* Add Prize & List */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-4 space-y-3">
            <h4 className="text-xs font-bold text-white">จัดการรายการของรางวัล Lucky Draw</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPrizeTitle}
                onChange={(e) => setNewPrizeTitle(e.target.value)}
                placeholder="เพิ่มชื่อของรางวัลใหม่..."
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newPrizeTitle.trim()) return;
                  await runAdminAction({ action: "add_prize", title: newPrizeTitle });
                  setNewPrizeTitle("");
                }}
                className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่ม
              </button>
            </div>

            <div className="space-y-2">
              {adminData.prizes.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-200 truncate">
                      {p.title}
                    </p>
                    {p.winner ? (
                      <p className="text-xs text-emerald-300 mt-0.5">
                        ผู้โชคดี: {p.winner.full_name} ({p.winner.department})
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-0.5">ยังไม่ได้สุ่ม</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.winner && (
                      <button
                        type="button"
                        title="ล้างผลรางวัลนี้เพื่อสุ่มใหม่"
                        onClick={() =>
                          runAdminAction({ action: "clear_prize_winner", prizeId: p.id })
                        }
                        className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="ลบรางวัล"
                      onClick={() =>
                        runAdminAction({ action: "delete_prize", prizeId: p.id })
                      }
                      className="rounded-lg bg-rose-500/15 p-1.5 text-rose-300 hover:bg-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === "judge" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-pink-400/25 bg-pink-500/10 p-3.5 text-xs text-pink-100">
            เลือกรางวัลโดนใจกรรมการ / ชมเชย ได้สูงสุด <strong>2 รางวัล</strong>{" "}
            (ระบบป้องกันการเลือกซ้ำกับกระทงที่ได้อันดับ 1–3)
          </div>

          {adminData.krathongs
            .filter((k) => !k.is_hidden)
            .map((k) => {
              const isTop3 = k.rank !== null && k.rank <= 3;
              return (
                <div
                  key={k.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 flex items-center gap-3"
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
                      <span className="text-xs font-bold text-white truncate">
                        #{k.rank ?? "-"} {k.author?.full_name || "-"}
                      </span>
                      <span className="text-xs text-amber-300 font-semibold shrink-0">
                        {k.vote_count} โหวต
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-300">{k.author?.department}</p>
                    <p className="text-xs text-slate-300">“{k.wish_text}”</p>
                    <div className="pt-1">
                      {isTop3 ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/15 px-2.5 py-1 text-[11px] text-amber-200">
                          ติดอันดับ {k.rank} อยู่แล้ว
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            runAdminAction({
                              action: "toggle_judge_pick",
                              krathongId: k.id,
                            })
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                            k.is_judge_pick
                              ? "bg-pink-400 text-slate-950"
                              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          {k.is_judge_pick
                            ? "ได้รับรางวัลชมเชย ✓ (กดเพื่อยกเลิก)"
                            : "เลือกรางวัลชมเชย"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {subTab === "moderate" && (
        <div className="space-y-4">
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-amber-200">
              กระทงทั้งหมดและตัวตนจริง ({adminData.krathongs.length})
            </h4>
            {adminData.krathongs.map((k) => (
              <div
                key={k.id}
                className={`rounded-2xl border p-3 flex items-center justify-between gap-3 ${
                  k.is_hidden
                    ? "border-rose-500/30 bg-rose-950/20 opacity-70"
                    : "border-slate-800 bg-slate-900/75"
                }`}
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-bold text-white">
                    #{String(k.serial_no).padStart(3, "0")} —{" "}
                    {k.author?.full_name || "-"}
                  </p>
                  <p className="text-[11px] text-sky-300">{k.author?.department}</p>
                  <p className="text-xs text-slate-300">“{k.wish_text}”</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    runAdminAction({
                      action: "toggle_hidden",
                      krathongId: k.id,
                      is_hidden: !k.is_hidden,
                    })
                  }
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1 ${
                    k.is_hidden
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-rose-500/20 text-rose-200"
                  }`}
                >
                  {k.is_hidden ? (
                    <>
                      <Eye className="w-3.5 h-3.5" /> แสดง
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> ซ่อน
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-200">
              สถานะภารกิจรายบุคคล ({adminData.users.length} คน)
            </h4>
            {adminData.users.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{u.full_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{u.department}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[11px]">
                  <span
                    className={
                      u.missionStatus.has_krathong
                        ? "text-emerald-300"
                        : "text-slate-500"
                    }
                  >
                    กระทง
                  </span>
                  <span
                    className={
                      u.missionStatus.quiz_passed
                        ? "text-emerald-300"
                        : "text-slate-500"
                    }
                  >
                    ควิซ
                  </span>
                  <span
                    className={
                      u.missionStatus.votes_completed
                        ? "text-emerald-300"
                        : "text-slate-400"
                    }
                  >
                    โหวต {u.missionStatus.votes_cast}/3
                  </span>
                  {u.missionStatus.is_lucky_draw_eligible && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "phase" && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-300">
            <Clock className="w-4 h-4" />
            <h4 className="text-xs font-bold">
              ควบคุมช่วงเวลากิจกรรม (สำหรับทดสอบก่อนวันจริง)
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            ค่าปกติคือ <strong>อัตโนมัติตามเวลาจริง (auto)</strong> แต่แอดมินสามารถจำลองสลับช่วงเวลาเพื่อทดสอบหน้าจอหลัง 16:00 น., หลัง 24:00 น. และหน้าประกาศผล 08:00 น. ได้ทันที
          </p>

          <div className="space-y-2">
            {(
              [
                {
                  id: "auto",
                  title: "อัตโนมัติตามเวลาจริง (แนะนำสำหรับวันงาน)",
                  desc: "เปลี่ยนใจได้ถึง 24 พ.ย. 16:00 | ปิดรับ 24:00 | ประกาศผล 25 พ.ย. 08:00",
                },
                {
                  id: "open",
                  title: "จำลอง: เปิดกิจกรรมเต็มรูปแบบ (ก่อน 16:00 น.)",
                  desc: "ส่งกระทง ทำควิซ โหวต และเปลี่ยนใจยกเลิกโหวตได้",
                },
                {
                  id: "locked_voting",
                  title: "จำลอง: หลัง 16:00 น. วันที่ 24 พ.ย. (ล็อกโหวต)",
                  desc: "โหวตที่กดไว้แล้วเปลี่ยนใจไม่ได้ แต่ยังโหวตเพิ่มให้ครบ 3 ได้",
                },
                {
                  id: "closed",
                  title: "จำลอง: ปิดรับงานหลังเที่ยงคืน (00:00–07:59 น.)",
                  desc: "ปิดส่ง ปิดควิซ ปิดโหวต รอแอดมินและผู้อำนวยการจับฉลาก",
                },
                {
                  id: "revealed",
                  title: "จำลอง/เปิดใช้: ประกาศผลทางการ (08:00 น. วันที่ 25 พ.ย.)",
                  desc: "เปิดเผยชื่อเจ้าของกระทง อันดับ 1–3 รางวัลชมเชย และ Lucky Draw",
                },
              ] as Array<{ id: PhaseOverride; title: string; desc: string }>
            ).map((opt) => {
              const active = adminData.phase.override === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    runAdminAction({ action: "set_phase_override", override: opt.id })
                  }
                  className={`w-full text-left rounded-2xl p-3 border transition ${
                    active
                      ? "bg-amber-400/15 border-amber-400 text-white"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{opt.title}</span>
                    {active && <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
