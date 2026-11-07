import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  X, Mail, Lock, Eye, EyeOff, ShieldCheck, 
  GraduationCap, Sparkles, LogIn, UserPlus, CheckCircle2, User
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [role, setRole] = useState<'Incoming Junior' | 'Graduating Senior'>('Incoming Junior');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register extra fields
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('1st Year (Junior)');

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FCE38A', '#F38181', '#4A3C31'],
    });

    const studentName = fullName || (role === 'Graduating Senior' ? 'Rohan Sharma' : 'Aarav Gupta');
    const studentUser: UserProfile = {
      name: studentName,
      email: email || `${studentName.toLowerCase().replace(' ', '.')}@mit.edu`,
      role: role,
      department: department,
      year: role === 'Graduating Senior' ? '4th Year (Senior)' : year,
      avatar: role === 'Graduating Senior' ? '/images/mentors/mentor-1.jpg' : undefined,
      verifiedStudent: true,
    };

    onLogin(studentUser);
    onClose();
  };

  const handleQuickDemoLogin = (demoRole: 'senior' | 'junior') => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FCE38A', '#F38181', '#4A3C31'],
    });

    if (demoRole === 'senior') {
      onLogin({
        name: 'Rohan Sharma',
        email: 'rohan.s22@mit.edu',
        role: 'Graduating Senior',
        department: 'Computer Science & Engineering',
        year: '4th Year (Senior)',
        avatar: '/images/mentors/mentor-1.jpg',
        verifiedStudent: true,
      });
    } else {
      onLogin({
        name: 'Aarav Gupta',
        email: 'aarav.g26@mit.edu',
        role: 'Incoming Junior',
        department: 'First Year Common / Tech',
        year: '1st Year (Junior)',
        avatar: '/images/mentors/mentor-4.jpg',
        verifiedStudent: true,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#4A3C31]/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#F7F3EE] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#EDE5D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FCE38A] p-6 pb-5 border-b border-[#EDE5D8] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#4A3C31]/80 text-[#F7F3EE] hover:bg-[#4A3C31] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#4A3C31] text-[#FCE38A] flex items-center justify-center font-extrabold text-xl shadow-xs">
              C
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#4A3C31] tracking-tight">
                {authMode === 'signin' ? 'Sign In to CampusConnect' : 'Create Verified Student Account'}
              </h2>
              <span className="text-xs text-[#746356] font-medium block">
                Single Sign-On · University Domain Restricted
              </span>
            </div>
          </div>

          {/* Edu Domain Badge */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#DDD1BD] text-[11px] font-semibold text-[#4A3C31]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Restricted to @mit.edu or university credentials</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#EDE5D8] bg-white/70">
          <button
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              authMode === 'signin'
                ? 'border-[#F38181] text-[#4A3C31] bg-[#F7F3EE]'
                : 'border-transparent text-[#746356] hover:text-[#4A3C31]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Student Sign In</span>
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'border-[#F38181] text-[#4A3C31] bg-[#F7F3EE]'
                : 'border-transparent text-[#746356] hover:text-[#4A3C31]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>New Student Register</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 max-h-[75vh]">
          {/* Quick Demo Logins Pill Box */}
          <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#746356] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#F38181]" />
                1-Click Quick Demo Sign In:
              </span>
              <span className="text-[10px] text-[#99897D]">No password required</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('senior')}
                className="px-3 py-2 rounded-xl bg-white hover:bg-[#FCE38A]/50 border border-[#EDE5D8] text-left transition-all group"
              >
                <div className="text-xs font-bold text-[#4A3C31] group-hover:text-[#2C221A] flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#F38181]" />
                  <span>Rohan S. (Senior)</span>
                </div>
                <div className="text-[10px] text-[#746356]">4th Year CSE · Graduating</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('junior')}
                className="px-3 py-2 rounded-xl bg-white hover:bg-[#FCE38A]/50 border border-[#EDE5D8] text-left transition-all group"
              >
                <div className="text-xs font-bold text-[#4A3C31] group-hover:text-[#2C221A] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Aarav G. (Junior)</span>
                </div>
                <div className="text-[10px] text-[#746356]">1st Year · Looking for Room</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#746356] block mb-2">
                Your Academic Role
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole('Incoming Junior')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    role === 'Incoming Junior'
                      ? 'bg-white border-[#F38181] shadow-xs'
                      : 'bg-white/60 border-[#EDE5D8] hover:bg-white text-[#746356]'
                  }`}
                >
                  <div className="text-xs font-bold text-[#4A3C31] flex items-center justify-between">
                    <span>Junior / Fresher</span>
                    {role === 'Incoming Junior' && <CheckCircle2 className="w-3.5 h-3.5 text-[#F38181]" />}
                  </div>
                  <div className="text-[10px] text-[#746356] mt-0.5">Need housing, mentors & books</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('Graduating Senior')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    role === 'Graduating Senior'
                      ? 'bg-white border-[#F38181] shadow-xs'
                      : 'bg-white/60 border-[#EDE5D8] hover:bg-white text-[#746356]'
                  }`}
                >
                  <div className="text-xs font-bold text-[#4A3C31] flex items-center justify-between">
                    <span>Graduating Senior</span>
                    {role === 'Graduating Senior' && <CheckCircle2 className="w-3.5 h-3.5 text-[#F38181]" />}
                  </div>
                  <div className="text-[10px] text-[#746356] mt-0.5">Vacating room & handing down items</div>
                </button>
              </div>
            </div>

            {/* Register extra fields */}
            {authMode === 'register' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-[#4A3C31] block mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                    >
                      <option>Computer Science</option>
                      <option>Electrical & Electronics</option>
                      <option>Data Science & AI</option>
                      <option>Mechanical Engineering</option>
                      <option>Biotechnology</option>
                      <option>Civil Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Current Standing</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                    >
                      <option>1st Year (Junior)</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year (Senior)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">
                University Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#99897D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="your.name@mit.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#4A3C31]">Password</label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to your registered @mit.edu mailbox!')}
                    className="text-[11px] text-[#F38181] hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#99897D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99897D] hover:text-[#4A3C31]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-[#746356] pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#F38181] accent-[#F38181]"
                />
                <span>Remember this campus device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#F38181] hover:bg-[#EA6E6E] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {authMode === 'signin' ? 'Sign In with University Account' : 'Complete Student Registration'}
              </span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#EDE5D8] text-center text-xs text-[#746356]">
          {authMode === 'signin' ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="font-bold text-[#F38181] hover:underline"
              >
                Register with .edu ID
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="font-bold text-[#F38181] hover:underline"
              >
                Back to Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
