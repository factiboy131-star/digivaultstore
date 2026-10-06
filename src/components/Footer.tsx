import React from 'react';
import { ShieldCheck, Lock, PhoneCall, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { SiteSettings } from '../types';

interface FooterProps {
  settings: SiteSettings | null;
  onOpenAdmin: () => void;
  onOpenTracking: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenAdmin, onOpenTracking }) => {
  const storeName = settings?.general.store_name || 'DigiVault';
  const whatsapp = settings?.general.whatsapp;
  const email = settings?.general.store_email;

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 text-zinc-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-bold text-lg text-white">{storeName}</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {settings?.general.store_tagline ||
                'Verified digital assets, AI prompt packs, business agreements, and instant digital delivery.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Manual EasyPaisa & JazzCash Verified</span>
            </div>
          </div>

          {/* Customer Self-Service */}
          <div>
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider mb-3">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Track Order & Access Downloads
                </button>
              </li>
              {email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <a href={`mailto:${email}`} className="hover:text-emerald-400 transition-colors">
                    {email}
                  </a>
                </li>
              )}
              {whatsapp && (
                <li className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-zinc-500" />
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    WhatsApp: {whatsapp}
                  </a>
                </li>
              )}
              <li className="text-zinc-500 text-[11px]">
                {settings?.general.support_hours || '24/7 Digital Verification Support'}
              </li>
            </ul>
          </div>

          {/* Payment Badges & Verification */}
          <div>
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider mb-3">
              Payment Methods
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="font-semibold text-emerald-400">EasyPaisa:</span>
                <span className="text-zinc-400">Instant Manual Transfer</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
                <span className="font-semibold text-orange-400">JazzCash:</span>
                <span className="text-zinc-400">Direct Mobile Account</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Protected with cryptographic single-use download tokens.
              </p>
            </div>
          </div>

          {/* Owner Administration */}
          <div>
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider mb-3">
              Store Owner Access
            </h4>
            <p className="text-xs text-zinc-500 mb-3">
              Authorized admin accounts can log in to verify pending payments, upload product files, and edit catalog.
            </p>
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Portal Login</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved. Built for digital creators & professionals.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <FileText className="w-3.5 h-3.5" />
              <span>Instant Digital Delivery</span>
            </span>
            <button onClick={onOpenAdmin} className="hover:text-zinc-300">
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
