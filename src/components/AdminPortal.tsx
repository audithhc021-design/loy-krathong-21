"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Power, ShieldCheck, X } from "lucide-react";
import type { EventPhaseInfo, PhaseOverride } from "@/lib/types";
import { UserAvatar } from "./UserAvatar";

interface AdminPayload {
  storageMode: "supabase" | "local-dev";
  phase: EventPhaseInfo;
  krathongs: Array<{
    id: string;
    serial_no: number;
    wish_text: string;
    is_hidden: boolean;
    vote_count: number;
    rank: number | null;
    author: {
      id: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
  }>;
  summary: {
    totalUsers: number;
    totalKrathongs: number;
    hiddenKrathongs: number;
    totalVotes: number;
    quizPassedCount: number;
  };
}

interface AdminPortalProps {
  onParentRefresh: () => Promise<void>;
  onClose?: () => void;
}

export function AdminPortal({ onParentRefresh, onClose }: AdminPortalProps) {
  const [password, setPassword] = useState("");
  const [unlockedPassword, setUnlockedPassword] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<AdminPayload | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadAdmin = useCallback(async (pwd: string) => {
    const res = await fetch("/api/admin", {
      headers: { "x-admin-password": pwd },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "รหัสผ่านไม่ถูกต้อง");
    setAdminData(data);
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
    if (!unlockedPassword) return;
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
      return;
    }
    setAdminData(data);
    await onParentRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-300">
          <Lock className="w-5 h-5" />
          <h2 className="text-base font-bold">ผู้ดูแลระบบ (Moderation)</h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-800 p-1.5 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!unlockedPassword || !adminData ? (
        <form
          onSubmit={handleUnlock}
          className="rounded-3xl border border-amber-400/25 bg-slate-900/85 p-5 space-y-4 shadow-xl"
        >
          <p className="text-xs text-slate-300 leading-relaxed">
            ใช้สำหรับผู้ดูแลตรวจสอบ/ซ่อนข้อความไม่เหมาะสม ดูสถิติลดขยะ และเปิด/ปิดระบบ
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
            placeholder="กรอกรหัสผ่านแอดมิน"
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
          />

          <button
            type="submit"
            className="w-full rounded-2xl bg-amber-400 py-3 text-sm font-bold text-slate-950 shadow-lg"
          >
            เข้าสู่หน้าผู้ดูแล
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Eco Summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
              <p className="text-lg font-bold text-white">
                {adminData.summary.totalUsers}
              </p>
              <p className="text-[11px] text-slate-400">ผู้เข้าร่วม</p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
              <p className="text-lg font-bold text-emerald-300">
                {adminData.summary.totalKrathongs}
              </p>
              <p className="text-[11px] text-slate-400">ลดขยะได้ (ใบ)</p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
              <p className="text-lg font-bold text-amber-300">
                {adminData.summary.totalVotes}
              </p>
              <p className="text-[11px] text-slate-400">คะแนนโหวตรวม</p>
            </div>
          </div>

          {/* Open/Close System Toggle */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
              <Power className="w-4 h-4" />
              สถานะการเปิดรับลอยกระทงและโหวต
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "open", label: "เปิดให้บริการปกติ" },
                  { id: "closed", label: "ปิดระบบชั่วคราว" },
                ] as Array<{ id: PhaseOverride; label: string }>
              ).map((opt) => {
                const active =
                  opt.id === "open"
                    ? !adminData.phase.isClosed
                    : adminData.phase.isClosed;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      runAdminAction({
                        action: "set_phase_override",
                        override: opt.id,
                      })
                    }
                    className={`rounded-xl py-2 px-3 text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                      active
                        ? "bg-amber-400/20 border-amber-400 text-amber-200"
                        : "bg-slate-950/60 border-slate-800 text-slate-400"
                    }`}
                  >
                    {active && <ShieldCheck className="w-3.5 h-3.5" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {actionMsg && (
            <div className="rounded-2xl bg-rose-500/15 border border-rose-400/30 p-3 text-xs text-rose-200">
              {actionMsg}
            </div>
          )}

          {/* Moderation List */}
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-slate-200">
              ตรวจข้อความกระทงทั้งหมด ({adminData.krathongs.length})
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
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      avatarUrl={k.author?.avatar_url}
                      displayName={k.author?.display_name || "ผู้ใช้"}
                      size="xs"
                    />
                    <p className="text-xs font-bold text-white truncate">
                      {k.author?.display_name || "-"} (#
                      {String(k.serial_no).padStart(3, "0")})
                    </p>
                  </div>
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
        </div>
      )}
    </div>
  );
}
