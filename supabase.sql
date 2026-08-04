create table if not exists users (
  id bigint primary key generated always as identity,
  provider text not null,
  provider_id text not null,
  discord_id text,
  username text,
  email text,
  avatar_url text,
  alias text,
  display_name text,
  description text,
  accent_color text default '#1b1b1b',
  text_color text default '#ffffff',
  background_color text default '#080808',
  icon_color text default '#ffffff',
  bg_effect_color text default '#ffffff',
  primary_color text default '#edddf0',
  secondary_color text default '#a855f7',
  show_username boolean default true,
  display_effect text default 'none',
  font text default 'Inter',
  video_audio boolean default false,
  bg_effect text default 'none',
  entry_text text default 'click anywhere to enter',
  entry_font text default 'Inter',
  entry_color text default 'rgba(255,255,255,0.5)',
  entry_effect text default 'none',
  desc_effect text default 'none',
  desc_effect_speed integer default 50,
  desc_lines json default '[]',
  monochrome_icons boolean default false,
  monochrome_badges boolean default false,
  banner_enabled boolean default false,
  seo_title text,
  seo_description text,
  seo_image text,
  seo_favicon text,
  panel_mouse_follow boolean default false,
  audio_volume integer default 30,
  audio_autoplay boolean default true,
  audio_loop boolean default true,
  audio_shuffle boolean default false,
  cursor_effect text default 'none',
  password_hash text,
  email_verified boolean default false,
  avatar_shape text default 'circle',
  avatar_size integer default 96,
  avatar_offset_x integer default 0,
  avatar_offset_y integer default 0,
  name_offset_x integer default 0,
  name_offset_y integer default 0,
  badge_offset_x integer default 0,
  badge_offset_y integer default 0,
  desc_offset_x integer default 0,
  desc_offset_y integer default 0,
  song_offset_x integer default 0,
  song_offset_y integer default 0,
  discord_rpc_offset_x integer default 0,
  discord_rpc_offset_y integer default 0,
  discord_rpc_enabled boolean default false,
  views_blacklisted boolean not null default false,
  created_at timestamptz default now(),
  unique (provider, provider_id)
);

create unique index if not exists users_username_unique on users (username) where username is not null;
create unique index if not exists users_alias_unique on users (alias) where alias is not null;

-- discord_id lets a Discord login be LINKED to an existing account (email/google) instead of creating a duplicate.
alter table users add column if not exists discord_id text;
create unique index if not exists users_discord_id_unique on users (discord_id) where discord_id is not null;

-- discord_rpc_enabled lets a user opt into showing their Discord presence on their public biolink.
alter table users add column if not exists discord_rpc_enabled boolean default false;

-- views_blacklisted disables view collection and replaces the public count with BLACKLISTED.
alter table users add column if not exists views_blacklisted boolean not null default false;

-- Add display_name on existing databases (create table above only applies to fresh installs).
alter table users add column if not exists display_name text;

-- Positionable element offsets for description, song player, and discord rpc (mirror avatar/name/badge).
alter table users add column if not exists desc_offset_x integer default 0;
alter table users add column if not exists desc_offset_y integer default 0;
alter table users add column if not exists song_offset_x integer default 0;
alter table users add column if not exists song_offset_y integer default 0;
alter table users add column if not exists discord_rpc_offset_x integer default 0;
alter table users add column if not exists discord_rpc_offset_y integer default 0;

-- widgets are premium-only embedded widgets (e.g. clock) rendered below the biolink glasscard.
alter table users add column if not exists widgets jsonb default '[]'::jsonb;

alter table users enable row level security;

-- Writes to users are ONLY allowed via server-side API functions using the service role key.
-- anon (browser) is read-only, and only for the columns needed to render a public biolink.
-- Sensitive columns (email, provider_id, password_hash, session_token) are NOT granted to anon.
drop policy if exists "anon can insert" on users;
drop policy if exists "anon can update" on users;
drop policy if exists "anon can delete" on users;

drop policy if exists "anon can select" on users;
create policy "anon can select" on users for select to anon using (true);

