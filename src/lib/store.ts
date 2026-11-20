import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  KrathongRecord,
  LuckyDrawPrizeRecord,
  PhaseOverride,
  UserRecord,
  VoteRecord,
} from "./types";

interface LocalDbSchema {
  users: UserRecord[];
  krathongs: KrathongRecord[];
  votes: VoteRecord[];
  lucky_draw_prizes: LuckyDrawPrizeRecord[];
  app_settings: Record<string, string>;
  next_serial_no: number;
}

const LOCAL_DB_PATH =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "loy-krathong-69", "local-db.json")
    : path.join(process.cwd(), ".data", "local-db.json");

export function getStorageMode(): "supabase" | "local-dev" {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? "supabase" : "local-dev";
}

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createInitialLocalDb(): LocalDbSchema {
  const now = new Date("2026-11-20T08:30:00+07:00").toISOString();
  const demoUsers: UserRecord[] = [
    {
      id: "demo-u1",
      line_user_id: "dev-line-u1",
      display_name: "น้องบัว",
      full_name: "ศิริพร ใจดี (น้องบัว)",
      department: "ฝ่ายทรัพยากรบุคคลและธุรการ (HR/Admin)",
      avatar_url: null,
      quiz_passed: true,
      quiz_passed_at: now,
      created_at: now,
    },
    {
      id: "demo-u2",
      line_user_id: "dev-line-u2",
      display_name: "ต้นกล้า",
      full_name: "กิตติพงษ์ รักษ์โลก (ต้นกล้า)",
      department: "ฝ่ายเทคโนโลยีสารสนเทศ (IT)",
      avatar_url: null,
      quiz_passed: true,
      quiz_passed_at: now,
      created_at: now,
    },
    {
      id: "demo-u3",
      line_user_id: "dev-line-u3",
      display_name: "มะลิ",
      full_name: "นันทิดา สุขสันต์ (มะลิ)",
      department: "ฝ่ายการเงินและบัญชี",
      avatar_url: null,
      quiz_passed: true,
      quiz_passed_at: now,
      created_at: now,
    },
    {
      id: "demo-u4",
      line_user_id: "dev-line-u4",
      display_name: "ภูมิ",
      full_name: "ภาคภูมิ พัฒนา (ภูมิ)",
      department: "ฝ่ายปฏิบัติการ / บริการ",
      avatar_url: null,
      quiz_passed: false,
      quiz_passed_at: null,
      created_at: now,
    },
    {
      id: "demo-u5",
      line_user_id: "dev-line-u5",
      display_name: "แพรวา",
      full_name: "แพรวา สื่อสาร (แพร)",
      department: "ฝ่ายสื่อสารองค์กร / การตลาด",
      avatar_url: null,
      quiz_passed: true,
      quiz_passed_at: now,
      created_at: now,
    },
  ];

  const demoKrathongs: KrathongRecord[] = [
    {
      id: "demo-k1",
      user_id: "demo-u1",
      serial_no: 1,
      base_id: "banana-leaf",
      flower_id: "pink-lotus",
      candle_id: "classic-yellow",
      decor_id: "garland",
      wish_text:
        "ขอให้ทุกทีมทำงานราบรื่น ประชุมไม่ยืดเยื้อ เงินเดือนขึ้น โบนัสพุ่ง และสุขภาพแข็งแรงกันทุกคนเลยค่ะ!",
      is_hidden: false,
      is_judge_pick: false,
      judge_award_label: null,
      created_at: "2026-11-20T08:35:00+07:00",
    },
    {
      id: "demo-k2",
      user_id: "demo-u2",
      serial_no: 2,
      base_id: "coconut-shell",
      flower_id: "marigold",
      candle_id: "digital-lantern",
      decor_id: "tag-work-pang",
      wish_text:
        "ลอยความเครียดและบั๊กทั้งหมดลงแม่น้ำ ขอให้ระบบเสถียร 99.99% ไม่ล่มวันหยุดยาวครับ!",
      is_hidden: false,
      is_judge_pick: false,
      judge_award_label: null,
      created_at: "2026-11-20T08:40:00+07:00",
    },
    {
      id: "demo-k3",
      user_id: "demo-u3",
      serial_no: 3,
      base_id: "pastel-petal",
      flower_id: "jasmine-garland",
      candle_id: "pastel-aroma",
      decor_id: "tag-bonus",
      wish_text:
        "ขอให้ปิดงบไว ไร้จุดทศนิยมตกหล่น มีความสุขในทุกเช้าวันจันทร์ และสมหวังในสิ่งที่ตั้งใจนะคะ",
      is_hidden: false,
      is_judge_pick: false,
      judge_award_label: null,
      created_at: "2026-11-20T08:45:00+07:00",
    },
    {
      id: "demo-k4",
      user_id: "demo-u4",
      serial_no: 4,
      base_id: "bread-lotus",
      flower_id: "purple-orchid",
      candle_id: "golden-lamp",
      decor_id: "eco-butterfly",
      wish_text:
        "ขอให้หน่วยงานของเราเติบโตอย่างยั่งยืน เพื่อนร่วมงานน่ารักแบบนี้ตลอดไปครับ",
      is_hidden: false,
      is_judge_pick: false,
      judge_award_label: null,
      created_at: "2026-11-20T08:50:00+07:00",
    },
    {
      id: "demo-k5",
      user_id: "demo-u5",
      serial_no: 5,
      base_id: "banana-leaf",
      flower_id: "pink-lotus",
      candle_id: "pastel-aroma",
      decor_id: "lucky-coin",
      wish_text:
        "ขอให้ปีหน้าเป็นปีที่ใจดีกับทุกคน มีพลังบวก มีกาแฟอร่อยๆ กินทุกวัน และจับฉลากได้รางวัลใหญ่ด้วยเพี้ยง!",
      is_hidden: false,
      is_judge_pick: false,
      judge_award_label: null,
      created_at: "2026-11-20T08:55:00+07:00",
    },
  ];

  const demoVotes: VoteRecord[] = [
    { id: "dv1", voter_user_id: "demo-u1", krathong_id: "demo-k2", created_at: now },
    { id: "dv2", voter_user_id: "demo-u1", krathong_id: "demo-k3", created_at: now },
    { id: "dv3", voter_user_id: "demo-u1", krathong_id: "demo-k5", created_at: now },
    { id: "dv4", voter_user_id: "demo-u2", krathong_id: "demo-k1", created_at: now },
    { id: "dv5", voter_user_id: "demo-u2", krathong_id: "demo-k3", created_at: now },
    { id: "dv6", voter_user_id: "demo-u2", krathong_id: "demo-k5", created_at: now },
    { id: "dv7", voter_user_id: "demo-u3", krathong_id: "demo-k2", created_at: now },
    { id: "dv8", voter_user_id: "demo-u3", krathong_id: "demo-k1", created_at: now },
    { id: "dv9", voter_user_id: "demo-u3", krathong_id: "demo-k4", created_at: now },
    { id: "dv10", voter_user_id: "demo-u5", krathong_id: "demo-k2", created_at: now },
    { id: "dv11", voter_user_id: "demo-u5", krathong_id: "demo-k1", created_at: now },
    { id: "dv12", voter_user_id: "demo-u5", krathong_id: "demo-k3", created_at: now },
  ];

  const demoPrizes: LuckyDrawPrizeRecord[] = [
    {
      id: "p1",
      title: "รางวัลพิเศษจากผู้อำนวยการ (รางวัลที่ 1)",
      sort_order: 1,
      winner_user_id: null,
      drawn_at: null,
    },
    {
      id: "p2",
      title: "บัตรกำนัลช้อปปิ้ง / ทานอาหาร (รางวัลที่ 2)",
      sort_order: 2,
      winner_user_id: null,
      drawn_at: null,
    },
    {
      id: "p3",
      title: "บัตรกำนัลช้อปปิ้ง / ทานอาหาร (รางวัลที่ 3)",
      sort_order: 3,
      winner_user_id: null,
      drawn_at: null,
    },
    {
      id: "p4",
      title: "ของขวัญรักษ์โลก (รางวัลที่ 4)",
      sort_order: 4,
      winner_user_id: null,
      drawn_at: null,
    },
    {
      id: "p5",
      title: "ของขวัญรักษ์โลก (รางวัลที่ 5)",
      sort_order: 5,
      winner_user_id: null,
      drawn_at: null,
    },
  ];

  return {
    users: demoUsers,
    krathongs: demoKrathongs,
    votes: demoVotes,
    lucky_draw_prizes: demoPrizes,
    app_settings: { phase_override: "auto" },
    next_serial_no: 6,
  };
}

