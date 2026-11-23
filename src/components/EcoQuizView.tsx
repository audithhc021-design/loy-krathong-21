"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, HelpCircle, Loader2 } from "lucide-react";
import { ECO_QUIZ_QUESTIONS } from "@/lib/constants";
import type { EventPhaseInfo, VoteQuotaStatus } from "@/lib/types";

interface EcoQuizViewProps {
  phase: EventPhaseInfo;
  isLoggedIn: boolean;
  activityStatus: VoteQuotaStatus | null;
  onRequireLogin: () => void;
  onRefreshState: () => Promise<void>;
}

export function EcoQuizView({
  phase,
  isLoggedIn,
  activityStatus,
  onRequireLogin,
  onRefreshState,
}: EcoQuizViewProps) {
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    ECO_QUIZ_QUESTIONS.map(() => null)
  );
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

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

  const currentQ = ECO_QUIZ_QUESTIONS[quizStep];
  const selectedIdx = answers[quizStep];
  const isCorrect = selectedIdx === currentQ.correctIndex;
  const isLast = quizStep === ECO_QUIZ_QUESTIONS.length - 1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3.5 text-xs text-emerald-100 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">
            แบบทดสอบความรู้ลอยกระทงรักษ์สิ่งแวดล้อม (เล่นหรือไม่เล่นก็ได้)
          </p>
          <p className="text-emerald-200/80 mt-0.5">
            ชวนมาลองทายความรู้รักษ์โลกทีละข้อ รู้ผลพร้อมคำอธิบายทันทีครับ
          </p>
        </div>
      </div>

      {activityStatus?.quiz_passed && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/20 p-3.5 text-xs text-emerald-100 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          เก่งมาก! คุณตอบคำถามรักษ์โลกครบ {ECO_QUIZ_QUESTIONS.length}/
          {ECO_QUIZ_QUESTIONS.length} ข้อแล้ว
        </div>
      )}

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
              {isCorrect ? "✓ ถูกต้องครับ!" : "✗ ยังไม่ถูก ลองเลือกคำตอบอื่นดูนะครับ"}
            </p>
            {isCorrect && <p className="mt-1 opacity-90">{currentQ.explanation}</p>}
          </div>
        )}

        {quizError && (
          <div className="rounded-2xl bg-rose-500/15 border border-rose-400/30 p-3 text-xs text-rose-200">
            {quizError}
          </div>
        )}

        {!phase.canTakeQuiz ? (
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 py-3 text-center text-xs text-slate-400">
            ปิดรับคำตอบควิซชั่วคราว
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
                {activityStatus?.quiz_passed
                  ? "ตอบควิซครบแล้ว ✓"
                  : "บันทึกผลตอบคำถาม 🎉"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
