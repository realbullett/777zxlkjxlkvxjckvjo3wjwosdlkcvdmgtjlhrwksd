PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  discord_id TEXT,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  alias TEXT,
  display_name TEXT,
  description TEXT,
  accent_color TEXT DEFAULT '#1b1b1b',
  text_color TEXT DEFAULT '#ffffff',
  background_color TEXT DEFAULT '#080808',
  icon_color TEXT DEFAULT '#ffffff',
  bg_effect_color TEXT DEFAULT '#ffffff',
  primary_color TEXT DEFAULT '#edddf0',
  secondary_color TEXT DEFAULT '#a855f7',
  show_username INTEGER DEFAULT 1,
  display_effect TEXT DEFAULT 'none',
  font TEXT DEFAULT 'Inter',
  video_audio INTEGER DEFAULT 0,
  bg_effect TEXT DEFAULT 'none',
  song_platform TEXT,
  song_id TEXT,
  entry_text TEXT DEFAULT 'click anywhere to enter',
  entry_font TEXT DEFAULT 'Inter',
  entry_color TEXT DEFAULT 'rgba(255,255,255,0.5)',
  entry_effect TEXT DEFAULT 'none',
  desc_effect TEXT DEFAULT 'none',
  desc_effect_speed INTEGER DEFAULT 50,
  desc_lines TEXT DEFAULT '[]',
  monochrome_icons INTEGER DEFAULT 0,
  monochrome_badges INTEGER DEFAULT 0,
  banner_enabled INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_image TEXT,
  seo_favicon TEXT,
  panel_mouse_follow INTEGER DEFAULT 0,
  audio_volume INTEGER DEFAULT 30,
  audio_autoplay INTEGER DEFAULT 1,
  audio_loop INTEGER DEFAULT 1,
  audio_shuffle INTEGER DEFAULT 0,
  cursor_effect TEXT DEFAULT 'none',
  password_hash TEXT,
  email_verified INTEGER DEFAULT 0,
  avatar_shape TEXT DEFAULT 'circle',
  avatar_size INTEGER DEFAULT 96,
  avatar_offset_x INTEGER DEFAULT 0,
  avatar_offset_y INTEGER DEFAULT 0,
  name_offset_x INTEGER DEFAULT 0,
  name_offset_y INTEGER DEFAULT 0,
  badge_offset_x INTEGER DEFAULT 0,
  badge_offset_y INTEGER DEFAULT 0,
  desc_offset_x INTEGER DEFAULT 0,
  desc_offset_y INTEGER DEFAULT 0,
  song_offset_x INTEGER DEFAULT 0,
  song_offset_y INTEGER DEFAULT 0,
  discord_rpc_offset_x INTEGER DEFAULT 0,
  discord_rpc_offset_y INTEGER DEFAULT 0,
  discord_rpc_enabled INTEGER DEFAULT 0,
  panel_opacity INTEGER DEFAULT 0,
  panel_hidden INTEGER DEFAULT 0,
  widgets TEXT DEFAULT '[]',
  views_blacklisted INTEGER NOT NULL DEFAULT 0,
  onboarding_done INTEGER NOT NULL DEFAULT 0,
  use_case TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (provider, provider_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_alias_unique ON users (alias) WHERE alias IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_discord_id_unique ON users (discord_id) WHERE discord_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS templates (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  description TEXT,
  accent_color TEXT,
  text_color TEXT,
  background_color TEXT,
  icon_color TEXT,
  bg_effect_color TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  display_effect TEXT,
  font TEXT,
  bg_effect TEXT,
  entry_text TEXT,
  entry_font TEXT,
  entry_color TEXT,
  entry_effect TEXT,
  desc_effect TEXT,
  desc_effect_speed INTEGER,
  desc_lines TEXT,
  monochrome_icons INTEGER DEFAULT 0,
  monochrome_badges INTEGER DEFAULT 0,
  show_username INTEGER DEFAULT 1,
  panel_mouse_follow INTEGER DEFAULT 0,
  audio_volume INTEGER DEFAULT 30,
  audio_autoplay INTEGER DEFAULT 1,
  audio_loop INTEGER DEFAULT 1,
  audio_shuffle INTEGER DEFAULT 0,
  cursor_effect TEXT DEFAULT 'none',
  avatar_shape TEXT DEFAULT 'circle',
  avatar_size INTEGER DEFAULT 96,
  avatar_offset_x INTEGER DEFAULT 0,
  avatar_offset_y INTEGER DEFAULT 0,
  name_offset_x INTEGER DEFAULT 0,
  name_offset_y INTEGER DEFAULT 0,
  badge_offset_x INTEGER DEFAULT 0,
  badge_offset_y INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, platform)
);
CREATE INDEX IF NOT EXISTS idx_links_user ON links (user_id);

CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, badge)
);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges (user_id);

CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '',
  viewed_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_page_views_user_visitor ON page_views (user_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_time ON page_views (user_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_user_ip ON page_views (user_id, ip_hash, viewed_at);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, type)
);

CREATE TABLE IF NOT EXISTS hosted_files (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'media',
  filename TEXT,
  content_type TEXT,
  size INTEGER,
  path TEXT NOT NULL DEFAULT '',
  content BLOB,
  views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_hosted_files_user ON hosted_files (user_id);

CREATE TABLE IF NOT EXISTS upload_chunks (
  upload_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  idx INTEGER NOT NULL,
  data BLOB,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (upload_id, idx)
);

CREATE TABLE IF NOT EXISTS template_installs (
  user_id INTEGER,
  template_user_id INTEGER,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (user_id, template_user_id)
);
CREATE TABLE IF NOT EXISTS template_favorites (
  user_id INTEGER,
  template_user_id INTEGER,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (user_id, template_user_id)
);

CREATE TABLE IF NOT EXISTS otps (
  email TEXT PRIMARY KEY,
  otp TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_registrations (
  email TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  ip TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ip_registrations (
  ip TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (ip, created_at)
);

CREATE TABLE IF NOT EXISTS discord_presence (
  discord_id TEXT PRIMARY KEY,
  username TEXT,
  global_name TEXT,
  display_name TEXT,
  avatar TEXT,
  public_flags INTEGER DEFAULT 0,
  status TEXT DEFAULT 'offline',
  custom_status TEXT,
  custom_status_emoji TEXT,
  activity_name TEXT,
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
