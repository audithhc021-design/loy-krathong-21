"use client";

import React, { useEffect, useState } from "react";
import liff from "@line/liff";
import { Loader2, Sparkles, UserCheck } from "lucide-react";

interface DevUserOption {
  id: string;
  display_name: string;
}

interface AuthGateModalProps {
  liffConfigured: boolean;
  devUsers: DevUserOption[];
  onAuthenticated: () => Promise<void>;
  onClose?: () => void;
}

export function AuthGateModal({
  liffConfigured,
  devUsers,
  onAuthenticated,
  onClose,
}: AuthGateModalProps) {
  const [status, setStatus] = useState<"init" | "ready" | "submitting" | "error">(
    liffConfigured ? "init" : "ready"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!liffConfigured) return;

    let cancelled = false;
    async function bootLiff() {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID!;
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        const idToken = liff.getIDToken();
        if (!idToken) {
          throw new Error(
            "ไม่ได้รับสิทธิ์ ID Token จาก LINE (กรุณาเปิด scope openid ใน LINE Developers)"
          );
        }
        if (cancelled) return;

        // ดึงชื่อและรูปโปรไฟล์จาก LINE เข้าสู่ระบบทันทีโดยไม่ต้องกรอกฟอร์มเพิ่ม
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "line", idToken }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "เข้าสู่ระบบ LINE ไม่สำเร็จ");
        }
        if (!cancelled) {
          await onAuthenticated();
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(
            err instanceof Error ? err.message : "เชื่อมต่อ LINE LIFF ไม่สำเร็จ"
          );
        }
      }
    }

    bootLiff();
    return () => {
      cancelled = true;
    };
  }, [liffConfigured, onAuthenticated]);

  async function handleDevSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg("กรุณาพิมพ์ชื่อที่ต้องการแสดง");
      return;
    }
    setErrorMsg(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "dev", display_name: displayName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      await onAuthenticated();
    } catch (err) {
      setStatus("ready");
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  async function handleDevQuickLogin(devUserId: string) {
    setErrorMsg(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "dev", devUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "สลับผู้ใช้ไม่สำเร็จ");
      await onAuthenticated();
    } catch (err) {
      setStatus("ready");
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3">
      <div className="w-full max-w-md rounded-3xl border border-amber-400/25 bg-[#0c1a38] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-amber-300">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-bold">
              {liffConfigured ? "กำลังเข้าสู่ระบบด้วย LINE" : "เข้าสู่ระบบร่วมลอยกระทง"}
            </h2>
          </div>
          {onClose && status !== "submitting" && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              ปิด
            </button>
          )}
        </div>

        {status === "init" && (
          <div className="py-10 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
            <p className="text-sm text-slate-300">
              กำลังดึงข้อมูลโปรไฟล์ LINE ของคุณ...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-rose-500/15 border border-rose-400/30 p-4 text-sm text-rose-200">
              {errorMsg}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-2xl bg-amber-500 py-3 font-semibold text-slate-950"
            >
              ลองเชื่อมต่อใหม่
            </button>
          </div>
        )}

        {(status === "ready" || status === "submitting") && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/25 p-3 text-xs text-emerald-200">
              <span className="font-semibold">โหมดทดสอบ (Dev Mode):</span>{" "}
              ยังไม่ได้ตั้งค่า <code className="text-amber-300">NEXT_PUBLIC_LIFF_ID</code>{" "}
              จึงสามารถเลือกผู้ใช้ตัวอย่างหรือพิมพ์ชื่อเล่นเพื่อทดสอบลอยกระทงและโหวตได้ทันที
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-400/30 p-3 text-xs text-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleDevSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  ชื่อเล่น / ชื่อที่ใช้แสดง
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="เช่น น้องบัว, สมชาย..."
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                  disabled={status === "submitting"}
                />
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 py-3 text-sm font-bold text-slate-950 shadow-lg hover:brightness-105 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {status === "submitting" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                <span>เข้าสู่สายน้ำ</span>
              </button>
            </form>

            {devUsers.length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-2">
                  หรือเข้าใช้งานด่วนด้วยบัญชีตัวอย่าง:
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {devUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      disabled={status === "submitting"}
                      onClick={() => handleDevQuickLogin(u.id)}
                      className="w-full text-left rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-3 py-2 text-xs flex items-center justify-between transition"
                    >
                      <span className="font-medium text-slate-100">
                        {u.display_name}
                      </span>
                      <span className="text-[11px] text-amber-300">เข้าใช้งาน →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
