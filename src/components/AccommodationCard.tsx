import React from 'react';
import { Accommodation } from '../types';
import { Calendar, MapPin, Sparkles, ArrowRight, ShieldCheck, Home } from 'lucide-react';

interface AccommodationCardProps {
  accommodation: Accommodation;
  onSelect: (accommodation: Accommodation) => void;
}

export const AccommodationCard: React.FC<AccommodationCardProps> = ({ accommodation, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(accommodation)}
      className="group bg-[#FFFDF9] hover:bg-white rounded-3xl overflow-hidden border border-[#EDE5D8] hover:border-[#FCE38A] transition-all duration-300 hover:shadow-xl flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Image Container with Badges */}
      <div className="relative h-48 w-full bg-[#EDE5D8] overflow-hidden">
        <img
          src={accommodation.image}
          alt={accommodation.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/apartments/apt-1.jpg';
          }}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FCE38A] text-[#4A3C31] shadow-sm flex items-center gap-1">
            <Home className="w-3 h-3" />
            {accommodation.type}
          </span>
          {accommodation.brokerBypassBadge && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 shadow-sm flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Zero Brokerage
            </span>
          )}
        </div>
      </div>

      {/* Prominent Vacancy Date Bar - Explicit Requirement */}
      <div className="bg-[#FCE38A] px-4 py-2.5 flex items-center justify-between border-b border-[#EDE5D8]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#4A3C31] shrink-0" />
          <div className="text-xs font-bold text-[#4A3C31]">
            Vacant From: <span className="underline decoration-[#F38181] decoration-2">{accommodation.vacantDate}</span>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#4A3C31]/10 rounded-full text-[#4A3C31]">
          Senior Turnover
        </span>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#746356] mb-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#F38181] shrink-0" />
            <span className="truncate">{accommodation.location}</span>
            <span>•</span>
            <span className="shrink-0">{accommodation.distanceFromCampus}</span>
          </div>

          <h3 className="font-bold text-base text-[#4A3C31] group-hover:text-[#2C221A] line-clamp-1 mb-2">
            {accommodation.title}
          </h3>

          <p className="text-xs text-[#746356] line-clamp-2 leading-relaxed mb-3">
            {accommodation.description}
          </p>

          {/* Senior Handoff Note Preview */}
          <div className="bg-[#F7F3EE] rounded-xl p-2.5 text-xs text-[#4A3C31] flex items-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#F38181] shrink-0" />
            <span className="truncate">
              Handover by <strong>{accommodation.seniorOwner.name}</strong> ({accommodation.seniorOwner.year})
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-[#EDE5D8] flex items-center justify-between mt-auto">
          <div>
            <div className="text-xs text-[#99897D]">Rent</div>
            <div className="text-base font-extrabold text-[#4A3C31]">
              ₹{accommodation.rent.toLocaleString()}<span className="text-xs font-normal text-[#746356]">/mo</span>
            </div>
          </div>
          <button 
            className="px-3.5 py-2 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm group-hover:shadow"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
