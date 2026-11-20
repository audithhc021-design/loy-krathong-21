import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import {
  buildPublicKrathongs,
  computeMissionStatus,
  getEventPhase,
} from "@/lib/rules";
import { db, getStorageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [sessionUserId, users, krathongs, votes, prizes, phaseOverride] =
      await Promise.all([
        getSessionUserId(),
        db.getAllUsers(),
        db.getAllKrathongs(),
        db.getAllVotes(),
        db.getAllPrizes(),
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
      isRevealed: phase.isRevealed,
    });

    const myKrathong =
      publicKrathongs.find((k) => k.is_mine) ?? null;

    const missionStatus = meUser
      ? computeMissionStatus(meUser, krathongs, votes)
      : null;

    const eligibleLuckyDrawCount = users.filter(
      (u) => computeMissionStatus(u, krathongs, votes).is_lucky_draw_eligible
    ).length;

    const userById = new Map(users.map((u) => [u.id, u]));

    const results = phase.isRevealed
      ? {
          top3: publicKrathongs.slice(0, 3),
          judgePicks: publicKrathongs.filter((k) => k.is_judge_pick),
          luckyDraw: prizes.map((p) => {
            const winner = p.winner_user_id
              ? userById.get(p.winner_user_id)
              : null;
            return {
              id: p.id,
              title: p.title,
              sort_order: p.sort_order,
              drawn_at: p.drawn_at,
              winner: winner
                ? {
                    full_name: winner.full_name,
                    department: winner.department,
                    avatar_url: winner.avatar_url,
                  }
                : null,
            };
          }),
        }
      : null;

    return NextResponse.json({
      storageMode,
      liffConfigured,
      phase,
      me: meUser
        ? {
            user: meUser,
            missionStatus,
            krathong: myKrathong,
          }
        : null,
      krathongs: publicKrathongs,
      results,
      stats: {
        totalParticipants: users.length,
        totalKrathongs: publicKrathongs.length,
        eligibleLuckyDrawCount,
      },
      devUsers:
        !liffConfigured
          ? users.map((u) => ({
              id: u.id,
              full_name: u.full_name,
              department: u.department,
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
