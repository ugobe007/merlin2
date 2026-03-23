/* Merlin Energy — Homepage
   Design: Cosmic Blueprint — dark navy, Space Grotesk, blue-cyan accents
   Sections: Navbar → Hero → Stats → Products → Platform → Industries → Workflow → Value → Footer */

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductsSection from "@/components/ProductsSection";
import PlatformSection from "@/components/PlatformSection";
import IndustriesSection from "@/components/IndustriesSection";
import WorkflowSection from "@/components/WorkflowSection";
import ValueSection from "@/components/ValueSection";

const WIZARD_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/merlin-wizard_11d2b1f0.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#060D1F]">
      <Navbar />
      <HeroSection />
      <ProductsSection />
      <PlatformSection />
      <IndustriesSection />
      <WorkflowSection />
      <ValueSection />
      
      {/* Footer */}
      <footer className="bg-[#060D1F] border-t border-white/[0.05] py-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
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
              <a
                href="#products"
                className="hover:text-slate-400 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Products
              </a>
              <a
                href="#industries"
                className="hover:text-slate-400 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Industries
              </a>
              <a
                href="#workflow"
                className="hover:text-slate-400 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                How It Works
              </a>
              <a
                href="#platform"
                className="hover:text-slate-400 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Platform
              </a>
              <a
                href="#"
                className="hover:text-slate-400 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Privacy
              </a>
              <a
                href="#"
                className="hover:text-slate-400 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Terms
              </a>
            </div>

            {/* Copyright */}
            <div className="text-slate-700 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              © {new Date().getFullYear()} Merlin Energy. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
