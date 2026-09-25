import LoginHandler from "../lib/auth/login.js";
import RegisterHandler from "../lib/auth/register.js";
import VerifyOtpHandler from "../lib/auth/verify-otp.js";
import ResendOtpHandler from "../lib/auth/resend-otp.js";
import LogoutHandler from "../lib/auth/logout.js";
import VerifyHandler from "../lib/auth/verify/index.js";
import DiscordHandler from "../lib/auth/discord.js";
import DiscordCallbackHandler from "../lib/auth/discord/callback.js";
import GoogleHandler from "../lib/auth/google.js";
import GoogleCallbackHandler from "../lib/auth/google/callback.js";

const Ops = {
  "login": LoginHandler,
  "register": RegisterHandler,
  "verify-otp": VerifyOtpHandler,
  "resend-otp": ResendOtpHandler,
  "logout": LogoutHandler,
  "verify": VerifyHandler,
  "discord": DiscordHandler,
  "discord-callback": DiscordCallbackHandler,
  "google": GoogleHandler,
  "google-callback": GoogleCallbackHandler,
};

export default function handler(req, res, OpOverride) {
  const Op = OpOverride || req.query?.op || "";
  const Fn = Ops[Op];
  if (!Fn) { res.status(404).json({ error: "unknown auth op" }); return; }
  return Fn(req, res);
}
