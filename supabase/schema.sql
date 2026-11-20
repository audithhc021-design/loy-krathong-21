-- รัน SQL นี้ใน Supabase SQL Editor เพื่อสร้างตารางสำหรับแอพลอยกระทง 2569

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  line_user_id text unique not null,
  display_name text not null,
  full_name text not null,
  department text not null,
  avatar_url text,
  quiz_passed boolean not null default false,
  quiz_passed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.krathongs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.users(id) on delete cascade,
  serial_no integer generated always as identity,
  base_id text not null,
  flower_id text not null,
  candle_id text not null,
  decor_id text not null,
  aura_id text not null default 'none',
  wish_text text not null,
  is_hidden boolean not null default false,
  is_judge_pick boolean not null default false,
  judge_award_label text,
  created_at timestamptz not null default now()
);

alter table public.krathongs
  add column if not exists aura_id text not null default 'none';

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_user_id uuid not null references public.users(id) on delete cascade,
  krathong_id uuid not null references public.krathongs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (voter_user_id, krathong_id)
);

create table if not exists public.lucky_draw_prizes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sort_order integer not null default 1,
  winner_user_id uuid references public.users(id) on delete set null,
  drawn_at timestamptz
);

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('phase_override', 'auto')
on conflict (key) do nothing;

-- ตัวอย่างของรางวัลจับฉลากเริ่มต้น (แอดมินเพิ่ม/ลบ/แก้ไขได้จากหน้า Admin)
insert into public.lucky_draw_prizes (title, sort_order)
select * from (
  values
    ('รางวัลพิเศษจากผู้อำนวยการ (รางวัลที่ 1)', 1),
    ('บัตรกำนัลช้อปปิ้ง / ทานอาหาร (รางวัลที่ 2)', 2),
    ('บัตรกำนัลช้อปปิ้ง / ทานอาหาร (รางวัลที่ 3)', 3),
    ('ของขวัญรักษ์โลก (รางวัลที่ 4)', 4),
    ('ของขวัญรักษ์โลก (รางวัลที่ 5)', 5)
) as v(title, sort_order)
where not exists (select 1 from public.lucky_draw_prizes);

create index if not exists idx_votes_krathong on public.votes(krathong_id);
create index if not exists idx_votes_voter on public.votes(voter_user_id);
create index if not exists idx_krathongs_created on public.krathongs(created_at);

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
