import { createClient } from "@libsql/client";

let CachedClient = null;

export function GetTurso() {
  const Url = process.env.TURSO_DATABASE_URL;
  const Token = process.env.TURSO_AUTH_TOKEN;
  if (!Url || !Token) return null;
  if (!CachedClient) CachedClient = createClient({ url: Url, authToken: Token });
  return CachedClient;
}

export function HasTurso() {
  return !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

export const PublicProfileCols = [
  "id", "username", "alias", "display_name", "avatar_url", "description",
  "accent_color", "text_color", "background_color", "icon_color", "bg_effect_color",
  "primary_color", "secondary_color", "show_username", "display_effect", "font",
  "video_audio", "bg_effect", "song_platform", "song_id", "entry_text", "entry_font",
  "entry_color", "entry_effect", "desc_effect", "desc_effect_speed", "desc_lines",
  "monochrome_icons", "monochrome_badges", "banner_enabled", "seo_title",
  "seo_description", "seo_image", "seo_favicon", "panel_mouse_follow", "audio_volume",
  "audio_autoplay", "audio_loop", "audio_shuffle", "cursor_effect", "avatar_shape",
  "avatar_size", "avatar_offset_x", "avatar_offset_y", "name_offset_x", "name_offset_y",
  "badge_offset_x", "badge_offset_y", "desc_offset_x", "desc_offset_y", "song_offset_x",
  "song_offset_y", "discord_rpc_offset_x", "discord_rpc_offset_y", "panel_opacity",
  "panel_hidden", "discord_id", "discord_rpc_enabled", "views_blacklisted", "widgets"
].join(",");
