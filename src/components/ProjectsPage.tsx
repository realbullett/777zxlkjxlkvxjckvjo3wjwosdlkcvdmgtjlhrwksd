import type { ProjectsPageConfig } from "../lib/widgets";

export default function ProjectsPage({ config }: { config: ProjectsPageConfig }) {
  const projects = (config.projects || []).filter((p) => p.banner || p.name || p.description);
  return (
    <div className="flex flex-col items-start gap-7 w-full max-w-3xl">
      <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "var(--text-color, #ffffff)" }}>
        My Projects
      </h2>
      {projects.length === 0 ? (
        <p className="text-sm text-white/40 italic">add a project banner in your dashboard to show it here.</p>
      ) : (
        <div className="allow-scroll hide-scrollbar flex w-full max-h-[calc(100vh-10rem)] flex-col gap-6 overflow-y-auto pr-1">
          {projects.map((pr, i) => (
            <div
              key={i}
              className="relative w-full shrink-0 overflow-hidden rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]"
            >
              {pr.banner ? (
                <img src={pr.banner} alt={pr.name || `project ${i + 1}`} className="h-72 w-full object-cover sm:h-80" />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-white/[0.03] sm:h-52">
                  <span className="text-sm text-white/25">{pr.name || `project ${i + 1}`}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8 pt-24 text-left">
                <p className="text-3xl font-black text-white sm:text-4xl" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
                  {pr.name || `Project ${i + 1}`}
                </p>
                {pr.description && (
                  <p className="mt-2 text-base text-white/60 leading-relaxed max-w-xl">{pr.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
