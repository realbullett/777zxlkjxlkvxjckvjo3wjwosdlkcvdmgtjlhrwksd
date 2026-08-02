import "dotenv/config";
import express from "express";

import meHandler from "./api/me.js";
import loginHandler from "./api/auth/login.js";
import registerHandler from "./api/auth/register.js";
import verifyOtpHandler from "./api/auth/verify-otp.js";
import resendOtpHandler from "./api/auth/resend-otp.js";
import logoutHandler from "./api/auth/logout.js";
import verifyHandler from "./api/auth/verify/index.js";
import discordHandler from "./api/auth/discord.js";
import discordCallbackHandler from "./api/auth/discord/callback.js";
import googleHandler from "./api/auth/google.js";
import googleCallbackHandler from "./api/auth/google/callback.js";
import trackViewHandler from "./api/track-view.js";

const app = express();

app.use(express.json({ limit: "2mb" }));

app.get("/api/auth/discord", discordHandler);
app.get("/api/auth/discord/callback", discordCallbackHandler);
app.get("/api/auth/google", googleHandler);
app.get("/api/auth/google/callback", googleCallbackHandler);
app.get("/api/auth/verify", verifyHandler);
app.get("/api/auth/logout", logoutHandler);
app.post("/api/auth/login", loginHandler);
app.post("/api/auth/register", registerHandler);
app.post("/api/auth/verify-otp", verifyOtpHandler);
app.post("/api/auth/resend-otp", resendOtpHandler);
app.get("/api/me", meHandler);
app.post("/api/me", meHandler);
app.delete("/api/me", meHandler);
app.post("/api/track-view", trackViewHandler);
app.get("/api/og", meHandler);
app.get("/i/:code", meHandler);
app.get("/f/:code", meHandler);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
