import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen bg-black">
      <SEO title="sire.lol — privacy policy" description="privacy policy for sire.lol — how we handle your data." path="/privacy" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
      <div className="relative px-6 py-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => navigate("/")} className="hover:opacity-70 transition-opacity">
            <img src="/logo.png" alt="sire.lol" className="h-7 w-auto" />
          </button>
          <button onClick={() => navigate(-1)} className="text-sm text-white/40 hover:text-white/70 transition-colors">
            go back
          </button>
        </div>
        <div className="glass-card rounded-2xl p-8 md:p-12 border border-white/10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-white/30 mb-10">Last updated: July 2026</p>

          <div className="space-y-8 text-sm text-white/60 leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-white mb-3">Information We Collect</h2>
              <p>We collect information you provide directly to us when you create an account, including your email address, username, and any profile content you upload such as images, videos, and descriptions.</p>
              <p className="mt-2">When you sign in through Discord or Google, we receive your name, email address, and avatar from that provider. This information is used solely to create and maintain your account.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">How We Use Your Information</h2>
              <p>Your information is used to operate and maintain the sire.lol platform, including displaying your profile page, tracking page views, and providing analytics. We do not sell your personal information to third parties.</p>
              <p className="mt-2">Page view data is collected anonymously using a visitor identifier stored in your browser. This helps us provide view counts and analytics without exposing personal identities.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Data Storage and Security</h2>
              <p>Your data is stored securely using Supabase, a hosted database service. We implement industry standard security measures including encrypted connections and secure authentication tokens.</p>
              <p className="mt-2">You can delete your account and associated data at any time by contacting us through our Discord server. Upon deletion, all your profile data, links, uploaded assets, and page views will be permanently removed.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Cookies</h2>
              <p>We use essential cookies for authentication purposes. These are required to keep you logged in and secure. We do not use tracking cookies or third party analytics cookies.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Third Party Services</h2>
              <p>We use Supabase for database and storage, Discord and Google for authentication, and Vercel for hosting. Each service has its own privacy policy governing how they handle data.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of sire.lol after changes constitutes acceptance of the updated policy.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Contact</h2>
              <p>If you have questions about this Privacy Policy, please reach out to us on our Discord server.</p>
              <a href="https://discord.gg/npN6H47KEn" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-blue-400 hover:text-blue-300 transition-colors">
                discord.gg/npN6H47KEn
              </a>
            </section>
          </div>
        </div>
        <footer className="mt-10 text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/10">&copy; 2026 sire.lol refined identity</p>
        </footer>
      </div>
    </div>
  );
}
