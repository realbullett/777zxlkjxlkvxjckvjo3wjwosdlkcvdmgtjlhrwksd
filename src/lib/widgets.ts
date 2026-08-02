export type ClockWidgetConfig = {
  id: string;
  type: "clock";
  label: string;
  timeZone: string;
  mouseFollow?: boolean;
};

export type WidgetConfig = ClockWidgetConfig;

export type TimezonePreset = {
  tz: string;
  label: string;
  offset: number;
};

export const TIMEZONE_PRESETS: TimezonePreset[] = [
  { tz: "Etc/GMT+12", label: "Baker Island", offset: -12 },
  { tz: "Pacific/Pago_Pago", label: "American Samoa", offset: -11 },
  { tz: "Pacific/Honolulu", label: "Honolulu", offset: -10 },
  { tz: "America/Anchorage", label: "Anchorage", offset: -9 },
  { tz: "America/Los_Angeles", label: "Los Angeles", offset: -8 },
  { tz: "America/Denver", label: "Denver", offset: -7 },
  { tz: "America/Chicago", label: "Chicago", offset: -6 },
  { tz: "America/New_York", label: "New York", offset: -5 },
  { tz: "America/Halifax", label: "Halifax", offset: -4 },
  { tz: "America/Sao_Paulo", label: "São Paulo", offset: -3 },
  { tz: "Atlantic/South_Georgia", label: "South Georgia", offset: -2 },
  { tz: "Atlantic/Azores", label: "Azores", offset: -1 },
  { tz: "Europe/London", label: "London", offset: 0 },
  { tz: "Europe/Paris", label: "Paris", offset: 1 },
  { tz: "Europe/Helsinki", label: "Helsinki", offset: 2 },
  { tz: "Europe/Istanbul", label: "Istanbul", offset: 3 },
  { tz: "Europe/Moscow", label: "Moscow", offset: 3 },
  { tz: "Asia/Dubai", label: "Dubai", offset: 4 },
  { tz: "Asia/Kabul", label: "Kabul", offset: 4.5 },
  { tz: "Asia/Karachi", label: "Karachi", offset: 5 },
  { tz: "Asia/Kolkata", label: "Kolkata", offset: 5.5 },
  { tz: "Asia/Kathmandu", label: "Kathmandu", offset: 5.75 },
  { tz: "Asia/Dhaka", label: "Dhaka", offset: 6 },
  { tz: "Asia/Yangon", label: "Yangon", offset: 6.5 },
  { tz: "Asia/Bangkok", label: "Bangkok", offset: 7 },
  { tz: "Asia/Singapore", label: "Singapore", offset: 8 },
  { tz: "Australia/Perth", label: "Perth", offset: 8 },
  { tz: "Asia/Tokyo", label: "Tokyo", offset: 9 },
  { tz: "Australia/Adelaide", label: "Adelaide", offset: 9.5 },
  { tz: "Australia/Sydney", label: "Sydney", offset: 10 },
  { tz: "Pacific/Noumea", label: "New Caledonia", offset: 11 },
  { tz: "Pacific/Auckland", label: "Auckland", offset: 12 },
  { tz: "Pacific/Tongatapu", label: "Tonga", offset: 13 },
  { tz: "Pacific/Kiritimati", label: "Kiribati", offset: 14 },
];

export const widgetId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const browserTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export const defaultLabel = (timeZone: string): string => {
  const parts = timeZone.split("/");
  const last = parts[parts.length - 1] || timeZone;
  return last.replace(/_/g, " ");
};

export const tzOffsetHours = (timeZone: string, now = new Date()): number => {
  try {
    const val =
      new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
        .formatToParts(now)
        .find((p) => p.type === "timeZoneName")?.value || "";
    const m = val.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (m) {
      const sign = m[1] === "-" ? -1 : 1;
      const h = parseInt(m[2], 10);
      const min = m[3] ? parseInt(m[3], 10) : 0;
      return sign * (h + min / 60);
    }
  } catch {}
  return 0;
};

export const gmtLabel = (timeZone: string, now = new Date()): string => {
  const off = tzOffsetHours(timeZone, now);
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return m === 0 ? `GMT${sign}${h}` : `GMT${sign}${h}:${String(m).padStart(2, "0")}`;
};

export const clockParts = (timeZone: string, now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => {
    const n = Number(parts.find((p) => p.type === type)?.value || 0);
    return n === 24 ? 0 : n;
  };
  return { hours: get("hour"), minutes: get("minute"), seconds: get("second") };
};

export const timeLabel = (timeZone: string, now = new Date()): string => {
  const { hours, minutes, seconds } = clockParts(timeZone, now);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const dateLabel = (timeZone: string, now = new Date()): string =>
  new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "2-digit" }).format(now);

export const timezoneForLongitude = (longitude: number): string => {
  const target = longitude / 15;
  let best = "UTC";
  let bestDiff = Infinity;
  for (const p of TIMEZONE_PRESETS) {
    const off = tzOffsetHours(p.tz);
    const diff = Math.abs(off - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p.tz;
    }
  }
  return best;
};

export const findMyTimeZone = (): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(timezoneForLongitude(pos.coords.longitude)),
      () => reject(new Error("Couldn't detect your location. Check your browser's location permission.")),
      { timeout: 8000, maximumAge: 60000 }
    );
  });
