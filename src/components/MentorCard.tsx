import React from 'react';
import { Mentor } from '../types';
import { Star, ShieldCheck, ArrowRight, Clock } from 'lucide-react';

interface MentorCardProps {
  mentor: Mentor;
  onSelect: (mentor: Mentor) => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({ mentor, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(mentor)}
      className="group bg-[#FFFDF9] hover:bg-white rounded-3xl overflow-hidden border border-[#EDE5D8] hover:border-[#FCE38A] transition-all duration-300 hover:shadow-xl flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Top Banner & Avatar */}
      <div className="bg-[#FCE38A]/40 p-5 pb-4 border-b border-[#EDE5D8] relative">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-[#EDE5D8] overflow-hidden shrink-0">
            <img
              src={mentor.avatar}
              alt={mentor.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/mentors/mentor-1.jpg';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-base text-[#4A3C31] group-hover:text-[#2C221A] truncate">
                {mentor.name}
              </h3>
              {mentor.verified && (
                <span title="Verified Senior" className="inline-flex">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </span>
              )}
            </div>
            <p className="text-xs text-[#746356] truncate mt-0.5 font-medium">{mentor.department}</p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#746356]">
              <span className="bg-white/80 px-2 py-0.5 rounded font-semibold text-[#4A3C31]">
                {mentor.year.split('·')[0]}
              </span>
              <span className="bg-white/80 px-2 py-0.5 rounded font-bold text-[#4A3C31]">
                {mentor.cgpa}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-[#746356] line-clamp-2 leading-relaxed mb-3">
            {mentor.bio}
          </p>

          {/* Specialties Pills */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {mentor.specialties.slice(0, 3).map((spec, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-[#F7F3EE] text-[#4A3C31] text-[11px] font-medium rounded-lg border border-[#EDE5D8]">
                {spec}
              </span>
            ))}
            {mentor.specialties.length > 3 && (
              <span className="px-1.5 py-0.5 text-[#99897D] text-[10px]">+{mentor.specialties.length - 3}</span>
            )}
          </div>

          {/* Next Slot Preview */}
          {mentor.upcomingSlots.length > 0 && (
            <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-xl p-2.5 text-xs text-[#4A3C31] flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-[#F38181] shrink-0" />
              <span className="truncate">
                Next: <strong>{mentor.upcomingSlots[0].date}</strong> ({mentor.upcomingSlots[0].time.split('-')[0]})
              </span>
            </div>
          )}
        </div>

        {/* Footer Rating & Button */}
        <div className="pt-3 border-t border-[#EDE5D8] flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-xs text-[#4A3C31]">
            <Star className="w-3.5 h-3.5 fill-[#F38181] text-[#F38181]" />
            <span className="font-bold">{mentor.rating}</span>
            <span className="text-[#99897D]">({mentor.reviewsCount})</span>
          </div>

          <button className="px-3 py-1.5 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm group-hover:shadow">
            <span>View Slots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
