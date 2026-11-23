import {
  KRATHONG_AURAS,
  KRATHONG_BASES,
  KRATHONG_CANDLES,
  KRATHONG_DECORS,
  KRATHONG_FLOWERS,
  MAX_VOTES_PER_USER,
  QUIZ_BONUS_VOTES,
} from "./constants";
import type {
  EventPhaseInfo,
  KrathongRecord,
  PhaseOverride,
  PublicKrathongView,
  UserRecord,
  VoteQuotaStatus,
  VoteRecord,
} from "./types";

export function getEventPhase(
  now: Date = new Date(),
  override: PhaseOverride = "auto"
): EventPhaseInfo {
  const phase: "open" | "closed" = override === "closed" ? "closed" : "open";

  return {
    phase,
    override,
    canSubmitKrathong: phase === "open",
    canTakeQuiz: phase === "open",
    canVote: phase === "open",
    canChangeVote: phase === "open",
    isClosed: phase === "closed",
    isRevealed: true,
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

export function getMaxVotesForUser(quizPassed: boolean): number {
  return quizPassed
    ? MAX_VOTES_PER_USER + QUIZ_BONUS_VOTES
    : MAX_VOTES_PER_USER;
}

export function computeUserActivityStatus(
  user: UserRecord,
  krathongs: KrathongRecord[],
  votes: VoteRecord[]
): VoteQuotaStatus {
  const hasKrathong = krathongs.some(
    (k) => k.user_id === user.id && !k.is_hidden
  );
  const votesCast = votes.filter((v) => v.voter_user_id === user.id).length;

  return {
    has_krathong: hasKrathong,
    quiz_passed: user.quiz_passed,
    votes_cast: votesCast,
    votes_required: getMaxVotesForUser(user.quiz_passed),
  };
}

export interface RankedKrathong {
  krathong: KrathongRecord;
  voteCount: number;
  rank: number;
}

/**
 * จัดอันดับกระทงยอดนิยม: คะแนนโหวตมากที่สุดอยู่ด้านบน
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

export function buildPublicKrathongs(params: {
  krathongs: KrathongRecord[];
  votes: VoteRecord[];
  users: UserRecord[];
  currentUserId: string | null;
}): PublicKrathongView[] {
  const { krathongs, votes, users, currentUserId } = params;
  const userById = new Map(users.map((u) => [u.id, u]));
  const myVotedIds = new Set(
    currentUserId
      ? votes.filter((v) => v.voter_user_id === currentUserId).map((v) => v.krathong_id)
      : []
  );

  const ranked = rankKrathongs(krathongs, votes);

  return ranked.map(({ krathong, voteCount, rank }) => {
    const owner = userById.get(krathong.user_id);

    return {
      id: krathong.id,
      serial_no: krathong.serial_no,
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
      created_at: krathong.created_at,
      author: {
        display_name:
          owner?.display_name || owner?.full_name || "ผู้ร่วมลอยกระทง",
        avatar_url: owner?.avatar_url ?? null,
      },
    };
  });
}

export function validateVoteAction(params: {
  action: "cast" | "unvote";
  voterId: string;
  voterQuizPassed?: boolean;
  targetKrathong: KrathongRecord | undefined;
  existingVotes: VoteRecord[];
  phase: EventPhaseInfo;
}): { ok: true } | { ok: false; error: string; status: number } {
  const {
    action,
    voterId,
    voterQuizPassed = false,
    targetKrathong,
    existingVotes,
    phase,
  } = params;

  if (!phase.canVote) {
    return {
      ok: false,
      error: "ระบบปิดรับการโหวตชั่วคราว",
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
    if (!alreadyVoted) {
      return { ok: false, error: "คุณยังไม่ได้โหวตกระทงนี้", status: 400 };
    }
    return { ok: true };
  }

  if (alreadyVoted) {
    return { ok: false, error: "คุณได้โหวตกระทงนี้ไปแล้ว", status: 400 };
  }

  const maxVotes = getMaxVotesForUser(voterQuizPassed);
  if (myVotes.length >= maxVotes) {
    return {
      ok: false,
      error: voterQuizPassed
        ? `ใช้สิทธิ์โหวตครบ ${maxVotes} กระทงแล้ว (กดยกเลิกโหวตเดิมก่อนจึงจะโหวตกระทงใหม่ได้)`
        : `ใช้สิทธิ์โหวตครบ ${maxVotes} กระทงแล้ว! ทำควิซรักษ์โลกเพื่อรับโบนัสเพิ่มอีก ${QUIZ_BONUS_VOTES} โหวต (รวม 5 โหวต)`,
      status: 400,
    };
  }

  return { ok: true };
}
