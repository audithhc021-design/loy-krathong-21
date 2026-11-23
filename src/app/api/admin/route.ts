import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/auth";
import { getEventPhase, rankKrathongs } from "@/lib/rules";
import { db, getStorageMode } from "@/lib/store";
import type { PhaseOverride } from "@/lib/types";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { error: "รหัสผ่านแอดมินไม่ถูกต้อง" },
    { status: 401 }
  );
}

async function buildAdminPayload() {
  const [users, krathongs, votes, phaseOverride] = await Promise.all([
    db.getAllUsers(),
    db.getAllKrathongs(),
    db.getAllVotes(),
    db.getPhaseOverride(),
  ]);

  const phase = getEventPhase(new Date(), phaseOverride);
  const userById = new Map(users.map((u) => [u.id, u]));

  const ranked = rankKrathongs(krathongs, votes);
  const rankMap = new Map(ranked.map((r) => [r.krathong.id, r]));

  const voteCountMap = new Map<string, number>();
  for (const v of votes) {
    voteCountMap.set(v.krathong_id, (voteCountMap.get(v.krathong_id) ?? 0) + 1);
  }

  const adminKrathongs = [...krathongs]
    .sort((a, b) => {
      const ra = rankMap.get(a.id)?.rank ?? 9999;
      const rb = rankMap.get(b.id)?.rank ?? 9999;
      return ra - rb;
    })
    .map((k) => {
      const owner = userById.get(k.user_id);
      return {
        ...k,
        vote_count: voteCountMap.get(k.id) ?? 0,
        rank: rankMap.get(k.id)?.rank ?? null,
        author: owner
          ? {
              id: owner.id,
              display_name: owner.display_name || owner.full_name,
              avatar_url: owner.avatar_url,
            }
          : null,
      };
    });

  return {
    storageMode: getStorageMode(),
    phase,
    krathongs: adminKrathongs,
    summary: {
      totalUsers: users.length,
      totalKrathongs: krathongs.filter((k) => !k.is_hidden).length,
      hiddenKrathongs: krathongs.filter((k) => k.is_hidden).length,
      totalVotes: votes.length,
      quizPassedCount: users.filter((u) => u.quiz_passed).length,
    },
  };
}

export async function GET(req: Request) {
  if (!verifyAdminPassword(req.headers.get("x-admin-password"))) {
    return unauthorized();
  }
  try {
    return NextResponse.json(await buildAdminPayload());
  } catch (err) {
    console.error("GET /api/admin error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลแอดมินได้" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!verifyAdminPassword(req.headers.get("x-admin-password"))) {
    return unauthorized();
  }

  try {
    const body = (await req.json()) as {
      action?: string;
      krathongId?: string;
      is_hidden?: boolean;
      override?: PhaseOverride;
    };

    switch (body.action) {
      case "verify": {
        return NextResponse.json({ ok: true });
      }

      case "toggle_hidden": {
        if (!body.krathongId || typeof body.is_hidden !== "boolean") {
          return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
        }
        await db.updateKrathongAdmin(body.krathongId, {
          is_hidden: body.is_hidden,
        });
        return NextResponse.json(await buildAdminPayload());
      }

      case "set_phase_override": {
        const valid: PhaseOverride[] = ["auto", "open", "closed"];
        if (!body.override || !valid.includes(body.override)) {
          return NextResponse.json(
            { error: "ค่าสถานะระบบไม่ถูกต้อง" },
            { status: 400 }
          );
        }
        await db.setPhaseOverride(body.override);
        return NextResponse.json(await buildAdminPayload());
      }

      default:
        return NextResponse.json({ error: "ไม่รู้จักคำสั่ง" }, { status: 400 });
    }
  } catch (err) {
    console.error("POST /api/admin error:", err);
    return NextResponse.json(
      { error: "ดำเนินการไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
