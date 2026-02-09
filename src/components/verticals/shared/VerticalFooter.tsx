/**
 * SHARED VERTICAL FOOTER
 * ======================
 * Footer with brand name, links, and copyright.
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React from 'react';
import type { VerticalConfig } from '@/config/verticalConfig';
import merlinImage from '@/assets/images/new_profile_merlin.png';

interface VerticalFooterProps {
  config: VerticalConfig;
}

export function VerticalFooter({ config }: VerticalFooterProps) {
  const { brandName, theme } = config;

  return (
    <footer className="bg-black/30 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
            <div>
              <p className="text-white font-bold">{brandName}</p>
              <p className={`text-${theme.accent}-200/50 text-sm`}>Powered by Merlin Energy</p>
            </div>
          </div>
          <div className={`flex items-center gap-6 text-${theme.accent}-200/70 text-sm`}>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <div className={`mt-8 pt-8 border-t border-white/10 text-center text-${theme.accent}-200/50 text-sm`}>
          © {new Date().getFullYear()} {brandName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
