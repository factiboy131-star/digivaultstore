import React, { useState } from 'react';
import {
  X,
  Check,
  Package,
  Layers,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  FileText,
  Flame,
  Star,
  ChevronDown,
} from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  currency: string;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  onClose,
  onBuyNow,
}) => {
  if (!product) return null;

  const [selectedImage, setSelectedImage] = useState<string>(product.main_image_url);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const images = Array.from(
    new Set([product.main_image_url, ...(product.gallery_images || [])])
  ).filter(Boolean);

  const hasDiscount = product.discount_price !== null && product.discount_price < product.price;
  const currentPrice = hasDiscount ? product.discount_price! : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-zinc-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Gallery */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-video sm:aspect-4/3 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-inner">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-zinc-950/80 backdrop-blur text-xs font-semibold px-2.5 py-1 rounded-md text-emerald-400 border border-emerald-500/30">
                    {product.product_type}
                  </span>
                  {product.bestseller && (
                    <span className="bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-black" /> Bestseller
                    </span>
                  )}
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        selectedImage === img
                          ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20'
                          : 'border-zinc-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Guarantee Box */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 text-xs space-y-2 text-zinc-400">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Direct Digital Security Protocol</span>
                </div>
                <p>
                  Files are stored in private encrypted storage. Access token and downloads unlock immediately once your EasyPaisa / JazzCash payment is verified.
                </p>
              </div>
            </div>

            {/* Right Column: Information & Actions */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                    {product.category}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs text-zinc-400">{product.product_type}</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight mb-3">
                  {product.name}
                </h1>

                <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                  {product.short_description}
                </p>

                {/* Price Display */}
                <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl sm:text-3xl font-black text-white">
                        {currency} {currentPrice.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-zinc-500 line-through">
                          {currency} {product.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <span className="text-xs text-emerald-400 font-bold">
                        You save {currency} {(product.price - currentPrice).toLocaleString()} ({discountPercent}% OFF)
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                    One-time payment
                  </span>
                </div>

                {/* Buy Now CTA */}
                <button
                  onClick={() => onBuyNow(product)}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>BUY NOW & PAY VIA EASYPAISA / JAZZCASH</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* What's Included & Requirements Summary */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                {product.whats_included && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-400" />
                      What's Included
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/60">
                      {product.whats_included}
                    </p>
                  </div>
                )}

                {product.requirements && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      Requirements
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {product.requirements}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Features & Full Description */}
          <div className="mt-10 pt-8 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Features Bullet List */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 mb-4 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Key Specifications & Features
                </h3>
                <ul className="space-y-2.5">
                  {product.features.map((feat, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60"
                    >
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full Description */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                Product Overview
              </h3>
              <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-3 whitespace-pre-line bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/60">
                {product.full_description}
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          {product.faq && product.faq.length > 0 && (
            <div className="mt-10 pt-8 border-t border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                Frequently Asked Questions
              </h3>
              <div className="space-y-2.5">
                {product.faq.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-medium text-zinc-200 hover:text-white transition-colors"
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-400 transition-transform ${
                          openFaqIndex === idx ? 'rotate-180 text-emerald-400' : ''
                        }`}
                      />
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-3.5 pb-3.5 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
