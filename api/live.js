import { GetTurso, HasTurso } from "../lib/turso.js";

export default async function handler(req, res) {
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  const Uid = Number(req.query.uid);
  if (!Uid) { res.status(400).json({ error: "missing uid" }); return; }
  try {
    const Rs = await GetTurso().execute({ sql: "SELECT updated_at FROM users WHERE id = ?", args: [Uid] });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ rev: String(Rs.rows?.[0]?.updated_at || "") });
  } catch {
    res.status(500).json({ error: "rev check failed" });
  }
}
