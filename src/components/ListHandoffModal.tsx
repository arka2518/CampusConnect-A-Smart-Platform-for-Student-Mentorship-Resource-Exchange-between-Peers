import React, { useState } from 'react';
import { X, Home, BookOpen, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ListHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitHandoff: (summary: string) => void;
}

export const ListHandoffModal: React.FC<ListHandoffModalProps> = ({
  isOpen,
  onClose,
  onSubmitHandoff,
}) => {
  const [seniorName, setSeniorName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [vacantDate, setVacantDate] = useState('2026-05-15');
  const [hasRoom, setHasRoom] = useState(true);
  const [roomTitle, setRoomTitle] = useState('');
  const [rent, setRent] = useState('8000');
  const [hasResource, setHasResource] = useState(true);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourcePrice, setResourcePrice] = useState('400');
  const [hasMentorship, setHasMentorship] = useState(true);
  const [mentorshipTopic, setMentorshipTopic] = useState('Course Guidance & Lab Survival');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FCE38A', '#F38181', '#4A3C31'],
    });
    onSubmitHandoff(`${seniorName || 'Senior'} listed their handoff items for ${vacantDate}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#4A3C31]/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#F7F3EE] w-full max-w-xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#EDE5D8]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#FCE38A] p-5 sm:p-6 flex items-center justify-between border-b border-[#EDE5D8]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#4A3C31] text-[#FCE38A] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#4A3C31]">Graduating Senior Handoff Hub</h3>
              <p className="text-xs text-[#746356]">Synchronize your departure: room, books & mentorship</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Senior Profile */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#746356]">Your Academic Standing</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanmay Roy"
                  value={seniorName}
                  onChange={(e) => setSeniorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                >
                  <option>Computer Science</option>
                  <option>Electrical & Electronics</option>
                  <option>Mechanical Engineering</option>
                  <option>Data Science & AI</option>
                  <option>Biotechnology</option>
                  <option>Civil Engineering</option>
                </select>
              </div>
            </div>
          </div>

          {/* Accommodation Vacancy Module */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE5D8] space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#4A3C31]">
                <input
                  type="checkbox"
                  checked={hasRoom}
                  onChange={(e) => setHasRoom(e.target.checked)}
                  className="w-4 h-4 rounded text-[#F38181] accent-[#F38181]"
                />
                <Home className="w-4 h-4 text-[#F38181]" />
                I am vacating a room/apartment
              </label>
            </div>

            {hasRoom && (
              <div className="space-y-3 pt-2 border-t border-[#EDE5D8]">
                <div>
                  <label className="text-xs font-semibold text-[#746356] block mb-1">
                    Room Vacancy Date <span className="text-[#F38181]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={vacantDate}
                    onChange={(e) => setVacantDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">Room Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Single Room, Block 4"
                      value={roomTitle}
                      onChange={(e) => setRoomTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#746356] block mb-1">Monthly Rent (₹)</label>
                    <input
                      type="number"
                      placeholder="8000"
                      value={rent}
                      onChange={(e) => setRent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Academic Resource Module */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE5D8] space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#4A3C31]">
              <input
                type="checkbox"
                checked={hasResource}
                onChange={(e) => setHasResource(e.target.checked)}
                className="w-4 h-4 rounded text-[#F38181] accent-[#F38181]"
              />
              <BookOpen className="w-4 h-4 text-[#F38181]" />
              I have books/equipment to pass down
            </label>

            {hasResource && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EDE5D8]">
                <div>
                  <label className="text-xs font-semibold text-[#746356] block mb-1">Material Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Operating Systems Textbook"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#746356] block mb-1">Fair Price (₹)</label>
                  <input
                    type="number"
                    placeholder="400"
                    value={resourcePrice}
                    onChange={(e) => setResourcePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mentorship Module */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE5D8] space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#4A3C31]">
              <input
                type="checkbox"
                checked={hasMentorship}
                onChange={(e) => setHasMentorship(e.target.checked)}
                className="w-4 h-4 rounded text-[#F38181] accent-[#F38181]"
              />
              <UserCheck className="w-4 h-4 text-[#F38181]" />
              Offer 1-on-1 Guidance Slot to incoming juniors
            </label>

            {hasMentorship && (
              <div className="pt-2 border-t border-[#EDE5D8]">
                <label className="text-xs font-semibold text-[#746356] block mb-1">Guidance Topic</label>
                <input
                  type="text"
                  value={mentorshipTopic}
                  onChange={(e) => setMentorshipTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F3EE] border border-[#EDE5D8] text-xs text-[#4A3C31]"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#F38181] hover:bg-[#EA6E6E] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Publish Unified Senior Departure Handoff
          </button>
        </form>
      </div>
    </div>
  );
};
