import { motion, type Variants } from "motion/react";
import type { AboutPageConfig } from "../lib/widgets";
import DiscordRPC from "./DiscordRPC";
import DiscordServerCard from "./DiscordServerCard";
import RobloxCard from "./RobloxCard";
import LastfmCard from "./LastfmCard";
import ClockWidget from "./ClockWidget";
import TagIcon from "./TagIcon";

const dropContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.3, delayChildren: 0.05 } },
};
const dropItem: Variants = {
  hidden: { opacity: 0, y: -28 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 22 } },
};

const dropInView = { once: false, amount: 0.1 } as const;

export default function AboutPage({
  config,
  discordId,
  discordEnabled,
  instant = false,
}: {
  config: AboutPageConfig;
  discordId?: string | null;
  discordEnabled?: boolean;
  instant?: boolean;
}) {
  const showDiscord = !!discordEnabled && !!discordId;
  const tags = (config.tags || []).slice(0, 6);
  const showTags = tags.length > 0;
  const showServer = !!config.discordServer?.inviteCode;
  const showLastfm = !!config.lastfm?.username;
  const showRoblox = !!config.roblox?.username;
  const showRpc = showDiscord;
  const showClock = !!config.clock;
  const hasWidgets = showRpc || showLastfm || showClock || showServer || showRoblox;
  const scrollAnim = instant ? {} : { whileInView: "show" as const, viewport: dropInView };
  return (
    <motion.div
      variants={dropContainer}
      initial={instant ? "show" : "hidden"}
      animate={instant ? "show" : undefined}
      {...scrollAnim}
      className="m-auto flex flex-col items-start gap-7 text-left w-full max-w-4xl"
    >
      <motion.div variants={dropItem}>
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "var(--text-color, #ffffff)" }}>
          {config.title || "About me"}
        </h2>
      </motion.div>
      {config.description ? (
        <motion.div variants={dropItem} className="w-full">
          <div className="glass-card w-full rounded-3xl px-9 py-8">
            <p className="text-lg leading-relaxed sm:text-xl whitespace-pre-wrap" style={{ color: "var(--text-color, #ffffff)", opacity: 0.85 }}>
              {config.description}
            </p>
          </div>
        </motion.div>
      ) : null}
      {hasWidgets && (
        <motion.div variants={dropContainer} className="w-full columns-1 gap-5 sm:columns-2">
          {showRpc && (
            <motion.div variants={dropItem} className="mb-5 break-inside-avoid">
              <DiscordRPC discordId={discordId!} wide />
            </motion.div>
          )}
          {showLastfm && (
            <motion.div variants={dropItem} className="mb-5 break-inside-avoid">
              <LastfmCard config={config.lastfm!} instant={instant} />
            </motion.div>
          )}
          {showClock && (
            <motion.div variants={dropItem} className="mb-5 break-inside-avoid">
              <ClockWidget widget={config.clock!} />
            </motion.div>
          )}
          {showServer && (
            <motion.div variants={dropItem} className="mb-5 break-inside-avoid">
              <DiscordServerCard config={config.discordServer!} instant={instant} />
            </motion.div>
          )}
          {showRoblox && (
            <motion.div variants={dropItem} className="mb-5 break-inside-avoid">
              <RobloxCard config={config.roblox!} instant={instant} />
            </motion.div>
          )}
        </motion.div>
      )}
      {showTags && (
        <motion.div variants={dropItem} className="w-full">
          <TagsCard tags={tags} />
        </motion.div>
      )}
    </motion.div>
  );
}

function TagsCard({ tags }: { tags: string[] }) {
  return (
    <motion.div variants={dropContainer} className="w-full flex flex-wrap gap-2.5">
      {tags.map((t) => (
        <motion.span
          key={t}
          variants={dropItem}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm"
        >
          <TagIcon tag={t} size={13} />
          {t}
        </motion.span>
      ))}
    </motion.div>
  );
}
