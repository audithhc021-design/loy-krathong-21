import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import {
  buildPublicKrathongs,
  computeUserActivityStatus,
  getEventPhase,
} from "@/lib/rules";
import { db, getStorageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [sessionUserId, users, krathongs, votes, phaseOverride] =
      await Promise.all([
        getSessionUserId(),
        db.getAllUsers(),
        db.getAllKrathongs(),
        db.getAllVotes(),
        db.getPhaseOverride(),
      ]);

    const phase = getEventPhase(new Date(), phaseOverride);
    const storageMode = getStorageMode();
    const liffConfigured = Boolean(process.env.NEXT_PUBLIC_LIFF_ID?.trim());

    const meUser = sessionUserId
      ? users.find((u) => u.id === sessionUserId) ?? null
      : null;

    const publicKrathongs = buildPublicKrathongs({
      krathongs,
      votes,
      users,
      currentUserId: meUser?.id ?? null,
    });

    const myKrathong = publicKrathongs.find((k) => k.is_mine) ?? null;

    const activityStatus = meUser
      ? computeUserActivityStatus(meUser, krathongs, votes)
      : null;

    return NextResponse.json({
      storageMode,
      liffConfigured,
      phase,
      me: meUser
        ? {
            user: meUser,
            activityStatus,
            krathong: myKrathong,
          }
        : null,
      krathongs: publicKrathongs,
      stats: {
        totalParticipants: users.length,
        totalKrathongs: publicKrathongs.length,
        totalVotes: votes.length,
      },
      devUsers: !liffConfigured
        ? users.map((u) => ({
            id: u.id,
            display_name: u.display_name || u.full_name,
          }))
        : [],
    });
  } catch (err) {
    console.error("GET /api/state error:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : "Unknown server error";
    return NextResponse.json(
      {
        error: "ไม่สามารถโหลดข้อมูลระบบได้",
        detail: message,
        hint: {
          storageMode: getStorageMode(),
          hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
          hasSupabaseServiceKey: Boolean(
            process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
          ),
          hasLiffId: Boolean(process.env.NEXT_PUBLIC_LIFF_ID?.trim()),
        },
      },
      { status: 500 }
    );
  }
}
