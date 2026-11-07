import React, { useState } from 'react';
import { Resource } from '../types';
import { X, BookOpen, MapPin, ShieldCheck, Sparkles, CheckCircle2, KeyRound } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResourceModalProps {
  resource: Resource | null;
  onClose: () => void;
  onReserveItem: (title: string, price: number) => void;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({ resource, onClose, onReserveItem }) => {
  const [reservedStep, setReservedStep] = useState(false);

  if (!resource) return null;

  const discountPercent = Math.round(((resource.originalPrice - resource.price) / resource.originalPrice) * 100);

  const handleReserve = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FCE38A', '#F38181', '#4A3C31'],
    });
    setReservedStep(true);
    onReserveItem(resource.title, resource.price);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#4A3C31]/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#F7F3EE] w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#EDE5D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero */}
        <div className="relative h-56 sm:h-64 bg-[#EDE5D8] overflow-hidden shrink-0">
          <img
            src={resource.image}
            alt={resource.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/resources/res-1.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A3C31]/90 via-[#4A3C31]/30 to-transparent flex flex-col justify-between p-6">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FCE38A] text-[#4A3C31] shadow-sm flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {resource.category}
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-white">
              <span className="text-xs font-semibold text-[#FCE38A] tracking-wider uppercase block mb-1">
                {resource.courseCode} · {resource.department}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                {resource.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Pricing Bar */}
        <div className="bg-[#FCE38A] px-6 py-3.5 flex items-center justify-between border-b border-[#EDE5D8]">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold text-[#4A3C31]">₹{resource.price}</span>
            <span className="text-sm line-through text-[#7A695C]">₹{resource.originalPrice}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#F38181] text-white">
              Save {discountPercent}%
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-[#4A3C31]/10 rounded-lg text-[#4A3C31]">
            Condition: {resource.condition}
          </span>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notes Included Banner */}
          {resource.handwrittenNotesIncluded && (
            <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#F38181] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#4A3C31]">
                  Bonus Senior Study Notes Included!
                </h4>
                <p className="text-xs sm:text-sm text-[#746356] mt-0.5">
                  Includes highlighted mid-term derivations, exam question bookmarks, and chapter review summaries.
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#746356] mb-2">Item Description & Context</h4>
            <p className="text-sm text-[#4A3C31] leading-relaxed bg-white p-4 rounded-2xl border border-[#EDE5D8]">
              {resource.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-[#EDE5D8]">
              <span className="text-xs text-[#99897D] block">Edition / Model</span>
              <span className="font-bold text-xs sm:text-sm text-[#4A3C31]">{resource.edition}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-[#EDE5D8]">
              <span className="text-xs text-[#99897D] block">Target Course</span>
              <span className="font-bold text-xs sm:text-sm text-[#4A3C31]">{resource.courseName}</span>
            </div>
          </div>

          {/* Senior Seller Info */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE5D8]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#746356] mb-3">Senior Seller Information</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FCE38A] text-[#4A3C31] flex items-center justify-center font-bold">
                {resource.seller.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="font-bold text-sm text-[#4A3C31]">{resource.seller.name}</h5>
                  {resource.seller.verified && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Senior
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#746356]">{resource.seller.department} · {resource.seller.year}</p>
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#EDE5D8] flex items-center gap-3 text-xs text-[#4A3C31]">
            <MapPin className="w-4 h-4 text-[#F38181] shrink-0" />
            <div>
              <span className="font-bold block">Campus Handover Spot:</span>
              <span className="text-[#746356]">{resource.pickupLocation}</span>
            </div>
          </div>

          {/* OTP Handoff Security Simulation */}
          {reservedStep && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
              <KeyRound className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">
                  Reservation Locked · OTP Code: 8421
                </h5>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Show this OTP to {resource.seller.name} during the physical handover on campus to complete the fair trade!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#EDE5D8] flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#746356]">
            Fair price protection guaranteed
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D8CEBE] text-xs font-semibold text-[#4A3C31] hover:bg-[#F7F3EE] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleReserve}
              className="px-5 py-2.5 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {reservedStep ? 'Reserved (OTP Generated)' : 'Reserve for Campus Pickup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
