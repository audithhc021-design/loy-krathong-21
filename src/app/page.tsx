"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Lightbulb,
  Loader2,
  LogIn,
  LogOut,
  Shield,
  Sparkles,
  Trophy,
  UserCheck,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";
import { AdminPortal } from "@/components/AdminPortal";
import { AuthGateModal } from "@/components/AuthGateModal";
import { LeaderboardAndResults } from "@/components/LeaderboardAndResults";
import { MissionsAndBuilder } from "@/components/MissionsAndBuilder";
import { RiverView } from "@/components/RiverView";
import { loyKrathongAudio } from "@/lib/audio";
import type {
  EventPhaseInfo,
  MissionStatus,
  PublicKrathongView,
  UserRecord,
} from "@/lib/types";

interface AppStateResponse {
  storageMode: "supabase" | "local-dev";
  liffConfigured: boolean;
  phase: EventPhaseInfo;
  me: {
    user: UserRecord;
    missionStatus: MissionStatus;
    krathong: PublicKrathongView | null;
  } | null;
  krathongs: PublicKrathongView[];
  results: {
    top3: PublicKrathongView[];
    judgePicks: PublicKrathongView[];
    luckyDraw: Array<{
      id: string;
      title: string;
      sort_order: number;
      drawn_at: string | null;
      winner: {
        full_name: string;
        department: string;
        avatar_url: string | null;
      } | null;
    }>;
  } | null;
  stats: {
    totalParticipants: number;
    totalKrathongs: number;
    eligibleLuckyDrawCount: number;
  };
  devUsers: Array<{
    id: string;
    full_name: string;
    department: string;
  }>;
}

