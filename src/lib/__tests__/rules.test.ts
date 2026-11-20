import { describe, expect, it } from "vitest";
import {
  buildPublicKrathongs,
  canAssignJudgePick,
  computeMissionStatus,
  getEventPhase,
  isValidKrathongParts,
  rankKrathongs,
  validateVoteAction,
} from "../rules";
import type { KrathongRecord, UserRecord, VoteRecord } from "../types";

const makeUser = (id: string, quizPassed = false): UserRecord => ({
  id,
  line_user_id: `line-${id}`,
  display_name: `User ${id}`,
  full_name: `พนักงาน ${id}`,
  department: "ฝ่ายเทคโนโลยีสารสนเทศ (IT)",
  avatar_url: null,
  quiz_passed: quizPassed,
  quiz_passed_at: quizPassed ? "2026-11-20T10:00:00+07:00" : null,
  created_at: "2026-11-20T09:00:00+07:00",
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
  wish_text: `คำอธิษฐานของ ${userId}`,
  is_hidden: false,
  is_judge_pick: false,
  judge_award_label: null,
  created_at: createdAt,
  ...overrides,
});

describe("getEventPhase", () => {
  it("allows vote changes before 24 Nov 2026 16:00 ICT", () => {
    const phase = getEventPhase(new Date("2026-11-24T15:59:59+07:00"));
    expect(phase.phase).toBe("open");
    expect(phase.canVote).toBe(true);
    expect(phase.canChangeVote).toBe(true);
    expect(phase.isRevealed).toBe(false);
  });

  it("locks vote changes at/after 24 Nov 2026 16:00 ICT while allowing remaining votes", () => {
    const phase = getEventPhase(new Date("2026-11-24T16:00:00+07:00"));
    expect(phase.phase).toBe("locked_voting");
    expect(phase.canVote).toBe(true);
    expect(phase.canChangeVote).toBe(false);
    expect(phase.isRevealed).toBe(false);
  });

  it("closes submissions and voting at 24 Nov 2026 24:00 ICT", () => {
    const phase = getEventPhase(new Date("2026-11-25T00:00:00+07:00"));
    expect(phase.phase).toBe("closed");
    expect(phase.canSubmitKrathong).toBe(false);
    expect(phase.canTakeQuiz).toBe(false);
    expect(phase.canVote).toBe(false);
    expect(phase.isClosed).toBe(true);
    expect(phase.isRevealed).toBe(false);
  });

  it("reveals results at 25 Nov 2026 08:00 ICT", () => {
    const phase = getEventPhase(new Date("2026-11-25T08:00:00+07:00"));
    expect(phase.phase).toBe("revealed");
    expect(phase.isRevealed).toBe(true);
  });
});

describe("validateVoteAction", () => {
  const k1 = makeKrathong("k1", "u1", 1, "2026-11-20T10:00:00+07:00");
  const k2 = makeKrathong("k2", "u2", 2, "2026-11-20T11:00:00+07:00");
  const k3 = makeKrathong("k3", "u3", 3, "2026-11-20T12:00:00+07:00");
  const k4 = makeKrathong("k4", "u4", 4, "2026-11-20T13:00:00+07:00");

  it("blocks voting for own krathong", () => {
    const phase = getEventPhase(new Date("2026-11-20T12:00:00+07:00"));
    const res = validateVoteAction({
      action: "cast",
      voterId: "u1",
      targetKrathong: k1,
      existingVotes: [],
      phase,
    });
    expect(res.ok).toBe(false);
  });

  it("blocks more than 3 votes per user", () => {
    const phase = getEventPhase(new Date("2026-11-20T12:00:00+07:00"));
    const existingVotes: VoteRecord[] = [
      { id: "v1", voter_user_id: "u5", krathong_id: "k1", created_at: "" },
      { id: "v2", voter_user_id: "u5", krathong_id: "k2", created_at: "" },
      { id: "v3", voter_user_id: "u5", krathong_id: "k3", created_at: "" },
    ];
    const res = validateVoteAction({
      action: "cast",
      voterId: "u5",
      targetKrathong: k4,
      existingVotes,
      phase,
    });
    expect(res.ok).toBe(false);
  });

  it("allows unvote before 16:00 and blocks unvote after 16:00", () => {
    const existingVotes: VoteRecord[] = [
      { id: "v1", voter_user_id: "u5", krathong_id: "k1", created_at: "" },
    ];

    const beforeCutoff = validateVoteAction({
      action: "unvote",
      voterId: "u5",
      targetKrathong: k1,
      existingVotes,
      phase: getEventPhase(new Date("2026-11-24T15:00:00+07:00")),
    });
    expect(beforeCutoff.ok).toBe(true);

    const afterCutoff = validateVoteAction({
      action: "unvote",
      voterId: "u5",
      targetKrathong: k1,
      existingVotes,
      phase: getEventPhase(new Date("2026-11-24T16:01:00+07:00")),
    });
    expect(afterCutoff.ok).toBe(false);
  });

  it("still allows casting unused votes after 16:00 until 24:00", () => {
    const existingVotes: VoteRecord[] = [
      { id: "v1", voter_user_id: "u5", krathong_id: "k1", created_at: "" },
    ];
    const res = validateVoteAction({
      action: "cast",
      voterId: "u5",
      targetKrathong: k2,
      existingVotes,
      phase: getEventPhase(new Date("2026-11-24T20:00:00+07:00")),
    });
    expect(res.ok).toBe(true);
  });
});

