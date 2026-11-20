"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Circle,
  Gift,
  HelpCircle,
  Leaf,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import {
  ECO_QUIZ_QUESTIONS,
  KRATHONG_AURAS,
  KRATHONG_BASES,
  KRATHONG_CANDLES,
  KRATHONG_DECORS,
  KRATHONG_FLOWERS,
  MAX_WISH_LENGTH,
} from "@/lib/constants";
import type {
  EventPhaseInfo,
  MissionStatus,
  PublicKrathongView,
} from "@/lib/types";
import { KrathongArt } from "./KrathongArt";

interface MissionsAndBuilderProps {
  phase: EventPhaseInfo;
  isLoggedIn: boolean;
  missionStatus: MissionStatus | null;
  myKrathong: PublicKrathongView | null;
  onRequireLogin: () => void;
  onRefreshState: () => Promise<void>;
  onGoToRiver: () => void;
}

export function MissionsAndBuilder({
  phase,
  isLoggedIn,
  missionStatus,
  myKrathong,
  onRequireLogin,
  onRefreshState,
  onGoToRiver,
}: MissionsAndBuilderProps) {
  const [section, setSection] = useState<"builder" | "quiz">("builder");

  // Krathong Builder state
  const [baseId, setBaseId] = useState(myKrathong?.base_id || KRATHONG_BASES[0].id);
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
  const [savingKrathong, setSavingKrathong] = useState(false);
  const [krathongFeedback, setKrathongFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Eco Quiz Stepper state (ทีละ 1 ข้อ + เฉลยทันที)
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    ECO_QUIZ_QUESTIONS.map(() => null)
  );
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  async function handleSaveKrathong(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    setKrathongFeedback(null);
    setSavingKrathong(true);
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
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      setKrathongFeedback({
        type: "ok",
        text: myKrathong
          ? "อัปเดตกระทงและคำอธิษฐานเรียบร้อยแล้ว!"
          : "ปล่อยกระทงลงแม่น้ำสำเร็จแล้ว! ลุยภารกิจต่อไปได้เลย",
      });
      await onRefreshState();
    } catch (err) {
      setKrathongFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
      });
    } finally {
      setSavingKrathong(false);
    }
  }

  async function handleCompleteQuiz() {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    if (answers.some((a) => a === null)) {
      setQuizError("กรุณาตอบคำถามให้ครบทุกข้อก่อนครับ");
      return;
    }
    setQuizError(null);
    setSubmittingQuiz(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ตรวจคำตอบไม่สำเร็จ");
      if (data.passed) {
        confetti({ particleCount: 80, spread: 85, origin: { y: 0.65 } });
        await onRefreshState();
      } else {
        setQuizError("ยังมีบางข้อที่ไม่ถูกต้อง กรุณาย้อนตรวจสอบอีกครั้งครับ");
      }
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmittingQuiz(false);
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
      {/* 3-Step Mission Progress Card */}
      <div className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-[#0e2047] to-[#08142e] p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-300" />
            <h2 className="text-sm font-bold text-white">
              ภารกิจรับสิทธิ์จับฉลาก Lucky Draw
            </h2>
          </div>
          {missionStatus?.is_lucky_draw_eligible && (
            <span className="rounded-full bg-emerald-400/20 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
              ได้สิทธิ์แล้ว ✓
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <button
            type="button"
            onClick={() => setSection("builder")}
            className={`rounded-2xl p-2.5 border text-xs transition ${
              missionStatus?.has_krathong
                ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-100"
                : "bg-slate-900/70 border-slate-800 text-slate-300"
            }`}
          >
            <div className="flex justify-center mb-1">
              {missionStatus?.has_krathong ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <p className="font-semibold">1. ลอยกระทง</p>
            <p className="text-[10px] opacity-80">
              {missionStatus?.has_krathong ? "สำเร็จแล้ว" : "ยังไม่ส่ง"}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSection("quiz")}
            className={`rounded-2xl p-2.5 border text-xs transition ${
              missionStatus?.quiz_passed
                ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-100"
                : "bg-slate-900/70 border-slate-800 text-slate-300"
            }`}
          >
            <div className="flex justify-center mb-1">
              {missionStatus?.quiz_passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <p className="font-semibold">2. ควิซรักษ์โลก</p>
            <p className="text-[10px] opacity-80">
              {missionStatus?.quiz_passed ? "ผ่าน 5/5 ข้อ" : "ทำซ้ำได้"}
            </p>
          </button>

          <button
            type="button"
            onClick={onGoToRiver}
            className={`rounded-2xl p-2.5 border text-xs transition ${
              missionStatus?.votes_completed
                ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-100"
                : "bg-slate-900/70 border-slate-800 text-slate-300"
            }`}
          >
            <div className="flex justify-center mb-1">
              {missionStatus?.votes_completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <p className="font-semibold">3. โหวตเพื่อน</p>
            <p className="text-[10px] opacity-80">
              {missionStatus?.votes_cast ?? 0}/{missionStatus?.votes_required ?? 3} โหวต
            </p>
          </button>
        </div>
      </div>

      {/* Section Switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800">
        <button
          onClick={() => setSection("builder")}
          className={`rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            section === "builder"
              ? "bg-amber-400 text-slate-950"
              : "text-slate-300 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          ตกแต่งกระทง
        </button>
        <button
          onClick={() => setSection("quiz")}
          className={`rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            section === "quiz"
              ? "bg-emerald-400 text-slate-950"
              : "text-slate-300 hover:text-white"
          }`}
        >
          <Leaf className="w-4 h-4" />
          ควิซรักษ์สิ่งแวดล้อม
        </button>
      </div>

      {section === "builder" ? (
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
              ตัวอย่างกระทงของคุณ (โหวตแบบไม่แสดงชื่อเจ้าของจนกว่าจะประกาศผล)
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
                คำอธิษฐาน / คำอวยพรโดนใจ (ใช้ประกวดด้วย!)
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
              placeholder="พิมพ์คำอธิษฐาน คำอวยพรองค์กร หรือมุกน่ารักๆ ให้เพื่อนกดโหวต..."
              className="w-full rounded-2xl bg-slate-900/90 border border-slate-700 p-3.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none disabled:opacity-60"
            />
          </div>

          {krathongFeedback && (
            <div
              className={`rounded-2xl p-3 text-xs border ${
                krathongFeedback.type === "ok"
                  ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-200"
                  : "bg-rose-500/15 border-rose-400/30 text-rose-200"
              }`}
            >
              {krathongFeedback.text}
            </div>
          )}

          {!phase.canSubmitKrathong ? (
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 py-3 text-center text-xs text-slate-400">
              ปิดรับส่งกระทงแล้ว (หมดเขต 24 พ.ย. เวลา 24:00 น.)
            </div>
          ) : (
            <button
              type="submit"
              disabled={savingKrathong}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 py-3.5 text-sm font-bold text-slate-950 shadow-lg hover:brightness-105 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {savingKrathong ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {myKrathong ? "บันทึกการแก้ไขกระทง" : "ปล่อยกระทงลงแม่น้ำ!"}
            </button>
          )}
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3.5 text-xs text-emerald-100 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                ตอบถูกครบทั้ง {ECO_QUIZ_QUESTIONS.length} ข้อเพื่อผ่านภารกิจ
              </p>
              <p className="text-emerald-200/80 mt-0.5">
                ค่อยๆ ตอบทีละข้อ รู้ผลพร้อมเฉลยทันที หากผิดสามารถเลือกใหม่ได้เลย
              </p>
            </div>
          </div>

          {missionStatus?.quiz_passed && (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/20 p-3.5 text-xs text-emerald-100 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              คุณผ่านภารกิจควิซรักษ์สิ่งแวดล้อมครบ {ECO_QUIZ_QUESTIONS.length}/{ECO_QUIZ_QUESTIONS.length} ข้อแล้ว!
            </div>
          )}

          {/* Progress Steps Indicator */}
          {(() => {
            const currentQ = ECO_QUIZ_QUESTIONS[quizStep];
            const selectedIdx = answers[quizStep];
            const isCorrect = selectedIdx === currentQ.correctIndex;
            const isLast = quizStep === ECO_QUIZ_QUESTIONS.length - 1;

            return (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-300">
                    ข้อที่ {quizStep + 1} จาก {ECO_QUIZ_QUESTIONS.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {ECO_QUIZ_QUESTIONS.map((qItem, idx) => {
                      const done = answers[idx] === qItem.correctIndex;
                      const active = idx === quizStep;
                      return (
                        <button
                          key={qItem.id}
                          type="button"
                          onClick={() => setQuizStep(idx)}
                          className={`h-2.5 rounded-full transition-all ${
                            active
                              ? "w-7 bg-amber-400"
                              : done
                              ? "w-2.5 bg-emerald-400"
                              : "w-2.5 bg-slate-700"
                          }`}
                          aria-label={`ไปยังข้อที่ ${idx + 1}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <p className="text-sm font-semibold text-white leading-relaxed">
                  {quizStep + 1}. {currentQ.question}
                </p>

                <div className="space-y-2">
                  {currentQ.options.map((opt, optIdx) => {
                    const selected = selectedIdx === optIdx;
                    const showRight = selected && isCorrect;
                    const showWrong = selected && !isCorrect;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={!phase.canTakeQuiz}
                        onClick={() => {
                          setQuizError(null);
                          setAnswers((prev) => {
                            const next = [...prev];
                            next[quizStep] = optIdx;
                            return next;
                          });
                        }}
                        className={`w-full text-left rounded-2xl px-3.5 py-3 text-xs border transition ${
                          showRight
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-100 font-semibold"
                            : showWrong
                            ? "bg-rose-500/20 border-rose-400 text-rose-100 font-medium"
                            : "bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedIdx !== null && (
                  <div
                    className={`rounded-2xl p-3 text-xs leading-relaxed border ${
                      isCorrect
                        ? "bg-emerald-500/15 border-emerald-400/35 text-emerald-200"
                        : "bg-rose-500/15 border-rose-400/35 text-rose-200"
                    }`}
                  >
                    <p className="font-bold">
                      {isCorrect
                        ? "✓ ถูกต้องครับ!"
                        : "✗ ยังไม่ถูก ลองเลือกคำตอบอื่นดูนะครับ"}
                    </p>
                    {isCorrect && (
                      <p className="mt-1 opacity-90">{currentQ.explanation}</p>
                    )}
                  </div>
                )}

                {quizError && (
                  <div className="rounded-2xl bg-rose-500/15 border border-rose-400/30 p-3 text-xs text-rose-200">
                    {quizError}
                  </div>
                )}

                {!phase.canTakeQuiz ? (
                  <div className="rounded-2xl bg-slate-900/70 border border-slate-800 py-3 text-center text-xs text-slate-400">
                    ปิดรับคำตอบควิซแล้ว
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    {quizStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuizStep((s) => Math.max(0, s - 1))}
                        className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs font-semibold text-slate-200"
                      >
                        ← ข้อก่อนหน้า
                      </button>
                    )}

                    {!isLast ? (
                      <button
                        type="button"
                        disabled={!isCorrect}
                        onClick={() => setQuizStep((s) => s + 1)}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg disabled:opacity-40 transition"
                      >
                        {isCorrect ? "ข้อถัดไป →" : "ตอบให้ถูกก่อนเพื่อไปข้อถัดไป"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!isCorrect || submittingQuiz}
                        onClick={handleCompleteQuiz}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg disabled:opacity-40 flex items-center justify-center gap-2 transition"
                      >
                        {submittingQuiz && <Loader2 className="w-4 h-4 animate-spin" />}
                        {missionStatus?.quiz_passed
                          ? "บันทึกผลควิซสำเร็จ ✓"
                          : "ยืนยันผ่านภารกิจควิซ 🎉"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
