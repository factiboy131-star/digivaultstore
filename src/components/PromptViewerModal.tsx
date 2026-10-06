import React, { useState } from 'react';
import { X, Copy, Check, Search, BookOpen, Sparkles } from 'lucide-react';

interface PromptViewerModalProps {
  productName: string;
  digitalContent: string;
  onClose: () => void;
}

export const PromptViewerModal: React.FC<PromptViewerModalProps> = ({
  productName,
  digitalContent,
  onClose,
}) => {
  const [copiedSectionIndex, setCopiedSectionIndex] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Split content by headings or dividers if markdown style
  const sections = digitalContent
    .split(/\n(?=## |\n---|\n# )/)
    .map((s) => s.trim())
    .filter(Boolean);

  const filteredSections = searchFilter
    ? sections.filter((s) => s.toLowerCase().includes(searchFilter.toLowerCase()))
    : sections;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSectionIndex(index);
    setTimeout(() => setCopiedSectionIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-zinc-100 flex flex-col">
        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white">
                  Interactive Online Vault
                </h2>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Licensed Access
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-md">{productName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar inside viewer */}
        <div className="px-6 pt-4 pb-2 bg-zinc-950/50 border-b border-zinc-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search through system prompts, frameworks, or templates..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {filteredSections.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No matching prompts or sections found for "{searchFilter}"
            </div>
          ) : (
            filteredSections.map((section, idx) => (
              <div
                key={idx}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 relative group hover:border-zinc-700 transition-colors"
              >
                {/* 1-Click Copy Button */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Asset Section #{idx + 1}
                  </span>
                  <button
                    onClick={() => handleCopy(section, idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
                  >
                    {copiedSectionIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Section Content */}
                <pre className="text-xs sm:text-sm font-sans text-zinc-300 whitespace-pre-wrap leading-relaxed select-text font-normal">
                  {section}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