describe("buildPublicKrathongs & rankKrathongs", () => {
  const users = [makeUser("u1", true), makeUser("u2", true), makeUser("u3", false)];
  const k1 = makeKrathong("k1", "u1", 1, "2026-11-20T10:00:00+07:00");
  const k2 = makeKrathong("k2", "u2", 2, "2026-11-20T09:00:00+07:00", {
    is_judge_pick: true,
    judge_award_label: "รางวัลโดนใจกรรมการ",
  });
  const votes: VoteRecord[] = [
    { id: "v1", voter_user_id: "u3", krathong_id: "k1", created_at: "" },
    { id: "v2", voter_user_id: "u2", krathong_id: "k1", created_at: "" },
    { id: "v3", voter_user_id: "u1", krathong_id: "k2", created_at: "" },
    { id: "v4", voter_user_id: "u3", krathong_id: "k2", created_at: "" },
  ];

  it("breaks ties by earlier submission created_at", () => {
    const ranked = rankKrathongs([k1, k2], votes);
    expect(ranked[0].krathong.id).toBe("k2"); // both have 2 votes, k2 was created at 09:00
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].krathong.id).toBe("k1");
    expect(ranked[1].rank).toBe(2);
  });

  it("masks author info and judge pick before reveal", () => {
    const list = buildPublicKrathongs({
      krathongs: [k1, k2],
      votes,
      users,
      currentUserId: "u1",
      isRevealed: false,
    });
    for (const item of list) {
      expect(item.author).toBeNull();
      expect(item.is_judge_pick).toBe(false);
    }
    const mine = list.find((i) => i.id === "k1");
    expect(mine?.is_mine).toBe(true);
  });

  it("reveals author info and judge pick after reveal", () => {
    const list = buildPublicKrathongs({
      krathongs: [k1, k2],
      votes,
      users,
      currentUserId: "u1",
      isRevealed: true,
    });
    const first = list.find((i) => i.id === "k2");
    expect(first?.author?.full_name).toBe("พนักงาน u2");
    expect(first?.is_judge_pick).toBe(true);
  });
});

describe("mission eligibility & judge picks", () => {
  it("requires all 3 missions for Lucky Draw eligibility", () => {
    const u = makeUser("u1", true);
    const k = makeKrathong("k1", "u1", 1, "2026-11-20T10:00:00+07:00");
    const votes: VoteRecord[] = [
      { id: "v1", voter_user_id: "u1", krathong_id: "k2", created_at: "" },
      { id: "v2", voter_user_id: "u1", krathong_id: "k3", created_at: "" },
    ];
    expect(computeMissionStatus(u, [k], votes).is_lucky_draw_eligible).toBe(false);

    votes.push({ id: "v3", voter_user_id: "u1", krathong_id: "k4", created_at: "" });
    expect(computeMissionStatus(u, [k], votes).is_lucky_draw_eligible).toBe(true);
  });

  it("prevents assigning judge pick to top 3 or exceeding 2 judge picks", () => {
    const krathongs = [
      makeKrathong("k1", "u1", 1, "2026-11-20T09:00:00+07:00"),
      makeKrathong("k2", "u2", 2, "2026-11-20T10:00:00+07:00"),
      makeKrathong("k3", "u3", 3, "2026-11-20T11:00:00+07:00"),
      makeKrathong("k4", "u4", 4, "2026-11-20T12:00:00+07:00", { is_judge_pick: true }),
      makeKrathong("k5", "u5", 5, "2026-11-20T13:00:00+07:00", { is_judge_pick: true }),
      makeKrathong("k6", "u6", 6, "2026-11-20T14:00:00+07:00"),
    ];

    expect(canAssignJudgePick({ krathongId: "k1", krathongs, votes: [] }).ok).toBe(false);
    expect(canAssignJudgePick({ krathongId: "k6", krathongs, votes: [] }).ok).toBe(false);
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
        base_id: "banana-boat",
        flower_id: "red-rose",
        candle_id: "sky-flame",
        decor_id: "tag-rich",
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