function readLocalDb(): LocalDbSchema {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initial = createInitialLocalDb();
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  const raw = fs.readFileSync(LOCAL_DB_PATH, "utf8");
  return JSON.parse(raw) as LocalDbSchema;
}

function writeLocalDb(data: LocalDbSchema): void {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

export const db = {
  async getPhaseOverride(): Promise<PhaseOverride> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data } = await sb
        .from("app_settings")
        .select("value")
        .eq("key", "phase_override")
        .maybeSingle();
      const val = data?.value;
      if (
        val === "auto" ||
        val === "open" ||
        val === "locked_voting" ||
        val === "closed" ||
        val === "revealed"
      ) {
        return val;
      }
      return "auto";
    }

    const local = readLocalDb();
    return (local.app_settings.phase_override as PhaseOverride) || "auto";
  },

  async setPhaseOverride(override: PhaseOverride): Promise<void> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      await sb.from("app_settings").upsert({
        key: "phase_override",
        value: override,
        updated_at: new Date().toISOString(),
      });
      return;
    }

    const local = readLocalDb();
    local.app_settings.phase_override = override;
    writeLocalDb(local);
  },

  async getAllUsers(): Promise<UserRecord[]> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as UserRecord[];
    }
    return readLocalDb().users;
  },

  async getUserById(id: string): Promise<UserRecord | null> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data } = await sb.from("users").select("*").eq("id", id).maybeSingle();
      return (data as UserRecord | null) ?? null;
    }
    return readLocalDb().users.find((u) => u.id === id) ?? null;
  },

  async getUserByLineId(lineUserId: string): Promise<UserRecord | null> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data } = await sb
        .from("users")
        .select("*")
        .eq("line_user_id", lineUserId)
        .maybeSingle();
      return (data as UserRecord | null) ?? null;
    }
    return readLocalDb().users.find((u) => u.line_user_id === lineUserId) ?? null;
  },

  async upsertUser(input: {
    line_user_id: string;
    display_name: string;
    full_name: string;
    department: string;
    avatar_url: string | null;
  }): Promise<UserRecord> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const existing = await this.getUserByLineId(input.line_user_id);
      if (existing) {
        const { data, error } = await sb
          .from("users")
          .update({
            display_name: input.display_name,
            full_name: input.full_name,
            department: input.department,
            avatar_url: input.avatar_url,
          })
          .eq("id", existing.id)
          .select("*")
          .single();
        if (error) throw error;
        return data as UserRecord;
      }

      const { data, error } = await sb
        .from("users")
        .insert({
          line_user_id: input.line_user_id,
          display_name: input.display_name,
          full_name: input.full_name,
          department: input.department,
          avatar_url: input.avatar_url,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as UserRecord;
    }

    const local = readLocalDb();
    const existing = local.users.find(
      (u) => u.line_user_id === input.line_user_id
    );
    if (existing) {
      existing.display_name = input.display_name;
      existing.full_name = input.full_name;
      existing.department = input.department;
      existing.avatar_url = input.avatar_url;
      writeLocalDb(local);
      return existing;
    }

    const created: UserRecord = {
      id: crypto.randomUUID(),
      line_user_id: input.line_user_id,
      display_name: input.display_name,
      full_name: input.full_name,
      department: input.department,
      avatar_url: input.avatar_url,
      quiz_passed: false,
      quiz_passed_at: null,
      created_at: new Date().toISOString(),
    };
    local.users.push(created);
    writeLocalDb(local);
    return created;
  },

  async markQuizPassed(userId: string): Promise<UserRecord> {
    const now = new Date().toISOString();
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from("users")
        .update({ quiz_passed: true, quiz_passed_at: now })
        .eq("id", userId)
        .select("*")
        .single();
      if (error) throw error;
      return data as UserRecord;
    }

    const local = readLocalDb();
    const user = local.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.quiz_passed = true;
    user.quiz_passed_at = now;
    writeLocalDb(local);
    return user;
  },

  async getAllKrathongs(): Promise<KrathongRecord[]> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from("krathongs")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as KrathongRecord[];
    }
    return readLocalDb().krathongs;
  },

  async upsertKrathong(input: {
    user_id: string;
    base_id: string;
    flower_id: string;
    candle_id: string;
    decor_id: string;
    aura_id: string;
    wish_text: string;
  }): Promise<KrathongRecord> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data: existing } = await sb
        .from("krathongs")
        .select("*")
        .eq("user_id", input.user_id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await sb
          .from("krathongs")
          .update({
            base_id: input.base_id,
            flower_id: input.flower_id,
            candle_id: input.candle_id,
            decor_id: input.decor_id,
            aura_id: input.aura_id,
            wish_text: input.wish_text,
          })
          .eq("id", existing.id)
          .select("*")
          .single();
        if (error) throw error;
        return data as KrathongRecord;
      }

      const { data, error } = await sb
        .from("krathongs")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data as KrathongRecord;
    }

    const local = readLocalDb();
    const existing = local.krathongs.find((k) => k.user_id === input.user_id);
    if (existing) {
      existing.base_id = input.base_id;
      existing.flower_id = input.flower_id;
      existing.candle_id = input.candle_id;
      existing.decor_id = input.decor_id;
      existing.aura_id = input.aura_id;
      existing.wish_text = input.wish_text;
      writeLocalDb(local);
      return existing;
    }

    const created: KrathongRecord = {
      id: crypto.randomUUID(),
      user_id: input.user_id,
      serial_no: local.next_serial_no++,
      base_id: input.base_id,
      flower_id: input.flower_id,
      candle_id: input.candle_id,
      decor_id: input.decor_id,
      aura_id: input.aura_id,
      wish_text: input.wish_text,
      is_hidden: false,
      is_judge_pick: false,
      judge_award_label: null,
      created_at: new Date().toISOString(),
    };
    local.krathongs.push(created);
    writeLocalDb(local);
    return created;
  },

  async updateKrathongAdmin(
    krathongId: string,
    patch: Partial<Pick<KrathongRecord, "is_hidden" | "is_judge_pick" | "judge_award_label">>
  ): Promise<KrathongRecord> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from("krathongs")
        .update(patch)
        .eq("id", krathongId)
        .select("*")
        .single();
      if (error) throw error;
      return data as KrathongRecord;
    }

    const local = readLocalDb();
    const target = local.krathongs.find((k) => k.id === krathongId);
    if (!target) throw new Error("Krathong not found");
    Object.assign(target, patch);
    writeLocalDb(local);
    return target;
  },

  async getAllVotes(): Promise<VoteRecord[]> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from("votes")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as VoteRecord[];
    }
    return readLocalDb().votes;
  },

  async castVote(voterUserId: string, krathongId: string): Promise<void> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { error } = await sb
        .from("votes")
        .insert({ voter_user_id: voterUserId, krathong_id: krathongId });
      if (error) throw error;
      return;
    }

    const local = readLocalDb();
    local.votes.push({
      id: crypto.randomUUID(),
      voter_user_id: voterUserId,
      krathong_id: krathongId,
      created_at: new Date().toISOString(),
    });
    writeLocalDb(local);
  },

  async removeVote(voterUserId: string, krathongId: string): Promise<void> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { error } = await sb
        .from("votes")
        .delete()
        .eq("voter_user_id", voterUserId)
        .eq("krathong_id", krathongId);
      if (error) throw error;
      return;
    }

    const local = readLocalDb();
    local.votes = local.votes.filter(
      (v) =>
        !(v.voter_user_id === voterUserId && v.krathong_id === krathongId)
    );
    writeLocalDb(local);
  },

  async getAllPrizes(): Promise<LuckyDrawPrizeRecord[]> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from("lucky_draw_prizes")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LuckyDrawPrizeRecord[];
    }
    return [...readLocalDb().lucky_draw_prizes].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  },

  async createPrize(title: string): Promise<LuckyDrawPrizeRecord> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const existing = await this.getAllPrizes();
      const maxOrder = existing.reduce((m, p) => Math.max(m, p.sort_order), 0);
      const { data, error } = await sb
        .from("lucky_draw_prizes")
        .insert({ title, sort_order: maxOrder + 1 })
        .select("*")
        .single();
      if (error) throw error;
      return data as LuckyDrawPrizeRecord;
    }

    const local = readLocalDb();
    const maxOrder = local.lucky_draw_prizes.reduce(
      (m, p) => Math.max(m, p.sort_order),
      0
    );
    const created: LuckyDrawPrizeRecord = {
      id: crypto.randomUUID(),
      title,
      sort_order: maxOrder + 1,
      winner_user_id: null,
      drawn_at: null,
    };
    local.lucky_draw_prizes.push(created);
    writeLocalDb(local);
    return created;
  },

  async deletePrize(prizeId: string): Promise<void> {
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { error } = await sb
        .from("lucky_draw_prizes")
        .delete()
        .eq("id", prizeId);
      if (error) throw error;
      return;
    }
    const local = readLocalDb();
    local.lucky_draw_prizes = local.lucky_draw_prizes.filter(
      (p) => p.id !== prizeId
    );
    writeLocalDb(local);
  },

  async setPrizeWinner(
    prizeId: string,
    winnerUserId: string | null
  ): Promise<LuckyDrawPrizeRecord> {
    const drawnAt = winnerUserId ? new Date().toISOString() : null;
    if (getStorageMode() === "supabase") {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from("lucky_draw_prizes")
        .update({ winner_user_id: winnerUserId, drawn_at: drawnAt })
        .eq("id", prizeId)
        .select("*")
        .single();
      if (error) throw error;
      return data as LuckyDrawPrizeRecord;
    }

    const local = readLocalDb();
    const target = local.lucky_draw_prizes.find((p) => p.id === prizeId);
    if (!target) throw new Error("Prize not found");
    target.winner_user_id = winnerUserId;
    target.drawn_at = drawnAt;
    writeLocalDb(local);
    return target;
  },
};
