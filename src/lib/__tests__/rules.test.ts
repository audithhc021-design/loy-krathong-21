import { describe, expect, it } from "vitest";
import {
  buildPublicKrathongs,
  computeUserActivityStatus,
  getEventPhase,
  isValidKrathongParts,
  rankKrathongs,
  validateVoteAction,
} from "../rules";
import type { KrathongRecord, UserRecord, VoteRecord } from "../types";

const makeUser = (id: string, quizPassed = false): UserRecord => ({
  id,
  line_user_id: `line-${id}`,
  display_name: `ผู้ใช้ ${id}`,
  full_name: `ผู้ใช้ ${id}`,
  department: "ผู้ร่วมกิจกรรม",
  avatar_url: `https://example.com/avatar-${id}.jpg`,
  quiz_passed: quizPassed,
  quiz_passed_at: quizPassed ? "2026-11-23T08:00:00+07:00" : null,
  created_at: "2026-11-23T07:00:00+07:00",
});

const makeKrathong = (
  id: string,
  userId: string,
  serialNo: number,
  createdAt: string,
  overrides: Partial<KrathongRecord> = {}
): KrathongRecord => ({
  id,
  user_id: userId,
  serial_no: serialNo,
  base_id: "banana-leaf",
  flower_id: "pink-lotus",
  candle_id: "classic-yellow",
  decor_id: "garland",
  aura_id: "fireflies",
  wish_text: `คำอธิษฐานของ ${userId}`,
  is_hidden: false,
  is_judge_pick: false,
  judge_award_label: null,
  created_at: createdAt,
  ...overrides,
});

describe("getEventPhase", () => {
  it("is open by default and reveals LINE display names", () => {
    const phase = getEventPhase(new Date(), "auto");
    expect(phase.phase).toBe("open");
    expect(phase.canSubmitKrathong).toBe(true);
    expect(phase.canVote).toBe(true);
    expect(phase.canChangeVote).toBe(true);
    expect(phase.isRevealed).toBe(true);
  });

  it("closes submissions and voting when admin sets override to closed", () => {
    const phase = getEventPhase(new Date(), "closed");
    expect(phase.phase).toBe("closed");
    expect(phase.canSubmitKrathong).toBe(false);
    expect(phase.canVote).toBe(false);
    expect(phase.isClosed).toBe(true);
  });
});

describe("validateVoteAction", () => {
  const k1 = makeKrathong("k1", "u1", 1, "2026-11-23T08:00:00+07:00");
  const k2 = makeKrathong("k2", "u2", 2, "2026-11-23T09:00:00+07:00");
  const k3 = makeKrathong("k3", "u3", 3, "2026-11-23T10:00:00+07:00");
  const k4 = makeKrathong("k4", "u4", 4, "2026-11-23T11:00:00+07:00");
  const openPhase = getEventPhase(new Date(), "auto");

  it("blocks voting for own krathong", () => {
    const res = validateVoteAction({
      action: "cast",
      voterId: "u1",
      targetKrathong: k1,
      existingVotes: [],
      phase: openPhase,
    });
    expect(res.ok).toBe(false);
  });

  it("blocks more than 3 votes before quiz and unlocks 5 votes after passing quiz", () => {
    const existingVotes: VoteRecord[] = [
      { id: "v1", voter_user_id: "u5", krathong_id: "k1", created_at: "" },
      { id: "v2", voter_user_id: "u5", krathong_id: "k2", created_at: "" },
      { id: "v3", voter_user_id: "u5", krathong_id: "k3", created_at: "" },
    ];
    const castFourthBeforeQuiz = validateVoteAction({
      action: "cast",
      voterId: "u5",
      voterQuizPassed: false,
      targetKrathong: k4,
      existingVotes,
      phase: openPhase,
    });
    expect(castFourthBeforeQuiz.ok).toBe(false);

    const castFourthAfterQuiz = validateVoteAction({
      action: "cast",
      voterId: "u5",
      voterQuizPassed: true,
      targetKrathong: k4,
      existingVotes,
      phase: openPhase,
    });
    expect(castFourthAfterQuiz.ok).toBe(true);

    const unvoteFirst = validateVoteAction({
      action: "unvote",
      voterId: "u5",
      voterQuizPassed: false,
      targetKrathong: k1,
      existingVotes,
      phase: openPhase,
    });
    expect(unvoteFirst.ok).toBe(true);
  });
});

