import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { MAX_WISH_LENGTH } from "@/lib/constants";
import { getEventPhase, isValidKrathongParts } from "@/lib/rules";
import { db } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนลอยกระทง" },
        { status: 401 }
      );
    }

    const phaseOverride = await db.getPhaseOverride();
    const phase = getEventPhase(new Date(), phaseOverride);
    if (!phase.canSubmitKrathong) {
      return NextResponse.json(
        { error: "หมดเวลาส่งกระทงแล้ว (ปิดรับวันที่ 24 พ.ย. เวลา 24:00 น.)" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      base_id?: string;
      flower_id?: string;
      candle_id?: string;
      decor_id?: string;
      aura_id?: string;
      wish_text?: string;
    };

    const parts = {
      base_id: body.base_id || "",
      flower_id: body.flower_id || "",
      candle_id: body.candle_id || "",
      decor_id: body.decor_id || "",
      aura_id: body.aura_id || "none",
    };

    if (!isValidKrathongParts(parts)) {
      return NextResponse.json(
        { error: "ชิ้นส่วนตกแต่งกระทงไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const wishText = (body.wish_text || "").trim();
    if (!wishText) {
      return NextResponse.json(
        { error: "กรุณาพิมพ์คำอธิษฐานหรือคำอวยพรก่อนลอยกระทง" },
        { status: 400 }
      );
    }
    if (wishText.length > MAX_WISH_LENGTH) {
      return NextResponse.json(
        { error: `คำอธิษฐานต้องไม่เกิน ${MAX_WISH_LENGTH} ตัวอักษร` },
        { status: 400 }
      );
    }

    const krathong = await db.upsertKrathong({
      user_id: userId,
      ...parts,
      wish_text: wishText,
    });

    return NextResponse.json({ krathong });
  } catch (err) {
    console.error("POST /api/krathongs error:", err);
    return NextResponse.json(
      { error: "บันทึกกระทงไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