revoke all on users from anon;
grant select (
  id, username, alias, display_name, avatar_url, description, accent_color, text_color,
  background_color, icon_color, bg_effect_color, primary_color, secondary_color,
  show_username, display_effect, font, video_audio, bg_effect, song_platform,
  song_id, entry_text, entry_font, entry_color, entry_effect, desc_effect, desc_effect_speed,
  desc_lines, monochrome_icons, monochrome_badges, banner_enabled, seo_title,
  seo_description, seo_image, seo_favicon, panel_mouse_follow, audio_volume,
  audio_autoplay, audio_loop, audio_shuffle, cursor_effect, avatar_shape,
  avatar_size, avatar_offset_x, avatar_offset_y, name_offset_x, name_offset_y,
  badge_offset_x, badge_offset_y, desc_offset_x, desc_offset_y, song_offset_x,
  song_offset_y, discord_rpc_offset_x, discord_rpc_offset_y, panel_opacity, panel_hidden, created_at,
  discord_id, discord_rpc_enabled, views_blacklisted, widgets
) on users to anon;

create table if not exists assets (
  id bigint primary key generated always as identity,
  user_id bigint references users(id) on delete cascade,
  type text not null check (type in ('background', 'audio', 'audio_1', 'audio_2', 'profile_avatar', 'custom_cursor', 'video_background', 'banner')),
  url text not null,
  created_at timestamptz default now(),
  unique (user_id, type)
);

alter table assets enable row level security;

