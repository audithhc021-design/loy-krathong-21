import {
  EVENT_SCHEDULE,
  KRATHONG_AURAS,
  KRATHONG_BASES,
  KRATHONG_CANDLES,
  KRATHONG_DECORS,
  KRATHONG_FLOWERS,
  MAX_JUDGE_PICKS,
  MAX_VOTES_PER_USER,
} from "./constants";
import type {
  EventPhaseInfo,
  KrathongRecord,
  MissionStatus,
  PhaseOverride,
  PublicKrathongView,
  UserRecord,
  VoteRecord,
} from "./types";

export function getEventPhase(
  now: Date = new Date(),
  override: PhaseOverride = "auto"
): EventPhaseInfo {
  const cutoff = new Date(EVENT_SCHEDULE.VOTE_CHANGE_CUTOFF_ISO).getTime();
  const end = new Date(EVENT_SCHEDULE.SUBMISSION_AND_VOTE_END_ISO).getTime();
  const reveal = new Date(EVENT_SCHEDULE.RESULTS_REVEAL_ISO).getTime();
  const nowMs = now.getTime();

  let phase: Exclude<PhaseOverride, "auto">;
  if (override !== "auto") {
    phase = override;
  } else if (nowMs >= reveal) {
    phase = "revealed";
  } else if (nowMs >= end) {
    phase = "closed";
  } else if (nowMs >= cutoff) {
    phase = "locked_voting";
  } else {
    phase = "open";
  }

  return {
    phase,
    override,
    canSubmitKrathong: phase === "open" || phase === "locked_voting",
    canTakeQuiz: phase === "open" || phase === "locked_voting",
    canVote: phase === "open" || phase === "locked_voting",
    canChangeVote: phase === "open",
    isClosed: phase === "closed" || phase === "revealed",
    isRevealed: phase === "revealed",
    nowIso: now.toISOString(),
  };
}

export function isValidKrathongParts(parts: {
  base_id: string;
  flower_id: string;
  candle_id: string;
  decor_id: string;
  aura_id?: string;
}): boolean {
  const auraOk =
    !parts.aura_id || KRATHONG_AURAS.some((a) => a.id === parts.aura_id);
  return (
    KRATHONG_BASES.some((b) => b.id === parts.base_id) &&
    KRATHONG_FLOWERS.some((f) => f.id === parts.flower_id) &&
    KRATHONG_CANDLES.some((c) => c.id === parts.candle_id) &&
    KRATHONG_DECORS.some((d) => d.id === parts.decor_id) &&
    auraOk
  );
}

export function computeMissionStatus(
  user: UserRecord,
  krathongs: KrathongRecord[],
  votes: VoteRecord[]
): MissionStatus {
  const hasKrathong = krathongs.some(
    (k) => k.user_id === user.id && !k.is_hidden
  );
  const votesCast = votes.filter((v) => v.voter_user_id === user.id).length;
  const votesCompleted = votesCast >= MAX_VOTES_PER_USER;

  return {
    has_krathong: hasKrathong,
    quiz_passed: user.quiz_passed,
    votes_cast: votesCast,
    votes_required: MAX_VOTES_PER_USER,
    votes_completed: votesCompleted,
    is_lucky_draw_eligible: hasKrathong && user.quiz_passed && votesCompleted,
  };
}

export interface RankedKrathong {
  krathong: KrathongRecord;
  voteCount: number;
  rank: number;
}

/**
 * จัดอันดับกระทงที่เปิดเผยได้: คะแนนโหวตมากที่สุดชนะ
 * หากคะแนนเท่ากัน ผู้ที่ส่งกระทงก่อน (created_at น้อยกว่า) จะได้อันดับสูงกว่า
 */