export default function HomePage() {
  const [state, setState] = useState<AppStateResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "river" | "missions" | "leaderboard" | "admin"
  >("river");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [theme, setTheme] = useState<"dark" | "cream">("dark");

  async function toggleMusic() {
    if (musicOn) {
      loyKrathongAudio.stop();
      setMusicOn(false);
    } else {
      await loyKrathongAudio.start();
      setMusicOn(true);
    }
  }

  useEffect(() => {
    return () => {
      loyKrathongAudio.stop();
    };
  }, []);

  const fetchState = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        const detail = data?.detail ? ` (${data.detail})` : "";
        setLoadError(`${data?.error || "โหลดข้อมูลไม่สำเร็จ"}${detail}`);
        return;
      }
      const typed = data as AppStateResponse;
      setState(typed);
      // If LIFF is configured and user is not logged in yet, auto-start LIFF onboarding
      if (typed.liffConfigured && !typed.me) {
        setShowAuthModal(true);
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"
      );
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  function showToastMessage(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleVoteAction(
    krathongId: string,
    action: "cast" | "unvote"
  ) {
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ krathongId, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToastMessage(data.error || "ไม่สามารถโหวตได้");
      return;
    }
    showToastMessage(
      action === "cast" ? "บันทึกคะแนนโหวตแล้ว!" : "ยกเลิกโหวตเรียบร้อยแล้ว"
    );
    await fetchState();
  }

  async function handleLogout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    await fetchState();
  }

  if (!state) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center text-slate-300">
        {loadError ? (
          <div className="max-w-sm w-full rounded-3xl border border-rose-400/30 bg-slate-900/90 p-5 space-y-3">
            <p className="text-sm font-bold text-rose-300">
              เกิดข้อผิดพลาดในการโหลดระบบ
            </p>
            <p className="text-xs text-slate-200 break-words leading-relaxed">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => fetchState()}
              className="w-full rounded-2xl bg-amber-400 py-2.5 text-xs font-bold text-slate-950"
            >
              ลองโหลดใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-xs">กำลังเตรียมสายน้ำวันลอยกระทง...</p>
          </>
        )}
      </main>
    );
  }

  const phaseBadge =
    state.phase.phase === "revealed"
      ? { text: "ประกาศผลแล้ว", color: "bg-emerald-400/20 text-emerald-200 border-emerald-400/30" }
      : state.phase.phase === "closed"
      ? { text: "ปิดรับโหวต (รอผล 08:00)", color: "bg-slate-700/70 text-slate-200 border-slate-600" }
      : state.phase.phase === "locked_voting"
      ? { text: "โค้งสุดท้าย (ล็อกโหวต)", color: "bg-orange-400/20 text-orange-200 border-orange-400/30" }
      : { text: "เปิดร่วมกิจกรรมถึง 24 พ.ย.", color: "bg-amber-400/15 text-amber-200 border-amber-400/30" };

  return (
    <div
      className={`min-h-screen pb-24 transition-colors duration-300 ${
        theme === "cream" ? "theme-cream bg-[#faf5e8]" : "bg-[#060e22]"
      }`}
    >
      {/* Top App Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07112b]/90 backdrop-blur-md">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <h1 className="text-sm font-bold text-white">
                ศูนย์21 ลอยกระทงรักษ์โลก ๒๕๖๙
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${phaseBadge.color}`}
              >
                {phaseBadge.text}
              </span>
              <span className="text-[10px] text-slate-400">
                {state.stats.totalKrathongs} กระทง
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === "dark" ? "cream" : "dark"))}
              title={
                theme === "dark"
                  ? "เปิดไฟ (โทนขาวครีมสว่าง)"
                  : "ปิดไฟ (โหมดกลางคืน)"
              }
              className={`rounded-xl border px-2 py-1.5 text-[11px] font-medium flex items-center gap-1 transition ${
                theme === "cream"
                  ? "bg-amber-400/25 border-amber-500/50 text-amber-800"
                  : "bg-slate-900 border-slate-800 text-amber-300 hover:text-amber-200"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={toggleMusic}
              title={musicOn ? "ปิดเพลงลอยกระทง" : "เปิดเพลงลอยกระทง"}
              className={`rounded-xl border px-2 py-1.5 text-[11px] font-medium flex items-center gap-1 transition ${
                musicOn
                  ? "bg-amber-400/20 border-amber-400/50 text-amber-200"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {musicOn ? (
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>

            {state.me ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => !state.liffConfigured && setShowAuthModal(true)}
                  className="rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-200 flex items-center gap-1.5 max-w-[120px]"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate">{state.me.user.full_name}</span>
                </button>
                {!state.liffConfigured && (
                  <button
                    onClick={handleLogout}
                    title="สลับผู้ใช้งานทดสอบ"
                    className="rounded-xl bg-slate-900 border border-slate-800 p-1.5 text-slate-400 hover:text-white"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow"
              >
                <LogIn className="w-3.5 h-3.5" />
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Mobile Container */}
      <main className="mx-auto max-w-md px-4 pt-4">
        {state.storageMode === "local-dev" && activeTab === "river" && (
          <div className="mb-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-200">
            กำลังรันด้วยข้อมูลทดสอบในเครื่อง (Local Dev) — ตั้งค่า{" "}
            <code>.env.local</code> เพื่อเชื่อม Supabase และ LINE LIFF จริง
          </div>
        )}

        {activeTab === "river" && (
          <RiverView
            krathongs={state.krathongs}
            phase={state.phase}
            missionStatus={state.me?.missionStatus ?? null}
            isLoggedIn={Boolean(state.me)}
            onRequireLogin={() => setShowAuthModal(true)}
            onVoteAction={handleVoteAction}
            onGoToBuilder={() => setActiveTab("missions")}
          />
        )}

        {activeTab === "missions" && (
          <MissionsAndBuilder
            phase={state.phase}
            isLoggedIn={Boolean(state.me)}
            missionStatus={state.me?.missionStatus ?? null}
            myKrathong={state.me?.krathong ?? null}
            onRequireLogin={() => setShowAuthModal(true)}
            onRefreshState={fetchState}
            onGoToRiver={() => setActiveTab("river")}
          />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardAndResults
            phase={state.phase}
            krathongs={state.krathongs}
            results={state.results}
          />
        )}

        {activeTab === "admin" && <AdminPortal onParentRefresh={fetchState} />}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm rounded-2xl bg-slate-900 border border-amber-400/40 px-4 py-3 text-center text-xs font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}

      {/* Sticky Bottom Mobile Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#07112b]/95 backdrop-blur-md">
        <div className="mx-auto max-w-md grid grid-cols-4 px-2 py-1.5">
          {(
            [
              { id: "river", label: "แม่น้ำ", icon: Waves },
              { id: "missions", label: "ภารกิจ", icon: Sparkles },
              { id: "leaderboard", label: state.phase.isRevealed ? "ผลรางวัล" : "อันดับ", icon: Trophy },
              { id: "admin", label: "แอดมิน", icon: Shield },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition ${
                  active ? "text-amber-300" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "scale-110" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Auth / Onboarding Modal */}
      {showAuthModal && (
        <AuthGateModal
          liffConfigured={state.liffConfigured}
          devUsers={state.devUsers}
          onAuthenticated={async () => {
            setShowAuthModal(false);
            await fetchState();
          }}
          onClose={state.liffConfigured ? undefined : () => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
