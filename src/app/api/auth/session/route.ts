import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  setSessionCookie,
  verifyLineIdToken,
} from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/constants";
import { db } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      mode?: "line" | "dev";
      idToken?: string;
      devUserId?: string;
      full_name?: string;
      department?: string;
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
      const existing = await db.getUserByLineId(profile.lineUserId);

      if (!existing && (!body.full_name?.trim() || !body.department?.trim())) {
        return NextResponse.json({
          needsOnboarding: true,
          lineProfile: {
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
          },
        });
      }

      const user = await db.upsertUser({
        line_user_id: profile.lineUserId,
        display_name: profile.displayName,
        full_name: body.full_name?.trim() || existing?.full_name || profile.displayName,
        department:
          body.department?.trim() || existing?.department || DEPARTMENTS[0],
        avatar_url: profile.avatarUrl,
      });

      await setSessionCookie(user.id);
      return NextResponse.json({ needsOnboarding: false, user });
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
      return NextResponse.json({ needsOnboarding: false, user: existing });
    }

    const fullName = body.full_name?.trim();
    const department = body.department?.trim();
    if (!fullName || !department) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ-นามสกุล และเลือกแผนก" },
        { status: 400 }
      );
    }

    const slug = fullName.toLowerCase().replace(/\s+/g, "-");
    const user = await db.upsertUser({
      line_user_id: `dev-${slug}-${Date.now()}`,
      display_name: fullName,
      full_name: fullName,
      department,
      avatar_url: null,
    });
    await setSessionCookie(user.id);
    return NextResponse.json({ needsOnboarding: false, user });
  } catch (err) {
    console.error("POST /api/auth/session error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
