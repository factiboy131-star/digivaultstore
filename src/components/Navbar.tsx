import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Download,
  Lock,
  Menu,
  X,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { SiteSettings, AdminUser } from '../types';

interface NavbarProps {
  settings: SiteSettings | null;
  adminUser: AdminUser | null;
  onOpenAdmin: () => void;
  onOpenTracking: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onSelectCategory: (cat: string | null) => void;
  selectedCategory: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  adminUser,
  onOpenAdmin,
  onOpenTracking,
  onSearchChange,
  searchQuery,
  onSelectCategory,
  selectedCategory,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const storeName = settings?.general.store_name || 'DigiVault';
  const currency = settings?.general.currency || 'PKR';

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      {/* Top Announcement Bar */}
      {settings?.homepage.announcement && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-medium py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{settings.homepage.announcement}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => {
              onSelectCategory(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  {storeName}
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                  Store
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block truncate max-w-[200px]">
                {settings?.general.store_tagline || 'Verified Digital Assets'}
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search prompt packs, guides, templates..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation & Actions */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {/* Track Order / Access Downloads */}
            <button
              onClick={onOpenTracking}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Track Order & Downloads</span>
            </button>

            {/* Admin Panel Button */}
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                adminUser
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title={adminUser ? `Logged in as ${adminUser.email}` : 'Admin Login'}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{adminUser ? 'Admin Panel' : 'Admin'}</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenTracking}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400"
              title="Track Order"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden pb-3 pt-1">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search digital products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-zinc-800 py-3 space-y-2">
            <button
              onClick={() => {
                onOpenTracking();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 text-zinc-200 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Track Order & Downloads
              </span>
              <span className="text-xs text-zinc-400">Verify</span>
            </button>

            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 text-zinc-300 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-400" />
                {adminUser ? 'Access Admin Panel' : 'Admin Login'}
              </span>
              <span className="text-xs text-zinc-400">Secure</span>
            </button>

            {settings?.general.whatsapp && (
              <a
                href={`https://wa.me/${settings.general.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/40 text-emerald-300 text-sm font-medium border border-emerald-900/50"
              >
                <PhoneCall className="w-4 h-4" />
                <span>WhatsApp Support: {settings.general.whatsapp}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