describe("buildPublicKrathongs & rankKrathongs", () => {
  const users = [makeUser("u1", true), makeUser("u2", false), makeUser("u3", false)];
  const k1 = makeKrathong("k1", "u1", 1, "2026-11-23T10:00:00+07:00");
  const k2 = makeKrathong("k2", "u2", 2, "2026-11-23T09:00:00+07:00");
  const votes: VoteRecord[] = [
    { id: "v1", voter_user_id: "u3", krathong_id: "k1", created_at: "" },
    { id: "v2", voter_user_id: "u2", krathong_id: "k1", created_at: "" },
    { id: "v3", voter_user_id: "u1", krathong_id: "k2", created_at: "" },
    { id: "v4", voter_user_id: "u3", krathong_id: "k2", created_at: "" },
  ];

  it("breaks ties by earlier submission created_at", () => {
    const ranked = rankKrathongs([k1, k2], votes);
    expect(ranked[0].krathong.id).toBe("k2");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].krathong.id).toBe("k1");
    expect(ranked[1].rank).toBe(2);
  });

  it("includes LINE display_name and avatar_url in public krathongs", () => {
    const list = buildPublicKrathongs({
      krathongs: [k1, k2],
      votes,
      users,
      currentUserId: "u1",
    });
    const first = list.find((i) => i.id === "k2");
    expect(first?.author.display_name).toBe("ผู้ใช้ u2");
    expect(first?.author.avatar_url).toBe("https://example.com/avatar-u2.jpg");
    const mine = list.find((i) => i.id === "k1");
    expect(mine?.is_mine).toBe(true);
  });
});

describe("activity status & krathong parts validation", () => {
  it("computes krathong, quiz, and vote quota status (3 -> 5 after quiz)", () => {
    const uNoQuiz = makeUser("u1", false);
    const uQuiz = makeUser("u1", true);
    const k = makeKrathong("k1", "u1", 1, "2026-11-23T10:00:00+07:00");
    const votes: VoteRecord[] = [
      { id: "v1", voter_user_id: "u1", krathong_id: "k2", created_at: "" },
      { id: "v2", voter_user_id: "u1", krathong_id: "k3", created_at: "" },
    ];
    expect(computeUserActivityStatus(uNoQuiz, [k], votes).votes_required).toBe(3);

    const status = computeUserActivityStatus(uQuiz, [k], votes);
    expect(status.has_krathong).toBe(true);
    expect(status.quiz_passed).toBe(true);
    expect(status.votes_cast).toBe(2);
    expect(status.votes_required).toBe(5);
  });

  it("validates expanded krathong parts and optional aura_id", () => {
    expect(
      isValidKrathongParts({
        base_id: "golden-swan",
        flower_id: "sunflower",
        candle_id: "twin-lotus-candle",
        decor_id: "origami-crane",
        aura_id: "fireflies",
      })
    ).toBe(true);

    expect(
      isValidKrathongParts({
        base_id: "royal-barge",
        flower_id: "sakura-pink",
        candle_id: "floating-yi-peng",
        decor_id: "cute-turtle",
        aura_id: "moonlight-halo",
      })
    ).toBe(true);

    expect(
      isValidKrathongParts({
        base_id: "golden-swan",
        flower_id: "sunflower",
        candle_id: "twin-lotus-candle",
        decor_id: "origami-crane",
        aura_id: "invalid-aura",
      })
    ).toBe(false);
  });
});
