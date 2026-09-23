-- FATTOUCH AI / Supabase foundation
-- Run this migration in Supabase SQL Editor on a new project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$ begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'محادثة جديدة',
  locale text not null default 'ar-LB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  message text not null,
  attachments jsonb not null default '[]'::jsonb,
  locale text not null default 'ar-LB',
  status text not null default 'created',
  approval jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  type text not null,
  label text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  type text not null check (type in ('job', 'business', 'marketplace', 'service', 'event', 'property')),
  fields jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  visibility text not null default 'matched_users',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  requester_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null references public.contact_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null references public.contact_requests(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

create table if not exists public.ad_payments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id) on delete cascade,
  payer_id uuid not null references auth.users(id) on delete cascade,
  method text not null default 'whish_money',
  amount numeric,
  currency text,
  status text not null default 'pending_payment',
  payment_reference text,
  proof_path text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_impressions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  placement text not null,
  viewer_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_clicks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  placement text not null,
  viewer_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  path text not null unique,
  original_name text not null,
  content_type text not null,
  size bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists listings_active_idx on public.listings(status, expires_at);
create index if not exists listings_owner_idx on public.listings(owner_id, created_at desc);
create index if not exists tasks_owner_idx on public.tasks(owner_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists impressions_listing_idx on public.ad_impressions(listing_id, created_at desc);
create index if not exists clicks_listing_idx on public.ad_clicks(listing_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.tasks enable row level security;
alter table public.task_events enable row level security;
alter table public.listings enable row level security;
alter table public.contact_requests enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.ad_payments enable row level security;
alter table public.ad_impressions enable row level security;
alter table public.ad_clicks enable row level security;
alter table public.uploaded_files enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

create policy profiles_self_select on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy conversations_owner_all on public.conversations for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy tasks_owner_all on public.tasks for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy task_events_owner_select on public.task_events for select using (exists (select 1 from public.tasks t where t.id = task_id and (t.owner_id = auth.uid() or public.is_admin())));
create policy task_events_owner_insert on public.task_events for insert with check (exists (select 1 from public.tasks t where t.id = task_id and (t.owner_id = auth.uid() or public.is_admin())));

create policy listings_public_select on public.listings for select using (status = 'active' and expires_at > now() or owner_id = auth.uid() or public.is_admin());
create policy listings_owner_insert on public.listings for insert with check (owner_id = auth.uid());
create policy listings_owner_update on public.listings for update using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy listings_owner_delete on public.listings for delete using (owner_id = auth.uid() or public.is_admin());

create policy contact_participant_select on public.contact_requests for select using (requester_id = auth.uid() or exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()) or public.is_admin());
create policy contact_requester_insert on public.contact_requests for insert with check (requester_id = auth.uid());
create policy contact_owner_update on public.contact_requests for update using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()) or public.is_admin());

create policy messages_participant_all on public.messages for all using (sender_id = auth.uid() or exists (select 1 from public.contact_requests cr join public.listings l on l.id = cr.listing_id where cr.id = contact_request_id and (cr.requester_id = auth.uid() or l.owner_id = auth.uid())) or public.is_admin()) with check (sender_id = auth.uid());
create policy reports_participant_insert on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_admin_select on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy reports_admin_update on public.reports for update using (public.is_admin());
create policy blocks_owner_all on public.blocks for all using (blocker_id = auth.uid() or public.is_admin()) with check (blocker_id = auth.uid());

create policy payments_owner_select on public.ad_payments for select using (payer_id = auth.uid() or public.is_admin());
create policy payments_owner_insert on public.ad_payments for insert with check (payer_id = auth.uid());
create policy payments_owner_update on public.ad_payments for update using (payer_id = auth.uid() or public.is_admin()) with check (payer_id = auth.uid() or public.is_admin());
create policy impressions_public_insert on public.ad_impressions for insert with check (true);
create policy impressions_owner_select on public.ad_impressions for select using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()) or public.is_admin());
create policy clicks_public_insert on public.ad_clicks for insert with check (true);
create policy clicks_owner_select on public.ad_clicks for select using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()) or public.is_admin());

create policy files_owner_all on public.uploaded_files for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy audit_admin_select on public.audit_logs for select using (public.is_admin());
create policy notifications_owner_select on public.notifications for select using (user_id = auth.uid());
create policy notifications_owner_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values
  ('user-files', 'user-files', false),
  ('payment-proofs', 'payment-proofs', false),
  ('listing-images', 'listing-images', false)
on conflict (id) do nothing;

create policy storage_owner_select on storage.objects for select using (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin());
create policy storage_owner_insert on storage.objects for insert with check (auth.uid()::text = (storage.foldername(name))[1]);
create policy storage_owner_update on storage.objects for update using (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin());
create policy storage_owner_delete on storage.objects for delete using (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin());
