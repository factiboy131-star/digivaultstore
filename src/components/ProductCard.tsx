import React from 'react';
import {
  FileText,
  Sparkles,
  ArrowRight,
  Check,
  Flame,
  Star,
  Download,
} from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  currency: string;
  onViewDetails: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onViewDetails,
  onBuyNow,
}) => {
  const hasDiscount = product.discount_price !== null && product.discount_price < product.price;
  const currentPrice = hasDiscount ? product.discount_price! : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  return (
    <div className="group bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between">
      <div>
        {/* Image Container with Badges */}
        <div
          onClick={() => onViewDetails(product)}
          className="relative aspect-video w-full overflow-hidden bg-zinc-950 cursor-pointer"
        >
          <img
            src={product.main_image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback gradient if custom image fails to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60"></div>

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.bestseller && (
              <span className="flex items-center gap-1 bg-amber-500/90 backdrop-blur text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                <Flame className="w-3 h-3 fill-black" />
                Bestseller
              </span>
            )}
            {product.featured && (
              <span className="flex items-center gap-1 bg-emerald-500/90 backdrop-blur text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                <Star className="w-3 h-3 fill-black" />
                Featured
              </span>
            )}
            <span className="bg-zinc-900/80 backdrop-blur text-zinc-300 border border-zinc-700/60 text-[10px] font-medium px-2 py-0.5 rounded-full">
              {product.category}
            </span>
          </div>

          {/* Product Type Tag */}
          <div className="absolute bottom-3 right-3">
            <span className="bg-zinc-950/90 backdrop-blur border border-zinc-700 text-zinc-200 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{product.product_type}</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-base sm:text-lg text-zinc-100 hover:text-emerald-400 transition-colors line-clamp-2 cursor-pointer mb-2"
          >
            {product.name}
          </h3>

          <p className="text-zinc-400 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
            {product.short_description || product.full_description}
          </p>

          {/* Quick Key Features Preview (Top 2) */}
          {product.features && product.features.length > 0 && (
            <ul className="space-y-1.5 mb-4">
              {product.features.slice(0, 2).map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] sm:text-xs text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="truncate">{feat}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Pricing & Footer Actions */}
      <div className="p-5 pt-0 border-t border-zinc-800/80 mt-auto">
        <div className="flex items-baseline justify-between pt-4 mb-3.5">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-white">
                {currency} {currentPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs text-zinc-500 line-through font-medium">
                  {currency} {product.price.toLocaleString()}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                Save {discountPercent}% Instant
              </span>
            )}
          </div>

          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
            <Download className="w-3 h-3 text-emerald-400" />
            Instant Delivery
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewDetails(product)}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 text-xs font-semibold transition-colors border border-zinc-700/60 cursor-pointer text-center"
          >
            View Details
          </button>
          <button
            onClick={() => onBuyNow(product)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-extrabold transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>BUY NOW</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
