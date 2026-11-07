import React, { useState } from 'react';
import { Mentor } from '../types';
import { X, Calendar, Clock, Star, BookOpen, ShieldCheck, Sparkles, MessageSquare, Check, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MentorModalProps {
  mentor: Mentor | null;
  onClose: () => void;
  onBookSlot: (mentorName: string, slotTime: string) => void;
}

export const MentorModal: React.FC<MentorModalProps> = ({ mentor, onClose, onBookSlot }) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  if (!mentor) return null;

  const handleBook = () => {
    const slot = mentor.upcomingSlots.find(s => s.id === selectedSlotId) || mentor.upcomingSlots[0];
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FCE38A', '#F38181', '#4A3C31'],
    });
    onBookSlot(mentor.name, `${slot.date} at ${slot.time}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#4A3C31]/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#F7F3EE] w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#EDE5D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Profile Hero */}
        <div className="bg-[#FCE38A] p-6 relative border-b border-[#EDE5D8]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-24 h-24 rounded-2xl bg-white shadow-md border-2 border-white overflow-hidden shrink-0">
              <img
                src={mentor.avatar}
                alt={mentor.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/mentors/mentor-1.jpg';
                }}
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-[#4A3C31]">{mentor.name}</h2>
                {mentor.verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Senior
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#746356]">{mentor.department}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#746356] mt-2">
                <span className="bg-white/80 px-2.5 py-1 rounded-lg font-medium text-[#4A3C31]">
                  🎓 {mentor.year}
                </span>
                <span className="bg-white/80 px-2.5 py-1 rounded-lg font-medium text-[#4A3C31]">
                  ⭐ {mentor.cgpa}
                </span>
                <span className="bg-white/80 px-2.5 py-1 rounded-lg font-medium text-[#4A3C31] flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#F38181] text-[#F38181]" />
                  {mentor.rating} ({mentor.reviewsCount} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Senior Handoff Banner */}
          {mentor.linkedHandoffItem && (
            <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#F38181] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#4A3C31]">
                  Synchronized Departure Handoff
                </h4>
                <p className="text-xs sm:text-sm text-[#746356] mt-0.5">
                  {mentor.linkedHandoffItem}
                </p>
              </div>
            </div>
          )}

          {/* Bio */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#746356] mb-2">
              About the Senior
            </h4>
            <p className="text-sm text-[#4A3C31] leading-relaxed bg-white p-4 rounded-2xl border border-[#EDE5D8]">
              {mentor.bio}
            </p>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#746356] mb-2">
              Mentorship Areas & Guidance
            </h4>
            <div className="flex flex-wrap gap-2">
              {mentor.specialties.map((spec, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-[#FCE38A]/60 text-[#4A3C31] rounded-xl text-xs font-semibold">
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Completed Courses */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#746356] mb-2">
              Courses Taken & Aced
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mentor.coursesTaken.map((course, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-[#EDE5D8] text-xs font-medium text-[#4A3C31]">
                  <BookOpen className="w-4 h-4 text-[#F38181] shrink-0" />
                  <span>{course}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#746356]">
                Available 1-on-1 Slots
              </h4>
              <span className="text-xs text-[#99897D]">Select one to reserve</span>
            </div>
            <div className="space-y-2">
              {mentor.upcomingSlots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FFF8DF] border-[#F38181] shadow-sm'
                        : 'bg-white border-[#EDE5D8] hover:border-[#FCE38A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-[#F38181] text-white' : 'bg-[#F7F3EE] text-[#4A3C31]'}`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#4A3C31]">{slot.type}</div>
                        <div className="text-xs text-[#746356] flex items-center gap-2 mt-0.5">
                          <span>{slot.date}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#F38181]" /> {slot.time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isSelected ? 'bg-[#F38181] border-[#F38181] text-white' : 'border-[#DDD1BD]'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Office hours info */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#EDE5D8] text-xs text-[#746356] flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#F38181] shrink-0" />
            <span>Regular Office Hours: {mentor.officeHours}</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#EDE5D8] flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#746356] flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>{mentor.sessionsCompleted} sessions successfully held</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D8CEBE] text-xs font-semibold text-[#4A3C31] hover:bg-[#F7F3EE] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBook}
              className="px-5 py-2.5 rounded-xl bg-[#F38181] hover:bg-[#EA6E6E] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Book Guidance Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
