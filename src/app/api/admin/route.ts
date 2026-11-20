import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/auth";
import {
  canAssignJudgePick,
  computeMissionStatus,
  getEventPhase,
  rankKrathongs,
} from "@/lib/rules";
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
  const [users, krathongs, votes, prizes, phaseOverride] = await Promise.all([
    db.getAllUsers(),
    db.getAllKrathongs(),
    db.getAllVotes(),
    db.getAllPrizes(),
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
              full_name: owner.full_name,
              department: owner.department,
              avatar_url: owner.avatar_url,
            }
          : null,
      };
    });

  const usersWithMissions = users.map((u) => ({
    ...u,
    missionStatus: computeMissionStatus(u, krathongs, votes),
  }));

  const alreadyWonUserIds = new Set(
    prizes.map((p) => p.winner_user_id).filter((id): id is string => Boolean(id))
  );

  const eligiblePool = usersWithMissions.filter(
    (u) =>
      u.missionStatus.is_lucky_draw_eligible && !alreadyWonUserIds.has(u.id)
  );

  const enrichedPrizes = prizes.map((p) => {
    const winner = p.winner_user_id ? userById.get(p.winner_user_id) : null;
    return {
      ...p,
      winner: winner
        ? {
            id: winner.id,
            full_name: winner.full_name,
            department: winner.department,
            avatar_url: winner.avatar_url,
          }
        : null,
    };
  });

  return {
    storageMode: getStorageMode(),
    phase,
    users: usersWithMissions,
    krathongs: adminKrathongs,
    prizes: enrichedPrizes,
    eligiblePool: eligiblePool.map((u) => ({
      id: u.id,
      full_name: u.full_name,
      department: u.department,
      avatar_url: u.avatar_url,
    })),
    summary: {
      totalUsers: users.length,
      totalKrathongs: krathongs.filter((k) => !k.is_hidden).length,
      totalVotes: votes.length,
      totalEligibleAll: usersWithMissions.filter(
        (u) => u.missionStatus.is_lucky_draw_eligible
      ).length,
      remainingPoolCount: eligiblePool.length,
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
      awardLabel?: string;
      title?: string;
      prizeId?: string;
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
          ...(body.is_hidden ? { is_judge_pick: false, judge_award_label: null } : {}),
        });
        return NextResponse.json(await buildAdminPayload());
      }

      case "toggle_judge_pick": {
        if (!body.krathongId) {
          return NextResponse.json({ error: "ไม่พบ krathongId" }, { status: 400 });
        }
        const [krathongs, votes] = await Promise.all([
          db.getAllKrathongs(),
          db.getAllVotes(),
        ]);
        const target = krathongs.find((k) => k.id === body.krathongId);
        if (!target) {
          return NextResponse.json({ error: "ไม่พบกระทงนี้" }, { status: 404 });
        }

        if (target.is_judge_pick) {
          await db.updateKrathongAdmin(body.krathongId, {
            is_judge_pick: false,
            judge_award_label: null,
          });
        } else {
          const check = canAssignJudgePick({
            krathongId: body.krathongId,
            krathongs,
            votes,
          });
          if (!check.ok) {
            return NextResponse.json({ error: check.error }, { status: 400 });
          }
          await db.updateKrathongAdmin(body.krathongId, {
            is_judge_pick: true,
            judge_award_label:
              body.awardLabel?.trim() || "รางวัลโดนใจกรรมการ (ชมเชย)",
          });
        }
        return NextResponse.json(await buildAdminPayload());
      }

      case "add_prize": {
        const title = body.title?.trim();
        if (!title) {
          return NextResponse.json(
            { error: "กรุณาระบุชื่อของรางวัล" },
            { status: 400 }
          );
        }
        await db.createPrize(title);
        return NextResponse.json(await buildAdminPayload());
      }

      case "delete_prize": {
        if (!body.prizeId) {
          return NextResponse.json({ error: "ไม่พบ prizeId" }, { status: 400 });
        }
        await db.deletePrize(body.prizeId);
        return NextResponse.json(await buildAdminPayload());
      }

      case "draw_lucky_winner": {
        if (!body.prizeId) {
          return NextResponse.json({ error: "ไม่พบ prizeId" }, { status: 400 });
        }
        const [users, krathongs, votes, prizes] = await Promise.all([
          db.getAllUsers(),
          db.getAllKrathongs(),
          db.getAllVotes(),
          db.getAllPrizes(),
        ]);

        const prize = prizes.find((p) => p.id === body.prizeId);
        if (!prize) {
          return NextResponse.json({ error: "ไม่พบรางวัลนี้" }, { status: 404 });
        }

        const alreadyWonIds = new Set(
          prizes
            .filter((p) => p.id !== prize.id && p.winner_user_id)
            .map((p) => p.winner_user_id!)
        );

        const eligible = users.filter(
          (u) =>
            computeMissionStatus(u, krathongs, votes).is_lucky_draw_eligible &&
            !alreadyWonIds.has(u.id)
        );

        if (eligible.length === 0) {
          return NextResponse.json(
            {
              error:
                "ไม่มีรายชื่อผู้ทำภารกิจครบที่เหลืออยู่ในกล่องสุ่มแล้ว",
            },
            { status: 400 }
          );
        }

        const winnerIndex = crypto.randomInt(0, eligible.length);
        const winner = eligible[winnerIndex];
        await db.setPrizeWinner(prize.id, winner.id);

        return NextResponse.json({
          drawnWinner: {
            id: winner.id,
            full_name: winner.full_name,
            department: winner.department,
            avatar_url: winner.avatar_url,
          },
          prizeId: prize.id,
          adminState: await buildAdminPayload(),
        });
      }

      case "clear_prize_winner": {
        if (!body.prizeId) {
          return NextResponse.json({ error: "ไม่พบ prizeId" }, { status: 400 });
        }
        await db.setPrizeWinner(body.prizeId, null);
        return NextResponse.json(await buildAdminPayload());
      }

      case "set_phase_override": {
        const valid: PhaseOverride[] = [
          "auto",
          "open",
          "locked_voting",
          "closed",
          "revealed",
        ];
        if (!body.override || !valid.includes(body.override)) {
          return NextResponse.json(
            { error: "ค่าสถานะเวลาไม่ถูกต้อง" },
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