export function rankKrathongs(
  krathongs: KrathongRecord[],
  votes: VoteRecord[]
): RankedKrathong[] {
  const voteCounts = new Map<string, number>();
  for (const v of votes) {
    voteCounts.set(v.krathong_id, (voteCounts.get(v.krathong_id) ?? 0) + 1);
  }

  const visible = krathongs.filter((k) => !k.is_hidden);
  visible.sort((a, b) => {
    const countDiff = (voteCounts.get(b.id) ?? 0) - (voteCounts.get(a.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    const timeDiff =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.serial_no - b.serial_no;
  });

  return visible.map((krathong, index) => ({
    krathong,
    voteCount: voteCounts.get(krathong.id) ?? 0,
    rank: index + 1,
  }));
}

/**
 * แปลงข้อมูลกระทงสำหรับส่งให้พนักงาน โดยซ่อนตัวตนเจ้าของกระทงทั้งหมดหากยังไม่ถึงเวลาประกาศผล (isRevealed === false)
 */
export function buildPublicKrathongs(params: {
  krathongs: KrathongRecord[];
  votes: VoteRecord[];
  users: UserRecord[];
  currentUserId: string | null;
  isRevealed: boolean;
}): PublicKrathongView[] {
  const { krathongs, votes, users, currentUserId, isRevealed } = params;
  const userById = new Map(users.map((u) => [u.id, u]));
  const myVotedIds = new Set(
    currentUserId
      ? votes.filter((v) => v.voter_user_id === currentUserId).map((v) => v.krathong_id)
      : []
  );

  const ranked = rankKrathongs(krathongs, votes);

  return ranked.map(({ krathong, voteCount, rank }) => {
    const owner = userById.get(krathong.user_id);
    const paddedCode = String(krathong.serial_no).padStart(3, "0");

    return {
      id: krathong.id,
      serial_no: krathong.serial_no,
      anonymous_code: `กระทง #${paddedCode}`,
      base_id: krathong.base_id,
      flower_id: krathong.flower_id,
      candle_id: krathong.candle_id,
      decor_id: krathong.decor_id,
      aura_id: krathong.aura_id || "none",
      wish_text: krathong.wish_text,
      vote_count: voteCount,
      rank,
      is_mine: currentUserId !== null && krathong.user_id === currentUserId,
      voted_by_me: myVotedIds.has(krathong.id),
      is_judge_pick: isRevealed ? krathong.is_judge_pick : false,
      judge_award_label: isRevealed ? krathong.judge_award_label : null,
      created_at: krathong.created_at,
      author:
        isRevealed && owner
          ? {
              full_name: owner.full_name,
              department: owner.department,
              avatar_url: owner.avatar_url,
            }
          : null,
    };
  });
}

export function validateVoteAction(params: {
  action: "cast" | "unvote";
  voterId: string;
  targetKrathong: KrathongRecord | undefined;
  existingVotes: VoteRecord[];
  phase: EventPhaseInfo;
}): { ok: true } | { ok: false; error: string; status: number } {
  const { action, voterId, targetKrathong, existingVotes, phase } = params;

  if (!phase.canVote) {
    return {
      ok: false,
      error: "หมดเวลาการโหวตแล้ว (ปิดโหวตวันที่ 24 พ.ย. เวลา 24:00 น.)",
      status: 403,
    };
  }

  if (!targetKrathong || targetKrathong.is_hidden) {
    return { ok: false, error: "ไม่พบกระทงที่ต้องการโหวต", status: 404 };
  }

  if (targetKrathong.user_id === voterId) {
    return {
      ok: false,
      error: "ไม่สามารถโหวตให้กระทงของตัวเองได้ครับ",
      status: 400,
    };
  }

  const myVotes = existingVotes.filter((v) => v.voter_user_id === voterId);
  const alreadyVoted = myVotes.some((v) => v.krathong_id === targetKrathong.id);

  if (action === "unvote") {
    if (!phase.canChangeVote) {
      return {
        ok: false,
        error: "หลังเวลา 16:00 น. วันที่ 24 พ.ย. ระบบล็อกโหวตที่กดไว้แล้ว ไม่สามารถเปลี่ยนใจได้",
        status: 403,
      };
    }
    if (!alreadyVoted) {
      return { ok: false, error: "คุณยังไม่ได้โหวตกระทงนี้", status: 400 };
    }
    return { ok: true };
  }

  if (alreadyVoted) {
    return { ok: false, error: "คุณได้โหวตกระทงนี้ไปแล้ว", status: 400 };
  }

  if (myVotes.length >= MAX_VOTES_PER_USER) {
    return {
      ok: false,
      error: phase.canChangeVote
        ? `ใช้สิทธิ์โหวตครบ ${MAX_VOTES_PER_USER} โหวตแล้ว (ยกเลิกโหวตเดิมก่อนจึงจะโหวตใหม่ได้)`
        : `ใช้สิทธิ์โหวตครบ ${MAX_VOTES_PER_USER} โหวตแล้ว และไม่สามารถเปลี่ยนใจได้หลัง 16:00 น.`,
      status: 400,
    };
  }

  return { ok: true };
}

export function canAssignJudgePick(params: {
  krathongId: string;
  krathongs: KrathongRecord[];
  votes: VoteRecord[];
}): { ok: true } | { ok: false; error: string } {
  const ranked = rankKrathongs(params.krathongs, params.votes);
  const target = ranked.find((r) => r.krathong.id === params.krathongId);

  if (!target) {
    return { ok: false, error: "ไม่พบกระทงนี้ในระบบ" };
  }
  if (target.rank <= 3) {
    return {
      ok: false,
      error: "กระทงนี้อยู่ในอันดับ 1–3 อยู่แล้ว ไม่สามารถซ้ำกับรางวัลโดนใจกรรมการได้",
    };
  }

  const currentJudgePicks = params.krathongs.filter(
    (k) => k.is_judge_pick && !k.is_hidden && k.id !== params.krathongId
  );
  if (currentJudgePicks.length >= MAX_JUDGE_PICKS) {
    return {
      ok: false,
      error: `เลือกรางวัลโดนใจกรรมการครบ ${MAX_JUDGE_PICKS} รางวัลแล้ว กรุณายกเลิกรางวัลเดิมก่อน`,
    };
  }

  return { ok: true };
}
