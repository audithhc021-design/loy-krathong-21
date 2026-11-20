export type PhaseOverride =
  | "auto"
  | "open"
  | "locked_voting"
  | "closed"
  | "revealed";

export interface EventPhaseInfo {
  phase: Exclude<PhaseOverride, "auto">;
  override: PhaseOverride;
  canSubmitKrathong: boolean;
  canTakeQuiz: boolean;
  canVote: boolean;
  canChangeVote: boolean;
  isClosed: boolean;
  isRevealed: boolean;
  nowIso: string;
}

export interface UserRecord {
  id: string;
  line_user_id: string;
  display_name: string;
  full_name: string;
  department: string;
  avatar_url: string | null;
  quiz_passed: boolean;
  quiz_passed_at: string | null;
  created_at: string;
}

export interface KrathongRecord {
  id: string;
  user_id: string;
  serial_no: number;
  base_id: string;
  flower_id: string;
  candle_id: string;
  decor_id: string;
  aura_id?: string;
  wish_text: string;
  is_hidden: boolean;
  is_judge_pick: boolean;
  judge_award_label: string | null;
  created_at: string;
}

export interface VoteRecord {
  id: string;
  voter_user_id: string;
  krathong_id: string;
  created_at: string;
}

export interface LuckyDrawPrizeRecord {
  id: string;
  title: string;
  sort_order: number;
  winner_user_id: string | null;
  drawn_at: string | null;
}

export interface PublicKrathongView {
  id: string;
  serial_no: number;
  anonymous_code: string;
  base_id: string;
  flower_id: string;
  candle_id: string;
  decor_id: string;
  aura_id: string;
  wish_text: string;
  vote_count: number;
  rank: number | null;
  is_mine: boolean;
  voted_by_me: boolean;
  is_judge_pick: boolean;
  judge_award_label: string | null;
  created_at: string;
  author: {
    full_name: string;
    department: string;
    avatar_url: string | null;
  } | null;
}

export interface MissionStatus {
  has_krathong: boolean;
  quiz_passed: boolean;
  votes_cast: number;
  votes_required: number;
  votes_completed: boolean;
  is_lucky_draw_eligible: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface KrathongPartOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
}
