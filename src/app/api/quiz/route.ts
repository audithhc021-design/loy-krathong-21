import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { ECO_QUIZ_QUESTIONS } from "@/lib/constants";
import { getEventPhase } from "@/lib/rules";
import { db } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำแบบทดสอบ" },
        { status: 401 }
      );
    }

    const phaseOverride = await db.getPhaseOverride();
    const phase = getEventPhase(new Date(), phaseOverride);
    if (!phase.canTakeQuiz) {
      return NextResponse.json(
        { error: "หมดเวลาทำภารกิจแล้ว (ปิดรับวันที่ 24 พ.ย. เวลา 24:00 น.)" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { answers?: number[] };
    const answers = body.answers;
    if (
      !Array.isArray(answers) ||
      answers.length !== ECO_QUIZ_QUESTIONS.length
    ) {
      return NextResponse.json(
        { error: "กรุณาตอบคำถามให้ครบทุกข้อ" },
        { status: 400 }
      );
    }

    let score = 0;
    const results = ECO_QUIZ_QUESTIONS.map((q, idx) => {
      const selected = answers[idx];
      const correct = selected === q.correctIndex;
      if (correct) score++;
      return {
        id: q.id,
        correct,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      };
    });

    const passed = score === ECO_QUIZ_QUESTIONS.length;
    if (passed) {
      await db.markQuizPassed(userId);
    }

    return NextResponse.json({
      passed,
      score,
      total: ECO_QUIZ_QUESTIONS.length,
      results,
    });
  } catch (err) {
    console.error("POST /api/quiz error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถตรวจคำตอบได้" },
      { status: 500 }
    );
  }
}
