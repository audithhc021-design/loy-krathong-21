import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getEventPhase, validateVoteAction } from "@/lib/rules";
import { db } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนโหวต" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      krathongId?: string;
      action?: "cast" | "unvote";
    };

    if (!body.krathongId || (body.action !== "cast" && body.action !== "unvote")) {
      return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 400 });
    }

    const [voter, krathongs, votes, phaseOverride] = await Promise.all([
      db.getUserById(userId),
      db.getAllKrathongs(),
      db.getAllVotes(),
      db.getPhaseOverride(),
    ]);

    const phase = getEventPhase(new Date(), phaseOverride);
    const targetKrathong = krathongs.find((k) => k.id === body.krathongId);

    const check = validateVoteAction({
      action: body.action,
      voterId: userId,
      voterQuizPassed: Boolean(voter?.quiz_passed),
      targetKrathong,
      existingVotes: votes,
      phase,
    });

    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    if (body.action === "cast") {
      await db.castVote(userId, body.krathongId);
    } else {
      await db.removeVote(userId, body.krathongId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/votes error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถดำเนินการโหวตได้" },
      { status: 500 }
    );
  }
}
