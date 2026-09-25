import "dotenv/config";
import express from "express";

import meHandler from "./api/me.js";
import authHandler from "./api/auth.js";
import trackViewHandler from "./api/track-view.js";
import profileHandler from "./api/profile.js";
import leaderboardHandler from "./api/leaderboard.js";
import presenceHandler from "./api/presence.js";
import statsHandler from "./api/stats.js";
import checkUsernameHandler from "./api/check-username.js";
import adminUserHandler from "./api/admin-user.js";
import templatesHandler from "./api/templates.js";

const app = express();

app.use(express.json({ limit: "40mb" }));

app.get("/api/auth/discord", (Req, Res) => authHandler(Req, Res, "discord"));
app.get("/api/auth/discord/callback", (Req, Res) => authHandler(Req, Res, "discord-callback"));
app.get("/api/auth/google", (Req, Res) => authHandler(Req, Res, "google"));
app.get("/api/auth/google/callback", (Req, Res) => authHandler(Req, Res, "google-callback"));
app.get("/api/auth/verify", (Req, Res) => authHandler(Req, Res, "verify"));
app.get("/api/auth/logout", (Req, Res) => authHandler(Req, Res, "logout"));
app.post("/api/auth/login", (Req, Res) => authHandler(Req, Res, "login"));
app.post("/api/auth/register", (Req, Res) => authHandler(Req, Res, "register"));
app.post("/api/auth/verify-otp", (Req, Res) => authHandler(Req, Res, "verify-otp"));
app.post("/api/auth/resend-otp", (Req, Res) => authHandler(Req, Res, "resend-otp"));
app.get("/api/me", meHandler);
app.post("/api/me", meHandler);
app.delete("/api/me", meHandler);
app.post("/api/track-view", trackViewHandler);
app.get("/api/profile", profileHandler);
app.get("/api/leaderboard", leaderboardHandler);
app.get("/api/presence", presenceHandler);
app.get("/api/stats", statsHandler);
app.get("/api/check-username", checkUsernameHandler);
app.get("/api/admin-user", adminUserHandler);
app.get("/api/templates", templatesHandler);
app.get("/api/og", meHandler);
app.get("/i/:code", meHandler);
app.get("/f/:code", meHandler);
app.get("/a/:path(*)", meHandler);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
