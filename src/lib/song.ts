export type SongPlatform = "youtube" | "spotify";

export type SongInfo = {
  platform: SongPlatform;
  id: string;
  embedUrl: string;
};

const YT_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const SPOTIFY_REGEX = /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;

export function parseSongUrl(url: string): SongInfo | null {
  const yt = url.match(YT_REGEX);
  if (yt) {
    const id = yt[1];
    return { platform: "youtube", id, embedUrl: `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=0&controls=0&origin=${encodeURIComponent(location.origin)}` };
  }
  const sp = url.match(SPOTIFY_REGEX);
  if (sp) {
    const id = sp[1];
    return { platform: "spotify", id, embedUrl: `https://open.spotify.com/embed/track/${id}` };
  }
  return null;
}