-- Asset rows are written ONLY by server-side API functions (service role key).
-- anon (browser) may read them (a public biolink shows a user's assets) but not write.
revoke all on assets from anon;
grant select on assets to anon;

drop policy if exists "anon can insert" on assets;
drop policy if exists "anon can update" on assets;
drop policy if exists "anon can delete" on assets;

drop policy if exists "anon can select" on assets;
create policy "anon can select" on assets for select to anon using (true);

-- Discord presence mirror. The discord-bot writes a row per member of the sire.lol Discord guild
-- on every presence change; the public biolink page reads it to render Discord RPC.
create table if not exists discord_presence (
  discord_id text primary key,
  username text,
  global_name text,
  display_name text,
  avatar text,
  public_flags bigint default 0,
  status text default 'offline',
  custom_status text,
  custom_status_emoji text,
  activity_name text,
  updated_at timestamptz default now()
);

alter table discord_presence enable row level security;

-- Add custom_status_emoji on existing databases (create table above only applies to fresh installs).
alter table discord_presence add column if not exists custom_status_emoji text;

-- anon may read presence (public biolink), rows are written only by the bot (service role key).
revoke all on discord_presence from anon;
grant select on discord_presence to anon;

drop policy if exists "anon can select" on discord_presence;
create policy "anon can select" on discord_presence for select to anon using (true);

create table if not exists page_views (
  id bigint primary key generated always as identity,
  user_id bigint references users(id) on delete cascade,
  visitor_id text not null default '',
  viewed_at timestamptz default now()
);
create index if not exists idx_page_views_user_visitor on page_views (user_id, visitor_id);

alter table page_views enable row level security;

-- anon may read views (stats), but views are inserted only via the rate-limited /api/track-view endpoint (service role).
revoke all on page_views from anon;
grant select on page_views to anon;

drop policy if exists "anon can insert" on page_views;

drop policy if exists "anon can select" on page_views;
create policy "anon can select" on page_views for select to anon using (true);

create table if not exists otps (
  email text primary key,
  otp text not null,
  expires_at timestamptz not null
);

alter table otps enable row level security;

-- OTPs are ONLY ever read/written by server-side API functions (service role key).
-- anon has no access at all (no privilege, no policies) so codes can never be sniffed from the browser.
revoke all on otps from anon;
drop policy if exists "anon can insert" on otps;
drop policy if exists "anon can update" on otps;
drop policy if exists "anon can select" on otps;
drop policy if exists "anon can delete" on otps;

drop policy if exists "service role can manage otps" on otps;
create policy "service role can manage otps" on otps for all to service_role using (true);

create table if not exists badges (
  id bigint primary key generated always as identity,
  user_id bigint references users(id) on delete cascade,
  badge text not null,
  created_at timestamptz default now(),
  unique (user_id, badge)
);

alter table badges enable row level security;

-- Badges are written ONLY by server-side API functions (service role key); anon reads them.
revoke all on badges from anon;
grant select on badges to anon;

drop policy if exists "anon can insert" on badges;
drop policy if exists "anon can delete" on badges;

drop policy if exists "anon can select" on badges;
create policy "anon can select" on badges for select to anon using (true);

create table if not exists links (
  id bigint primary key generated always as identity,
  user_id bigint references users(id) on delete cascade,
  platform text not null,
  url text not null,
  created_at timestamptz default now(),
  unique (user_id, platform)
);

alter table links enable row level security;

-- Links are written ONLY by server-side API functions (service role key); anon reads them.
revoke all on links from anon;

drop policy if exists "anon can insert" on links;
drop policy if exists "anon can update" on links;
drop policy if exists "anon can delete" on links;

drop policy if exists "anon can select" on links;
create policy "anon can select" on links for select to anon using (true);

create table if not exists hosted_files (
  id text primary key,
  user_id bigint references users(id) on delete cascade,
  kind text not null default 'media' check (kind in ('media', 'file')),
  filename text,
  content_type text,
  size integer,
  path text not null,
  views bigint default 0,
  created_at timestamptz default now()
);

create index if not exists idx_hosted_files_user on hosted_files (user_id);

alter table hosted_files enable row level security;

-- Hosted files are managed ONLY by server-side API functions (service role key).
-- They are served through the sire.lol/i/<code> (media) and sire.lol/f/<code> (file) endpoints.
revoke all on hosted_files from anon;

drop policy if exists "service role can manage hosted_files" on hosted_files;
create policy "service role can manage hosted_files" on hosted_files for all to service_role using (true);

-- Migrate existing image-host rows into hosted_files as media.
insert into hosted_files (id, user_id, kind, filename, content_type, size, path, views, created_at)
select id, user_id, 'media', filename, content_type, size, path, views, created_at
from hosted_images
on conflict (id) do nothing;

create or replace function get_leaderboard(period_type text)
returns table (user_id bigint, username text, avatar_url text, views bigint)
language sql
as $$
  select
    pv.user_id,
    u.username,
    u.avatar_url,
    count(*)::bigint as views
  from page_views pv
  join users u on u.id = pv.user_id
  where
    u.views_blacklisted = false
    and case
      when period_type = 'month' then pv.viewed_at >= date_trunc('month', now())
      else true
    end
  group by pv.user_id, u.username, u.avatar_url
  order by views desc
  limit 100;
$$;

create table if not exists templates (
  user_id bigint primary key references users(id) on delete cascade,
  created_at timestamptz default now(),
  description text,
  accent_color text,
  text_color text,
  background_color text,
  icon_color text,
  bg_effect_color text,
  primary_color text,
  secondary_color text,
  display_effect text,
  font text,
  bg_effect text,
  entry_text text,
  entry_font text,
  entry_color text,
  entry_effect text,
  desc_effect text,
  desc_effect_speed integer,
  desc_lines json,
  monochrome_icons boolean default false,
  monochrome_badges boolean default false,
  show_username boolean default true,
  panel_mouse_follow boolean default false,
  audio_volume integer default 30,
  audio_autoplay boolean default true,
  audio_loop boolean default true,
  audio_shuffle boolean default false,
  cursor_effect text default 'none',
  avatar_shape text default 'circle',
  avatar_size integer default 96,
  avatar_offset_x integer default 0,
  avatar_offset_y integer default 0,
  name_offset_x integer default 0,
  name_offset_y integer default 0
);

alter table templates enable row level security;

-- Templates are written ONLY by server-side API functions (service role key); anon reads them.
revoke all on templates from anon;
grant select on templates to anon;

drop policy if exists "anon can insert" on templates;
drop policy if exists "anon can update" on templates;
drop policy if exists "anon can delete" on templates;

drop policy if exists "anon can select" on templates;
create policy "anon can select" on templates for select to anon using (true);

create table if not exists ip_registrations (
  ip text not null,
  created_at timestamptz default now(),
  primary key (ip, created_at)
);

create index if not exists idx_ip_registrations_ip on ip_registrations (ip);

alter table ip_registrations enable row level security;

revoke all on ip_registrations from anon;

drop policy if exists "service role can manage ip_registrations" on ip_registrations;
create policy "service role can manage ip_registrations" on ip_registrations for all to service_role using (true);

create table if not exists pending_registrations (
  email text primary key,
  username text not null,
  password_hash text not null,
  ip text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

alter table pending_registrations enable row level security;

revoke all on pending_registrations from anon;

drop policy if exists "service role can manage pending_registrations" on pending_registrations;
create policy "service role can manage pending_registrations" on pending_registrations for all to service_role using (true);
