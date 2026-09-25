import { GetTurso, HasTurso } from "../lib/turso.js";

export default async function handler(req, res) {
  const Name = String(req.query.u || req.query.username || "").trim().toLowerCase();
  if (!Name) { res.status(400).json({ error: "Missing username" }); return; }
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Db = GetTurso();
    const Rs = await Db.execute({ sql: "SELECT id FROM users WHERE username = ? OR alias = ? LIMIT 1", args: [Name, Name] });
    res.status(200).json({ available: !(Rs.rows?.length) });
  } catch (Err) {
    res.status(500).json({ error: "Failed" });
  }
}
