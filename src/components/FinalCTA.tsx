/* Merlin Energy — Final CTA + Footer
   Design: Left-aligned CTA with large decorative "01" background number
   Minimal footer with brand mark */

const WIZARD_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/merlin-wizard_11d2b1f0.png";

export default function FinalCTA() {
  return (
    <>
      {/* Final CTA */}
      <section className="relative py-32 overflow-hidden bg-[#080F22]">
        {/* Radial glow */}
        <div className="absolute inset-0 hero-glow opacity-50" />

        {/* Decorative large "01" */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[240px] lg:text-[320px] font-extrabold text-white/[0.025] select-none pointer-events-none leading-none pr-8"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          01
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium tracking-wide mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Ready to start?
            </div>

            <h2
              className="text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Ready to see
              <br />
              your project's
              <br />
              <span className="gradient-text">true potential?</span>
            </h2>

            <p className="text-slate-400 text-lg mb-10 max-w-md leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Get started in minutes. No setup, no commitment — just answers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#"
                className="btn-glow px-8 py-4 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 text-center"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Start a TrueQuote →
              </a>
              <a
                href="#"
                className="px-8 py-4 rounded-xl text-base font-semibold text-slate-300 border border-white/15 hover:border-white/30 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 text-center"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Start a ProQuote →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#060D1F] border-t border-white/[0.05] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <img src={WIZARD_URL} alt="Merlin" className="w-8 h-8 rounded-full object-contain" />
              <div>
                <div
                  className="text-white font-bold text-base"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Merlin Energy
                </div>
                <div className="text-slate-600 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Energy decision platform
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
              {["Products", "Industries", "How It Works", "Platform", "Privacy", "Terms"].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="hover:text-slate-400 transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div className="text-slate-700 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              © {new Date().getFullYear()} Merlin Energy. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
