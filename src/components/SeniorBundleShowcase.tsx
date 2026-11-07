import React, { useState } from 'react';
import { SeniorHandoffBundle, Accommodation, Mentor, Resource } from '../types';
import { 
  Sparkles, Home, BookOpen, UserCheck, Calendar, 
  ChevronRight 
} from 'lucide-react';

interface SeniorBundleShowcaseProps {
  bundles: SeniorHandoffBundle[];
  onSelectAccommodation: (apt: Accommodation) => void;
  onSelectMentor: (mentor: Mentor) => void;
  onSelectResource: (res: Resource) => void;
}

export const SeniorBundleShowcase: React.FC<SeniorBundleShowcaseProps> = ({
  bundles,
  onSelectAccommodation,
  onSelectMentor,
  onSelectResource,
}) => {
  const [selectedBundleIndex, setSelectedBundleIndex] = useState(0);
  const activeBundle = bundles[selectedBundleIndex] || bundles[0];

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE5D8] shadow-sm relative overflow-hidden">
      {/* Decorative Warm Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#FCE38A]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 relative">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#FCE38A] text-[#4A3C31] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#F38181]" />
            THE UNIFIED DATA MODEL IN ACTION
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A3C31] tracking-tight">
            One Graduating Senior · 3 Linked Handoffs
          </h2>
          <p className="text-sm text-[#746356] max-w-2xl mt-1">
            When a senior completes their academic tenure, their vacated room, course textbooks, and accumulated knowledge are released at the same moment.
          </p>
        </div>

        {/* Senior Switcher Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {bundles.map((bundle, idx) => (
            <button
              key={bundle.id}
              onClick={() => setSelectedBundleIndex(idx)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                selectedBundleIndex === idx
                  ? 'bg-[#4A3C31] text-[#F7F3EE] shadow-md'
                  : 'bg-[#F7F3EE] text-[#4A3C31] hover:bg-[#EDE5D8]'
              }`}
            >
              <img
                src={bundle.seniorAvatar}
                alt={bundle.seniorName}
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/mentors/mentor-1.jpg';
                }}
              />
              <span>{bundle.seniorName.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Senior Narrative Card */}
      <div className="bg-[#F7F3EE] rounded-2xl p-5 mb-6 border border-[#EDE5D8] flex flex-col md:flex-row items-center gap-4 sm:gap-6">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-sm overflow-hidden shrink-0 border border-[#EDE5D8]">
          <img
            src={activeBundle.seniorAvatar}
            alt={activeBundle.seniorName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/mentors/mentor-1.jpg';
            }}
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h3 className="font-bold text-lg text-[#4A3C31]">{activeBundle.seniorName}</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FCE38A] text-[#4A3C31] font-semibold">
              {activeBundle.graduationTerm}
            </span>
          </div>
          <p className="text-xs text-[#746356] font-medium mt-0.5">{activeBundle.degree}</p>
          <p className="text-xs text-emerald-800 font-semibold mt-1">
            📍 Next Destination: {activeBundle.destination}
          </p>
          <p className="text-xs italic text-[#4A3C31] mt-2 bg-white/70 p-2.5 rounded-xl border border-[#EDE5D8]">
            "{activeBundle.quote}"
          </p>
        </div>
      </div>

      {/* The 3 Linked Modules Tri-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {/* 1. Linked Accommodation */}
        <div 
          onClick={() => onSelectAccommodation(activeBundle.accommodation)}
          className="group bg-[#FFFDF9] hover:bg-white rounded-2xl p-4 border border-[#EDE5D8] hover:border-[#FCE38A] transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FCE38A] text-[#4A3C31] flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />
                1. Room Vacancy
              </span>
              <span className="text-xs font-extrabold text-[#4A3C31]">
                ₹{activeBundle.accommodation.rent}/mo
              </span>
            </div>

            <div className="h-32 rounded-xl overflow-hidden mb-3 bg-[#EDE5D8]">
              <img
                src={activeBundle.accommodation.image}
                alt={activeBundle.accommodation.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/apartments/apt-1.jpg';
                }}
              />
            </div>

            {/* Vacancy Date on Bundle Card */}
            <div className="bg-[#FCE38A]/60 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#4A3C31] flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-[#F38181]" />
              <span>Vacant From: {activeBundle.accommodation.vacantDate}</span>
            </div>

            <h4 className="font-bold text-sm text-[#4A3C31] line-clamp-1">
              {activeBundle.accommodation.title}
            </h4>
            <p className="text-xs text-[#746356] line-clamp-2 mt-1">
              {activeBundle.accommodation.description}
            </p>
          </div>

          <div className="pt-3 border-t border-[#EDE5D8] mt-3 flex items-center justify-between text-xs font-bold text-[#F38181]">
            <span>Inspect Room Handoff</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. Linked Resource / Textbook */}
        <div 
          onClick={() => onSelectResource(activeBundle.resource)}
          className="group bg-[#FFFDF9] hover:bg-white rounded-2xl p-4 border border-[#EDE5D8] hover:border-[#FCE38A] transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FCE38A] text-[#4A3C31] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                2. Academic Material
              </span>
              <span className="text-xs font-extrabold text-[#4A3C31]">
                ₹{activeBundle.resource.price}
              </span>
            </div>

            <div className="h-32 rounded-xl overflow-hidden mb-3 bg-[#EDE5D8]">
              <img
                src={activeBundle.resource.image}
                alt={activeBundle.resource.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/resources/res-1.jpg';
                }}
              />
            </div>

            <div className="bg-[#FFF8DF] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#4A3C31] flex items-center justify-between mb-2">
              <span>{activeBundle.resource.courseCode}</span>
              <span className="text-emerald-700 font-bold">Save {Math.round(((activeBundle.resource.originalPrice - activeBundle.resource.price)/activeBundle.resource.originalPrice)*100)}%</span>
            </div>

            <h4 className="font-bold text-sm text-[#4A3C31] line-clamp-1">
              {activeBundle.resource.title}
            </h4>
            <p className="text-xs text-[#746356] line-clamp-2 mt-1">
              {activeBundle.resource.description}
            </p>
          </div>

          <div className="pt-3 border-t border-[#EDE5D8] mt-3 flex items-center justify-between text-xs font-bold text-[#F38181]">
            <span>Inspect Material</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. Linked Mentorship */}
        <div 
          onClick={() => onSelectMentor(activeBundle.mentor)}
          className="group bg-[#FFFDF9] hover:bg-white rounded-2xl p-4 border border-[#EDE5D8] hover:border-[#FCE38A] transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FCE38A] text-[#4A3C31] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                3. Direct Mentorship
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Free Student Peer
              </span>
            </div>

            <div className="h-32 rounded-xl overflow-hidden mb-3 bg-[#FCE38A]/30 flex items-center justify-center p-3">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-sm overflow-hidden border border-[#EDE5D8]">
                <img
                  src={activeBundle.mentor.avatar}
                  alt={activeBundle.mentor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/mentors/mentor-1.jpg';
                  }}
                />
              </div>
            </div>

            <div className="bg-[#FFF8DF] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#4A3C31] flex items-center justify-between mb-2">
              <span>★ {activeBundle.mentor.rating} ({activeBundle.mentor.reviewsCount})</span>
              <span>{activeBundle.mentor.cgpa}</span>
            </div>

            <h4 className="font-bold text-sm text-[#4A3C31] line-clamp-1">
              1-on-1 Guidance & Orientation
            </h4>
            <p className="text-xs text-[#746356] line-clamp-2 mt-1">
              {activeBundle.mentor.bio}
            </p>
          </div>

          <div className="pt-3 border-t border-[#EDE5D8] mt-3 flex items-center justify-between text-xs font-bold text-[#F38181]">
            <span>Book Advice Session</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </section>
  );
};
