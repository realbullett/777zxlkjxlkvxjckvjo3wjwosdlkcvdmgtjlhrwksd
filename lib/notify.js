import { GetTurso } from "./turso.js";

const SIGNUP_WEBHOOK_URL = process.env.SIGNUP_WEBHOOK_URL || "";
const ADMINLOG_WEBHOOK_URL = process.env.ADMINLOG_WEBHOOK_URL || "";
const APP_URL = process.env.APP_URL || "https://sire.lol";

async function PostWebhook(Url, Payload) {
  if (!Url) return;
  const Ctrl = new AbortController();
  const Timer = setTimeout(() => Ctrl.abort(), 8000);
  try {
    await fetch(Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Payload),
      signal: Ctrl.signal,
    });
  } catch (Err) {
    console.error("webhook post failed:", Err?.message || Err);
  } finally {
    clearTimeout(Timer);
  }
}

function DiscordTs(DateObj) {
  return `<t:${Math.floor(DateObj.getTime() / 1000)}:F>`;
}

export async function NotifySignup({ Uid, Username, Provider }) {
  if (!SIGNUP_WEBHOOK_URL) return;
  const Now = new Date();
  const Name = String(Username || "unknown");
  await PostWebhook(SIGNUP_WEBHOOK_URL, {
    embeds: [{
      title: "New user registered",
      color: 0x3b82f6,
      fields: [
        { name: "Username", value: Name, inline: true },
        { name: "UID", value: String(Uid), inline: true },
        { name: "Provider", value: String(Provider || "unknown"), inline: true },
        { name: "Profile", value: `[sire.lol/${Name}](https://sire.lol/${encodeURIComponent(Name)})` },
        { name: "Time", value: DiscordTs(Now) },
      ],
    }],
  });
}

export async function NotifyAdminLog({ AdminId, Action, TargetUid, Detail }) {
  if (!ADMINLOG_WEBHOOK_URL) return;
  let AdminName = `#${AdminId}`;
  let TargetName = TargetUid ? `#${TargetUid}` : "—";
  try {
    const Db = GetTurso();
    if (Db) {
      const A = await Db.execute({ sql: "SELECT username FROM users WHERE id = ? LIMIT 1", args: [AdminId] });
      if (A.rows?.[0]?.username) AdminName = `${A.rows[0].username} (#${AdminId})`;
      if (TargetUid) {
        const T = await Db.execute({ sql: "SELECT username FROM users WHERE id = ? LIMIT 1", args: [TargetUid] });
        if (T.rows?.[0]?.username) TargetName = `${T.rows[0].username} (#${TargetUid})`;
      }
    }
  } catch {}
  const Fields = [
    { name: "Admin", value: AdminName, inline: true },
    { name: "Action", value: String(Action), inline: true },
    { name: "Target", value: TargetName, inline: true },
  ];
  if (Detail) Fields.push({ name: "Detail", value: String(Detail).slice(0, 1000) });
  Fields.push({ name: "Time", value: DiscordTs(new Date()) });
  await PostWebhook(ADMINLOG_WEBHOOK_URL, {
    embeds: [{ title: "Admin action", color: 0xf59e0b, fields: Fields }],
  });
}

export { APP_URL };
