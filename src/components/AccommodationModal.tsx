import React, { useState } from 'react';
import { Accommodation } from '../types';
import { 
  X, Calendar, MapPin, CheckCircle, ShieldCheck, 
  Home, Phone, Mail, Sparkles, Share2, Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AccommodationModalProps {
  accommodation: Accommodation | null;
  onClose: () => void;
  onBookHandoff: (title: string, seniorName: string) => void;
}

export const AccommodationModal: React.FC<AccommodationModalProps> = ({
  accommodation,
  onClose,
  onBookHandoff,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'senior' | 'amenities'>('overview');
  const [isCopied, setIsCopied] = useState(false);

  if (!accommodation) return null;

  const handleClaim = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FCE38A', '#F38181', '#4A3C31'],
    });
    onBookHandoff(accommodation.title, accommodation.seniorOwner.name);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#4A3C31]/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#F7F3EE] w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#EDE5D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative h-64 sm:h-72 w-full bg-[#EDE5D8] overflow-hidden shrink-0">
          <img
            src={accommodation.image}
            alt={accommodation.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback image if placeholder is missing
              (e.target as HTMLImageElement).src = '/images/apartments/apt-1.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A3C31]/90 via-[#4A3C31]/30 to-transparent flex flex-col justify-between p-6">
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FCE38A] text-[#4A3C31] shadow-sm">
                <Home className="w-3.5 h-3.5" />
                {accommodation.type}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                    isSaved ? 'bg-[#F38181] text-white' : 'bg-white/70 text-[#4A3C31] hover:bg-white'
                  }`}
                  title="Save room"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-white/70 text-[#4A3C31] hover:bg-white backdrop-blur-md transition-colors"
                  title="Share link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-white">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#FCE38A] mb-1">
                <span>{accommodation.furnished}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {accommodation.distanceFromCampus}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                {accommodation.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Prominent Vacancy Banner - Core Requirement */}
        <div className="bg-[#FCE38A] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE5D8]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4A3C31] text-[#FCE38A] rounded-xl shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-[#7A695C]">
                Turnover Availability
              </div>
              <div className="text-base sm:text-lg font-bold text-[#4A3C31] flex items-center gap-2">
                Vacant From: <span>{accommodation.vacantDate}</span>
                <span className="text-xs font-medium bg-[#4A3C31]/10 px-2 py-0.5 rounded-full text-[#4A3C31]">
                  Upcoming Cycle
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#7A695C] block">Monthly Rent</span>
            <span className="text-xl font-bold text-[#4A3C31]">₹{accommodation.rent.toLocaleString()}</span>
            <span className="text-xs text-[#7A695C]"> / month</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#EDE5D8] px-6 bg-white/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#F38181] text-[#4A3C31]'
                : 'border-transparent text-[#7A695C] hover:text-[#4A3C31]'
            }`}
          >
            Overview & Reason
          </button>
          <button
            onClick={() => setActiveTab('amenities')}
            className={`py-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'amenities'
                ? 'border-[#F38181] text-[#4A3C31]'
                : 'border-transparent text-[#7A695C] hover:text-[#4A3C31]'
            }`}
          >
            Amenities & Bills
          </button>
          <button
            onClick={() => setActiveTab('senior')}
            className={`py-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'senior'
                ? 'border-[#F38181] text-[#4A3C31]'
                : 'border-transparent text-[#7A695C] hover:text-[#4A3C31]'
            }`}
          >
            Senior Owner Note
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Senior Handover Badge */}
              <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#4A3C31] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-[#4A3C31]">Academic Turnover Rationale:</h4>
                  <p className="text-xs sm:text-sm text-[#746356] mt-0.5">
                    {accommodation.academicCycleReason}
                  </p>
                  <p className="text-xs text-[#99897D] mt-1.5 font-medium">
                    ✓ Verified student handover • Landlord agreed to zero broker commission
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#4A3C31] uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-[#746356] leading-relaxed">
                  {accommodation.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-2xl border border-[#EDE5D8]">
                  <span className="text-xs text-[#99897D] block">Security Deposit</span>
                  <span className="font-bold text-sm text-[#4A3C31]">₹{accommodation.deposit.toLocaleString()}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-[#EDE5D8]">
                  <span className="text-xs text-[#99897D] block">Campus Distance</span>
                  <span className="font-bold text-sm text-[#4A3C31]">{accommodation.distanceFromCampus}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-[#EDE5D8]">
                  <span className="text-xs text-[#99897D] block">Furnishing</span>
                  <span className="font-bold text-sm text-[#4A3C31]">{accommodation.furnished}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-[#EDE5D8]">
                  <span className="text-xs text-[#99897D] block">Senior Handoff</span>
                  <span className="font-bold text-sm text-emerald-700">✓ Verified Direct</span>
                </div>
              </div>

              {accommodation.roommatePreferences && (
                <div className="bg-white p-4 rounded-2xl border border-[#EDE5D8]">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#746356] mb-1">
                    Roommate & House Guidelines
                  </h5>
                  <p className="text-sm text-[#4A3C31]">{accommodation.roommatePreferences}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'amenities' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-sm text-[#4A3C31] uppercase tracking-wider mb-3">Room Amenities</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {accommodation.amenities.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-[#EDE5D8] text-xs font-medium text-[#4A3C31]">
                      <CheckCircle className="w-4 h-4 text-[#F38181] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#4A3C31] uppercase tracking-wider mb-3">Bills & Utilities Included</h4>
                <div className="flex flex-wrap gap-2">
                  {accommodation.billsIncluded.map((bill, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-[#FCE38A]/50 text-[#4A3C31] rounded-lg text-xs font-semibold">
                      ✓ {bill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'senior' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#EDE5D8] flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FCE38A] text-[#4A3C31] flex items-center justify-center font-bold text-xl shrink-0">
                  {accommodation.seniorOwner.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#4A3C31] text-base">{accommodation.seniorOwner.name}</h4>
                    {accommodation.seniorOwner.verified && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Senior
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#746356]">{accommodation.seniorOwner.department}</p>
                  <p className="text-xs text-[#99897D] mt-0.5">{accommodation.seniorOwner.year}</p>
                </div>
              </div>

              <div className="bg-[#FFF8DF] p-4 rounded-2xl border border-[#FCE38A]">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#746356] mb-1">
                  Senior’s Handover Instructions
                </h5>
                <p className="text-sm text-[#4A3C31] leading-relaxed">
                  "{accommodation.seniorOwner.contactNote}"
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex-1 flex items-center gap-2.5 p-3 bg-white rounded-xl border border-[#EDE5D8] text-xs text-[#4A3C31]">
                  <Phone className="w-4 h-4 text-[#F38181]" />
                  <span>{accommodation.seniorOwner.phonePreview} (Available upon request)</span>
                </div>
                <div className="flex-1 flex items-center gap-2.5 p-3 bg-white rounded-xl border border-[#EDE5D8] text-xs text-[#4A3C31]">
                  <Mail className="w-4 h-4 text-[#F38181]" />
                  <span>{accommodation.seniorOwner.emailPreview}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#EDE5D8] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#746356]">
            {isCopied ? (
              <span className="text-emerald-600 font-semibold">✓ Link copied to clipboard!</span>
            ) : (
              <span>Direct senior-to-junior handoff • No security deposit loss</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D8CEBE] text-xs font-semibold text-[#4A3C31] hover:bg-[#F7F3EE] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleClaim}
              className="px-5 py-2.5 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Schedule Handoff / Reserve Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
