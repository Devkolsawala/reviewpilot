-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  full_name text,
  company_name text,
  plan text default 'free' check (plan in ('free', 'starter', 'growth', 'agency')),
  razorpay_customer_id text,
  razorpay_subscription_id text,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

-- Connected accounts (GBP or Play Store)
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('google_business', 'play_store')),
  name text not null,
  external_id text,
  credentials jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- App Context Profiles
create table public.app_contexts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.connections(id) on delete cascade,
  description text,
  key_features text[],
  common_questions text[],
  known_issues text[],
  tone text default 'friendly' check (tone in ('friendly', 'professional', 'casual', 'apologetic', 'custom')),
  custom_tone_example text,
  support_url text,
  additional_instructions text,
  auto_reply_enabled boolean default false,
  auto_reply_min_rating int default 1,
  auto_reply_max_rating int default 5,
  updated_at timestamptz default now()
);

-- Unified reviews table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.connections(id) on delete cascade,
  source text not null check (source in ('google_business', 'play_store')),
  external_review_id text not null,
  author_name text,
  rating int check (rating between 1 and 5),
  review_text text,
  review_language text default 'en',
  device_info jsonb,
  reply_text text,
  reply_status text default 'pending' check (reply_status in ('pending', 'drafted', 'approved', 'published', 'failed')),
  reply_published_at timestamptz,
  sentiment text check (sentiment in ('positive', 'negative', 'neutral', 'mixed')),
  keywords text[],
  is_read boolean default false,
  review_created_at timestamptz,
  created_at timestamptz default now(),
  unique(connection_id, external_review_id)
);

-- SMS/Email campaigns
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.connections(id) on delete cascade,
  type text not null check (type in ('sms', 'email')),
  name text not null,
  message_template text not null,
  review_link text,
  status text default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  total_sent int default 0,
  total_clicked int default 0,
  created_at timestamptz default now()
);

-- Campaign recipients
create table public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  name text,
  phone text,
  email text,
  status text default 'pending' check (status in ('pending', 'sent', 'delivered', 'clicked', 'reviewed', 'failed')),
  sent_at timestamptz
);

-- Usage tracking
create table public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  month text not null,
  ai_replies_used int default 0,
  sms_sent int default 0,
  reviews_processed int default 0,
  unique(user_id, month)
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.app_contexts enable row level security;
alter table public.reviews enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.usage enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can manage own connections" on public.connections for all using (user_id = auth.uid());
create policy "Users can manage own app contexts" on public.app_contexts for all using (
  connection_id in (select id from public.connections where user_id = auth.uid())
);
create policy "Users can manage own reviews" on public.reviews for all using (
  connection_id in (select id from public.connections where user_id = auth.uid())
);
create policy "Users can manage own campaigns" on public.campaigns for all using (
  connection_id in (select id from public.connections where user_id = auth.uid())
);
create policy "Users can manage campaign recipients" on public.campaign_recipients for all using (
  campaign_id in (select id from public.campaigns where connection_id in (select id from public.connections where user_id = auth.uid()))
);
create policy "Users can manage own usage" on public.usage for all using (user_id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
