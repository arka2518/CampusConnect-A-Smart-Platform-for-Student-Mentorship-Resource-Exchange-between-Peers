import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import {
  X,
  CheckCircle2,
  GraduationCap,
  Phone,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { updateUserProfile } from '../api/authApi';

interface OnboardingModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  isBackendLive: boolean;
  isFirstTime: boolean;
  onClose: () => void;
  onProfileSaved: (updated: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  user,
  isBackendLive,
  isFirstTime,
  onClose,
  onProfileSaved,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState<'Incoming Junior' | 'Graduating Senior'>(
    user?.role || 'Incoming Junior'
  );
  const [department, setDepartment] = useState(user?.department || 'Computer Science');
  const [year, setYear] = useState(user?.year || '1st Year (Junior)');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setDepartment(user.department || 'Computer Science');
      setYear(user.year || (user.role === 'Graduating Senior' ? '4th Year (Senior)' : '1st Year (Junior)'));
      setPhone(user.phone || '');
      setError(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleRoleSelect = (nextRole: 'Incoming Junior' | 'Graduating Senior') => {
    setRole(nextRole);
    if (nextRole === 'Graduating Senior') {
      setYear('4th Year (Senior)');
    } else if (year.includes('4th')) {
      setYear('1st Year (Junior)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      let savedProfile: UserProfile;

      if (isBackendLive) {
        savedProfile = await updateUserProfile(
          {
            name: name.trim(),
            role,
            department,
            year,
            phone: phone.trim(),
          },
          user
        );
      } else {
        savedProfile = {
          ...user,
          name: name.trim(),
          role,
          department,
          year,
          phone: phone.trim() || null,
          onboardingCompleted: true,
        };
      }

      if (isFirstTime) {
        confetti({
          particleCount: 80,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#FCE38A', '#F38181', '#4A3C31'],
        });
      }

      onProfileSaved(savedProfile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save student profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#4A3C31]/65 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        if (!isFirstTime) onClose();
      }}
    >
      <div
        className="bg-[#F7F3EE] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#EDE5D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FCE38A] p-6 pb-5 border-b border-[#EDE5D8] relative">
          {!isFirstTime && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3.5">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#4A3C31] text-[#FCE38A] flex items-center justify-center font-extrabold text-xl shrink-0">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#4A3C31] tracking-tight">
                  {isFirstTime ? 'Complete Your Campus Profile' : 'Edit Student Profile'}
                </h2>
              </div>
              <p className="text-xs text-[#746356] truncate">{user.email}</p>
            </div>
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#DDD1BD] text-[11px] font-semibold text-[#4A3C31]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              {user.isDemoAccount
                ? 'Dev Demo Profile'
                : 'Verified via Google Sign-In · Synced to Supabase'}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Academic Role */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#746356] block mb-2">
              How are you using CampusConnect?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleRoleSelect('Incoming Junior')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  role === 'Incoming Junior'
                    ? 'bg-white border-[#F38181] shadow-xs'
                    : 'bg-white/60 border-[#EDE5D8] hover:bg-white text-[#746356]'
                }`}
              >
                <div className="text-xs font-bold text-[#4A3C31] flex items-center justify-between">
                  <span>Junior / Fresher</span>
                  {role === 'Incoming Junior' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#F38181]" />
                  )}
                </div>
                <div className="text-[10px] text-[#746356] mt-0.5">
                  Looking for books, rooms & mentors
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('Graduating Senior')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  role === 'Graduating Senior'
                    ? 'bg-white border-[#F38181] shadow-xs'
                    : 'bg-white/60 border-[#EDE5D8] hover:bg-white text-[#746356]'
                }`}
              >
                <div className="text-xs font-bold text-[#4A3C31] flex items-center justify-between">
                  <span>Graduating Senior</span>
                  {role === 'Graduating Senior' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#F38181]" />
                  )}
                </div>
                <div className="text-[10px] text-[#746356] mt-0.5">
                  Passing down books, room & advice
                </div>
              </button>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Full Name</label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
            />
          </div>

          {/* Department & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              >
                <option>Computer Science</option>
                <option>Electrical & Electronics</option>
                <option>Data Science & AI</option>
                <option>Mechanical Engineering</option>
                <option>Biotechnology</option>
                <option>Civil Engineering</option>
                <option>First Year Common / Tech</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">
                Academic Standing
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              >
                <option>1st Year (Junior)</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year (Senior)</option>
                <option>Final Year Senior</option>
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs font-semibold text-[#4A3C31] block mb-1">
              Campus Contact Number <span className="text-[#99897D] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#99897D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
              />
            </div>
            <p className="text-[11px] text-[#746356] mt-1">
              Stays masked publicly (<code className="bg-white px-1 rounded">+91 98765 •••••</code>) and only unmasks after an OTP reservation is confirmed.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-2xl bg-[#F38181] hover:bg-[#EA6E6E] disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
            <span>
              {isSaving
                ? 'Saving Profile...'
                : isFirstTime
                  ? 'Save & Enter CampusConnect'
                  : 'Update Student Profile'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
