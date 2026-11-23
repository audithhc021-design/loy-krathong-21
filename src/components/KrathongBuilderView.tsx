"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Leaf, Loader2, Send, Sparkles, Waves } from "lucide-react";
import {
  KRATHONG_AURAS,
  KRATHONG_BASES,
  KRATHONG_CANDLES,
  KRATHONG_DECORS,
  KRATHONG_FLOWERS,
  MAX_WISH_LENGTH,
} from "@/lib/constants";
import type { EventPhaseInfo, PublicKrathongView } from "@/lib/types";
import { KrathongArt } from "./KrathongArt";

interface KrathongBuilderViewProps {
  phase: EventPhaseInfo;
  isLoggedIn: boolean;
  myKrathong: PublicKrathongView | null;
  totalKrathongs: number;
  onRequireLogin: () => void;
  onRefreshState: () => Promise<void>;
  onGoToRiver: () => void;
  onGoToQuiz: () => void;
}

export function KrathongBuilderView({
  phase,
  isLoggedIn,
  myKrathong,
  totalKrathongs,
  onRequireLogin,
  onRefreshState,
  onGoToRiver,
  onGoToQuiz,
}: KrathongBuilderViewProps) {
  const [baseId, setBaseId] = useState(
    myKrathong?.base_id || KRATHONG_BASES[0].id
  );
  const [flowerId, setFlowerId] = useState(
    myKrathong?.flower_id || KRATHONG_FLOWERS[1].id
  );
  const [candleId, setCandleId] = useState(
    myKrathong?.candle_id || KRATHONG_CANDLES[0].id
  );
  const [decorId, setDecorId] = useState(
    myKrathong?.decor_id || KRATHONG_DECORS[0].id
  );
  const [auraId, setAuraId] = useState(
    myKrathong?.aura_id || KRATHONG_AURAS[1].id
  );
  const [wishText, setWishText] = useState(myKrathong?.wish_text || "");
  const [partTab, setPartTab] = useState<
    "base" | "flower" | "candle" | "decor" | "aura"
  >("base");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  async function handleSaveKrathong(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/krathongs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_id: baseId,
          flower_id: flowerId,
          candle_id: candleId,
          decor_id: decorId,
          aura_id: auraId,
          wish_text: wishText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกกระทงไม่สำเร็จ");
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.65 } });
      await onRefreshState();
      setShowThankYouModal(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  const partOptions =
    partTab === "base"
      ? KRATHONG_BASES
      : partTab === "flower"
      ? KRATHONG_FLOWERS
      : partTab === "candle"
      ? KRATHONG_CANDLES
      : partTab === "decor"
      ? KRATHONG_DECORS
      : KRATHONG_AURAS;

  const activePartValue =
    partTab === "base"
      ? baseId
      : partTab === "flower"
      ? flowerId
      : partTab === "candle"
      ? candleId
      : partTab === "decor"
      ? decorId
      : auraId;

  function setActivePartValue(id: string) {
    if (partTab === "base") setBaseId(id);
    else if (partTab === "flower") setFlowerId(id);
    else if (partTab === "candle") setCandleId(id);
    else if (partTab === "decor") setDecorId(id);
    else setAuraId(id);
  }

  function handleRandomizeParts() {
    setBaseId(KRATHONG_BASES[Math.floor(Math.random() * KRATHONG_BASES.length)].id);
    setFlowerId(
      KRATHONG_FLOWERS[Math.floor(Math.random() * KRATHONG_FLOWERS.length)].id
    );
    setCandleId(
      KRATHONG_CANDLES[Math.floor(Math.random() * KRATHONG_CANDLES.length)].id
    );
    setDecorId(
      KRATHONG_DECORS[Math.floor(Math.random() * KRATHONG_DECORS.length)].id
    );
    setAuraId(KRATHONG_AURAS[Math.floor(Math.random() * KRATHONG_AURAS.length)].id);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-100 flex items-center gap-2">
        <Leaf className="w-4 h-4 text-emerald-300 shrink-0" />
        <span>
          ตกแต่งกระทงออนไลน์ 1 คน / 1 กระทง (แก้ไขได้ตลอด) ช่วยลดขยะลงแม่น้ำได้จริง!
        </span>
      </div>

      <form onSubmit={handleSaveKrathong} className="space-y-4">
        {/* Live Preview */}
        <div className="river-scene relative rounded-3xl border border-sky-400/20 bg-gradient-to-b from-[#091633] via-[#0c274f] to-[#081d3a] py-5 px-4 text-center space-y-2">
          <button
            type="button"
            onClick={handleRandomizeParts}
            className="absolute right-3 top-3 rounded-xl bg-slate-900/80 border border-amber-400/30 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-slate-800"
          >
            🎲 สุ่มแต่งสวย
          </button>
          <KrathongArt
            baseId={baseId}
            flowerId={flowerId}
            candleId={candleId}
            decorId={decorId}
            auraId={auraId}
            size="lg"
          />
          <p className="text-[11px] text-sky-200/80">
            ตัวอย่างกระทงของคุณก่อนปล่อยลงสู่สายน้ำ
          </p>
        </div>

        {/* Part Category Tabs */}
        <div className="grid grid-cols-5 gap-1">
          {(
            [
              { id: "base", label: "ฐาน" },
              { id: "flower", label: "ดอกไม้" },
              { id: "candle", label: "เทียน" },
              { id: "decor", label: "ของแต่ง" },
              { id: "aura", label: "ออร่า" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPartTab(t.id)}
              className={`rounded-xl py-2 text-xs font-semibold border transition ${
                partTab === t.id
                  ? "bg-amber-400/20 border-amber-400 text-amber-200"
                  : "bg-slate-900/70 border-slate-800 text-slate-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-2">
          {partOptions.map((opt) => {
            const selected = activePartValue === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActivePartValue(opt.id)}
                className={`rounded-2xl p-3 text-left border transition ${
                  selected
                    ? "bg-amber-400/15 border-amber-400 text-white"
                    : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold">{opt.name}</span>
                  {opt.badge && (
                    <span className="rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[9px] text-emerald-200">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Wish Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-amber-200">
              คำอธิษฐาน / คำอวยพรวันลอยกระทง
            </label>
            <span className="text-[11px] text-slate-400">
              {wishText.length}/{MAX_WISH_LENGTH}
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={MAX_WISH_LENGTH}
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            disabled={!phase.canSubmitKrathong}
            placeholder="พิมพ์คำอธิษฐาน คำอวยพร หรือข้อความดีๆ ที่อยากฝากลงสายน้ำ..."
            className="w-full rounded-2xl bg-slate-900/90 border border-slate-700 p-3.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none disabled:opacity-60"
          />
        </div>

        {errorMsg && (
          <div className="rounded-2xl p-3 text-xs border bg-rose-500/15 border-rose-400/30 text-rose-200">
            {errorMsg}
          </div>
        )}

        {!phase.canSubmitKrathong ? (
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 py-3 text-center text-xs text-slate-400">
            ปิดรับส่งกระทงชั่วคราว
          </div>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 py-3.5 text-sm font-bold text-slate-950 shadow-lg hover:brightness-105 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {myKrathong ? "บันทึกการแก้ไขกระทง" : "ลอยกระทงลงแม่น้ำ!"}
          </button>
        )}
      </form>

      {/* Eco Appreciation Modal after Floating Krathong */}
      {showThankYouModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
          onClick={() => setShowThankYouModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-emerald-400/35 bg-gradient-to-b from-[#0b2342] to-[#071426] p-6 text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Leaf className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-0.5 text-[11px] font-bold text-amber-200">
                <Sparkles className="w-3.5 h-3.5" />
                ปล่อยกระทงลงสายน้ำสำเร็จ!
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                ขอขอบคุณที่เป็นส่วนหนึ่งในการช่วยลดขยะและมลพิษทางน้ำ 🌿💧
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                การลอยกระทงออนไลน์ครั้งนี้ช่วยรักษาความสะอาดของแม่น้ำลำคลองร่วมกับผู้เข้าร่วมทั้งหมด{" "}
                <strong className="text-emerald-300">{totalKrathongs}</strong>{" "}
                กระทงแล้วครับ
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowThankYouModal(false);
                  onGoToRiver();
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 py-3 text-sm font-bold text-slate-950 flex items-center justify-center gap-2"
              >
                <Waves className="w-4 h-4" />
                ไปชมกระทงบนแม่น้ำ & โหวตเพื่อนๆ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowThankYouModal(false);
                  onGoToQuiz();
                }}
                className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/15 py-2.5 text-xs font-semibold text-emerald-200"
              >
                ลองเล่นควิซความรู้รักษ์สิ่งแวดล้อม →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
