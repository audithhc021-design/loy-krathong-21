"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Leaf,
  Lightbulb,
  Loader2,
  LogIn,
  LogOut,
  Shield,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";
import { AdminPortal } from "@/components/AdminPortal";
import { AuthGateModal } from "@/components/AuthGateModal";
import { EcoQuizView } from "@/components/EcoQuizView";
import { KrathongBuilderView } from "@/components/KrathongBuilderView";
import { LeaderboardAndResults } from "@/components/LeaderboardAndResults";
import { RiverView } from "@/components/RiverView";
import { UserAvatar } from "@/components/UserAvatar";
import { loyKrathongAudio } from "@/lib/audio";
import type {
  EventPhaseInfo,
  PublicKrathongView,
  UserRecord,
  VoteQuotaStatus,
} from "@/lib/types";

interface AppStateResponse {
  storageMode: "supabase" | "local-dev";
  liffConfigured: boolean;
  phase: EventPhaseInfo;
  me: {
    user: UserRecord;
    activityStatus: VoteQuotaStatus;
    krathong: PublicKrathongView | null;
  } | null;
  krathongs: PublicKrathongView[];
  stats: {
    totalParticipants: number;
    totalKrathongs: number;
    totalVotes: number;
  };
  devUsers: Array<{
    id: string;
    display_name: string;
  }>;
}

export default function HomePage() {
  const [state, setState] = useState<AppStateResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "river" | "builder" | "quiz" | "leaderboard"
  >("river");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
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

  return (
    <div
      className={`min-h-screen pb-24 transition-colors duration-300 ${
        theme === "cream" ? "theme-cream bg-[#faf5e8]" : "bg-[#060e22]"
      }`}
    >
      {/* Top App Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07112b]/90 backdrop-blur-md">
        <div className="mx-auto max-w-md px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <h1 className="text-xs sm:text-sm font-bold text-white truncate">
                ศูนย์21 ลอยกระทงรักษ์โลก ๒๕๖๙
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  state.phase.isClosed
                    ? "bg-slate-700/70 text-slate-200 border-slate-600"
                    : "bg-emerald-400/15 text-emerald-200 border-emerald-400/30"
                }`}
              >
                {state.phase.isClosed ? "ปิดกิจกรรมชั่วคราว" : "ร่วมลอยกระทงออนไลน์"}
              </span>
              <span className="text-[10px] text-slate-400">
                {state.stats.totalKrathongs} กระทง
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === "dark" ? "cream" : "dark"))}
              title={
                theme === "dark"
                  ? "เปิดไฟ (โทนขาวครีมสว่าง)"
                  : "ปิดไฟ (โหมดกลางคืน)"
              }
              className={`rounded-xl border p-1.5 text-[11px] flex items-center transition ${
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
              className={`rounded-xl border p-1.5 text-[11px] flex items-center transition ${
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

            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              title="ผู้ดูแลระบบ"
              className="rounded-xl border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-amber-300 transition"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>

            {state.me ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => !state.liffConfigured && setShowAuthModal(true)}
                  className="rounded-xl bg-slate-900 border border-slate-700 pl-1.5 pr-2 py-1 text-[11px] text-slate-200 flex items-center gap-1.5 max-w-[115px]"
                >
                  <UserAvatar
                    avatarUrl={state.me.user.avatar_url}
                    displayName={
                      state.me.user.display_name || state.me.user.full_name
                    }
                    size="xs"
                  />
                  <span className="truncate">
                    {state.me.user.display_name || state.me.user.full_name}
                  </span>
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
                className="rounded-xl bg-amber-400 px-2.5 py-1.5 text-xs font-bold text-slate-950 flex items-center gap-1 shadow"
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
            activityStatus={state.me?.activityStatus ?? null}
            isLoggedIn={Boolean(state.me)}
            onRequireLogin={() => setShowAuthModal(true)}
            onVoteAction={handleVoteAction}
            onGoToBuilder={() => setActiveTab("builder")}
            onGoToQuiz={() => setActiveTab("quiz")}
          />
        )}

        {activeTab === "builder" && (
          <KrathongBuilderView
            phase={state.phase}
            isLoggedIn={Boolean(state.me)}
            myKrathong={state.me?.krathong ?? null}
            totalKrathongs={state.stats.totalKrathongs}
            onRequireLogin={() => setShowAuthModal(true)}
            onRefreshState={fetchState}
            onGoToRiver={() => setActiveTab("river")}
            onGoToQuiz={() => setActiveTab("quiz")}
          />
        )}

        {activeTab === "quiz" && (
          <EcoQuizView
            phase={state.phase}
            isLoggedIn={Boolean(state.me)}
            activityStatus={state.me?.activityStatus ?? null}
            onRequireLogin={() => setShowAuthModal(true)}
            onRefreshState={fetchState}
            onGoToRiver={() => setActiveTab("river")}
          />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardAndResults krathongs={state.krathongs} />
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm rounded-2xl bg-slate-900 border border-amber-400/40 px-4 py-3 text-center text-xs font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}

      {/* Sticky Bottom Mobile Navigation (4 Citizen-friendly Tabs) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#07112b]/95 backdrop-blur-md">
        <div className="mx-auto max-w-md grid grid-cols-4 px-2 py-1.5">
          {(
            [
              { id: "river", label: "แม่น้ำ", icon: Waves },
              { id: "builder", label: "ลอยกระทง", icon: Sparkles },
              { id: "quiz", label: "ควิซรักษ์โลก", icon: Leaf },
              { id: "leaderboard", label: "ยอดนิยม", icon: Trophy },
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

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthGateModal
          liffConfigured={state.liffConfigured}
          devUsers={state.devUsers}
          onAuthenticated={async () => {
            setShowAuthModal(false);
            await fetchState();
          }}
          onClose={
            state.liffConfigured ? undefined : () => setShowAuthModal(false)
          }
        />
      )}

      {/* Admin Moderation Modal (opened via subtle top-right Shield icon) */}
      {showAdminModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3"
          onClick={() => setShowAdminModal(false)}
        >
          <div
            className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl border border-amber-400/30 bg-[#0c1a38] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminPortal
              onParentRefresh={fetchState}
              onClose={() => setShowAdminModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
