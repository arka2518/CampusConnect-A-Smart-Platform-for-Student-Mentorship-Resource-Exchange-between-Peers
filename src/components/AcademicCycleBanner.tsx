import React from 'react';
import { Calendar, RefreshCw, Home, BookOpen, Users, Sparkles, ArrowRight } from 'lucide-react';

interface AcademicCycleBannerProps {
  onExploreHandoffs: () => void;
}

export const AcademicCycleBanner: React.FC<AcademicCycleBannerProps> = ({ onExploreHandoffs }) => {
  return (
    <div className="bg-[#FFFDF9] rounded-3xl p-6 sm:p-8 border border-[#EDE5D8] shadow-sm relative overflow-hidden mb-8">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FCE38A]/25 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FCE38A] text-[#4A3C31]">
              <Calendar className="w-3.5 h-3.5 text-[#F38181]" />
              ACADEMIC CALENDAR SYNCHRONIZED
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#4A3C31]/5 text-[#4A3C31]">
              <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin-slow" />
              Academic Year 26-27 Turnover Window
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#4A3C31] tracking-tight leading-tight">
            Connecting Student Transitions.<br />
            <span className="text-[#F38181]">Zero Waste. Zero Brokerage. Real Guidance.</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#746356] mt-3 leading-relaxed">
            When seniors graduate, room vacancies, academic books, and hard-earned campus insights are released simultaneously. 
            CampusConnect ties these three exchanges directly to the university turnover calendar.
          </p>

          <div className="mt-4">
            <button
              onClick={onExploreHandoffs}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4A3C31] text-[#F7F3EE] hover:bg-[#32271E] text-xs font-bold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FCE38A]" />
              <span>Explore Senior Bundles</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F38181]" />
            </button>
          </div>
        </div>

        {/* 3 Metrics Chips */}
        <div className="w-full lg:w-auto grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
          <div className="bg-[#F7F3EE] p-3 sm:p-4 rounded-2xl border border-[#EDE5D8] text-center">
            <div className="w-8 h-8 rounded-xl bg-[#FCE38A] text-[#4A3C31] flex items-center justify-center mx-auto mb-1.5 shadow-xs">
              <Home className="w-4 h-4" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-[#4A3C31]">6 Rooms</div>
            <div className="text-[10px] sm:text-xs text-[#746356] font-medium">May-July Vacant</div>
          </div>

          <div className="bg-[#F7F3EE] p-3 sm:p-4 rounded-2xl border border-[#EDE5D8] text-center">
            <div className="w-8 h-8 rounded-xl bg-[#FCE38A] text-[#4A3C31] flex items-center justify-center mx-auto mb-1.5 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-[#4A3C31]">6 Items</div>
            <div className="text-[10px] sm:text-xs text-[#746356] font-medium">Fair Price Listed</div>
          </div>

          <div className="bg-[#F7F3EE] p-3 sm:p-4 rounded-2xl border border-[#EDE5D8] text-center">
            <div className="w-8 h-8 rounded-xl bg-[#FCE38A] text-[#4A3C31] flex items-center justify-center mx-auto mb-1.5 shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-[#4A3C31]">6 Mentors</div>
            <div className="text-[10px] sm:text-xs text-[#746356] font-medium">Slots Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};
