import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  setSessionCookie,
  verifyLineIdToken,
} from "@/lib/auth";
import { db } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      mode?: "line" | "dev";
      idToken?: string;
      devUserId?: string;
      display_name?: string;
    };

    const liffConfigured = Boolean(process.env.NEXT_PUBLIC_LIFF_ID?.trim());

    if (body.mode === "line") {
      if (!body.idToken) {
        return NextResponse.json(
          { error: "ไม่พบ LINE ID Token" },
          { status: 400 }
        );
      }

      const profile = await verifyLineIdToken(body.idToken);

      // ดึงชื่อและรูปโปรไฟล์จาก LINE มาใช้งานทันที ไม่ต้องกรอกชื่อ/แผนกซ้ำ
      const user = await db.upsertUser({
        line_user_id: profile.lineUserId,
        display_name: profile.displayName,
        full_name: profile.displayName,
        department: "ผู้ร่วมกิจกรรม",
        avatar_url: profile.avatarUrl,
      });

      await setSessionCookie(user.id);
      return NextResponse.json({ user });
    }

    // Dev / Demo Mode (เปิดใช้เฉพาะเมื่อยังไม่ได้ตั้งค่า LINE LIFF)
    if (liffConfigured) {
      return NextResponse.json(
        { error: "ระบบเปิดใช้งาน LINE LIFF แล้ว กรุณาเข้าสู่ระบบผ่าน LINE" },
        { status: 403 }
      );
    }

    if (body.devUserId) {
      const existing = await db.getUserById(body.devUserId);
      if (!existing) {
        return NextResponse.json(
          { error: "ไม่พบผู้ใช้ทดสอบนี้" },
          { status: 404 }
        );
      }
      await setSessionCookie(existing.id);
      return NextResponse.json({ user: existing });
    }

    const displayName = body.display_name?.trim();
    if (!displayName) {
      return NextResponse.json(
        { error: "กรุณาพิมพ์ชื่อเล่นหรือชื่อสำหรับแสดงบนกระทง" },
        { status: 400 }
      );
    }

    const slug = displayName.toLowerCase().replace(/\s+/g, "-");
    const user = await db.upsertUser({
      line_user_id: `dev-${slug}-${Date.now()}`,
      display_name: displayName,
      full_name: displayName,
      department: "ผู้ร่วมกิจกรรม",
      avatar_url: null,
    });
    await setSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (err) {
    console.error("POST /api/auth/session error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
