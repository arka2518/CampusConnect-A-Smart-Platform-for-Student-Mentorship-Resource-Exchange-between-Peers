import React from 'react';
import { Resource } from '../types';
import { BookOpen, Sparkles, ArrowRight, MapPin, ShoppingCart, Check } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onSelect: (resource: Resource) => void;
  isInCart?: boolean;
  isOwner?: boolean;
  onAddToCart?: (resource: Resource) => void;
  onOpenCart?: () => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onSelect,
  isInCart = false,
  isOwner = false,
  onAddToCart,
  onOpenCart,
}) => {
  const isAvailable = !resource.status || resource.status === 'Available';
  const hasRetailComparison = resource.price > 0 && resource.originalPrice > resource.price;
  const discountPercent = hasRetailComparison
    ? Math.round(((resource.originalPrice - resource.price) / resource.originalPrice) * 100)
    : 0;
  const showAnnotationsTag = resource.category === 'Textbook' && resource.handwrittenNotesIncluded;

  return (
    <div 
      onClick={() => onSelect(resource)}
      className="group bg-[#FFFDF9] hover:bg-white rounded-3xl overflow-hidden border border-[#EDE5D8] hover:border-[#FCE38A] transition-all duration-300 hover:shadow-xl flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative h-44 w-full bg-[#EDE5D8] overflow-hidden">
        <img
          src={resource.image}
          alt={resource.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/resources/res-1.jpg';
          }}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FCE38A] text-[#4A3C31] shadow-sm flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {resource.category}
          </span>
          {showAnnotationsTag && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F38181] text-white shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Has Annotations
            </span>
          )}
        </div>

        {resource.status && resource.status !== 'Available' && (
          <div
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${
              resource.status === 'Reserved'
                ? 'bg-[#4A3C31] text-[#FCE38A]'
                : 'bg-emerald-700 text-white'
            }`}
          >
            {resource.status}
          </div>
        )}

        <div className="absolute bottom-3 left-3 bg-[#ff1d1d] text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow-sm">
          Available until {resource.availableUntil}
        </div>

        {hasRetailComparison && discountPercent > 0 && (
          <div className="absolute bottom-3 right-3 bg-emerald-100 text-emerald-800 shadow-sm px-2.5 py-1 rounded-xl text-xs font-bold">
            Save {discountPercent}%
          </div>
        )}
      </div>

      {/* Course Code Banner */}
      <div className="bg-[#FFF8DF] px-4 py-2 flex items-center justify-between border-b border-[#EDE5D8] text-xs">
        <span className="font-bold text-[#4A3C31] tracking-wide uppercase">{resource.courseCode}</span>
        <span className="text-[#746356] font-medium truncate max-w-[160px]">{resource.courseName}</span>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-[#4A3C31] group-hover:text-[#2C221A] line-clamp-1 mb-1.5">
            {resource.title}
          </h3>

          <p className="text-xs text-[#746356] line-clamp-2 leading-relaxed mb-3">
            {resource.description}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-[#99897D] mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#F38181] shrink-0" />
            <span className="truncate">{resource.pickupLocation}</span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-[#EDE5D8] flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="text-base font-extrabold text-[#4A3C31] flex items-baseline gap-1.5">
              {resource.price === 0 ? 'Free' : `₹${resource.price}`}
              {hasRetailComparison && (
                <span className="text-xs line-through text-[#99897D] font-normal">₹{resource.originalPrice}</span>
              )}
            </div>
            <div className="text-[11px] text-[#746356] font-medium">{resource.condition}</div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isAvailable && !isOwner && (onAddToCart || onOpenCart) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isInCart) {
                    onOpenCart?.();
                  } else {
                    onAddToCart?.(resource);
                  }
                }}
                title={isInCart ? 'View item in cart' : 'Add to cart'}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border ${
                  isInCart
                    ? 'bg-[#FCE38A] border-[#F0D372] text-[#4A3C31] hover:bg-[#FAD872]'
                    : 'bg-white border-[#DDD1BD] text-[#4A3C31] hover:bg-[#FFF8DF] hover:border-[#FCE38A]'
                }`}
              >
                {isInCart ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>In Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5 text-[#F38181]" />
                    <span>Add</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm group-hover:shadow"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
