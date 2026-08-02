import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen bg-black">
      <SEO title="sire.lol — terms of service" description="terms of service for sire.lol — rules and guidelines." path="/terms" />
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
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-white/30 mb-10">Last updated: July 2026</p>

          <div className="space-y-8 text-sm text-white/60 leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-white mb-3">Acceptance of Terms</h2>
              <p>By accessing or using sire.lol, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the service.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Account Registration</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account.</p>
              <p className="mt-2">You may not create multiple accounts for abusive purposes, impersonate others, or use the service for any illegal or unauthorized activity.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">User Content</h2>
              <p>You retain ownership of all content you upload to sire.lol, including images, videos, text, and links. By uploading content, you grant sire.lol a worldwide, nonexclusive license to display and distribute your content on the platform.</p>
              <p className="mt-2">You represent and warrant that your content does not violate any third party rights or applicable laws. We reserve the right to remove any content that violates these terms.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Prohibited Conduct</h2>
              <p>You agree not to use sire.lol for any unlawful purpose or in violation of any applicable laws. Prohibited activities include uploading malicious code, engaging in spam, harvesting user data, and distributing harmful or misleading content.</p>
              <p className="mt-2">We reserve the right to suspend or terminate accounts engaged in prohibited conduct without prior notice.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Service Availability</h2>
              <p>We strive to provide reliable service but do not guarantee uninterrupted availability. sire.lol may be temporarily unavailable for maintenance, updates, or due to factors beyond our control.</p>
              <p className="mt-2">We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Limitation of Liability</h2>
              <p>sire.lol and its operators are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the service. This includes loss of data, revenue, or business opportunities.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Changes to Terms</h2>
              <p>We may revise these terms at any time. Continued use of the service after changes are posted constitutes acceptance of the new terms. We will notify users of material changes through the platform or via email.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white mb-3">Contact</h2>
              <p>For questions about these terms, please reach out on our Discord server.</p>
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
