import { motion, type Variants } from "motion/react";
import type { AboutPageConfig } from "../lib/widgets";
import DiscordRPC from "./DiscordRPC";
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
}: {
  config: AboutPageConfig;
  discordId?: string | null;
  discordEnabled?: boolean;
}) {
  const showDiscord = !!discordEnabled && !!discordId;
  const tags = (config.tags || []).slice(0, 6);
  const hasRow = showDiscord || !!config.clock;
  const showTags = tags.length > 0;
  return (
    <motion.div
      variants={dropContainer}
      initial="hidden"
      whileInView="show"
      viewport={dropInView}
      className="flex flex-col items-start gap-7 text-left w-full max-w-4xl"
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
      {hasRow && (
        <motion.div variants={dropItem} className="w-full">
          <div className="grid w-full grid-cols-1 sm:grid-cols-2 items-stretch gap-5">
            <div className="flex w-full flex-col gap-5">
              {showDiscord && (
                <DiscordRPC discordId={discordId!} wide />
              )}
              {showTags && <TagsCard tags={tags} />}
            </div>
            {config.clock && (
              <div className="w-full">
                <ClockWidget widget={config.clock} />
              </div>
            )}
          </div>
        </motion.div>
      )}
      {!hasRow && showTags && (
        <motion.div variants={dropItem} className="w-full">
          <TagsCard tags={tags} />
        </motion.div>
      )}
    </motion.div>
  );
}

function TagsCard({ tags }: { tags: string[] }) {
  return (
    <div className="w-full flex flex-wrap gap-2.5">
      {tags.map((t) => (
        <span
          key={t}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm"
        >
          <TagIcon tag={t} size={13} />
          {t}
        </span>
      ))}
    </div>
  );
}
