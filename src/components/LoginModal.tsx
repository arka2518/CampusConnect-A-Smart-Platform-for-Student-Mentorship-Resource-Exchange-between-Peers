import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  LogIn,
  UserPlus,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { isDemoLoginEnabled, isSupabaseConfigured, supabase } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDemoLogin: (user: UserProfile) => void;
}

const GoogleLogo: React.FC = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
    />
  </svg>
);

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onDemoLogin }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!supabase || !isSupabaseConfigured) {
      setErrorMessage(
        'Google Sign-In is almost ready! Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a ".env" file in the project root, then restart the frontend.'
      );
      return;
    }

    setIsLoadingGoogle(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        setErrorMessage(error.message);
        setIsLoadingGoogle(false);
      }
      // On success, browser redirects to Google OAuth consent screen
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to start Google Sign-In.');
      setIsLoadingGoogle(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!supabase || !isSupabaseConfigured) {
      setErrorMessage(
        'Supabase Auth is not configured in root .env yet. Add VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY or use a Demo Sign-In button below.'
      );
      return;
    }

    setIsSubmittingEmail(true);
    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || email.split('@')[0],
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          onClose();
        } else {
          setInfoMessage(
            `Confirmation link sent to ${email.trim()}. Check your inbox to verify your account, then sign in!`
          );
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleQuickDemoLogin = (demoRole: 'senior' | 'junior') => {
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#FCE38A', '#F38181', '#4A3C31'],
    });

    if (demoRole === 'senior') {
      onDemoLogin({
        name: 'Rohan Sharma',
        email: 'rohan.s22@mit.edu',
        role: 'Graduating Senior',
        department: 'Computer Science',
        year: 'Final Year Senior',
        avatar: '/images/mentors/mentor-1.jpg',
        verifiedStudent: true,
        onboardingCompleted: true,
        isDemoAccount: true,
      });
    } else {
      onDemoLogin({
        name: 'Aarav Gupta',
        email: 'aarav.g26@mit.edu',
        role: 'Incoming Junior',
        department: 'First Year Common / Tech',
        year: '1st Year (Junior)',
        avatar: '/images/mentors/mentor-4.jpg',
        verifiedStudent: true,
        onboardingCompleted: true,
        isDemoAccount: true,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#4A3C31]/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
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
            <img
              src="/images/brand/campus-connect-icon.svg"
              alt="CampusConnect Logo"
              className="w-11 h-11 rounded-xl object-cover shadow-xs border border-[#4A3C31]/15 shrink-0"
            />
            <div>
              <h2 className="text-xl font-extrabold text-[#4A3C31] tracking-tight">
                {authMode === 'signin' ? 'Sign In to CampusConnect' : 'Create Student Account'}
              </h2>
              <span className="text-xs text-[#746356] font-medium block">
                Google / Gmail SSO · Secured with Supabase Auth
              </span>
            </div>
          </div>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#DDD1BD] text-[11px] font-semibold text-[#4A3C31]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Verified student identity for safe campus handoffs</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 max-h-[78vh]">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Primary CTA: Real Google / Gmail OAuth Button */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={isLoadingGoogle}
              onClick={handleGoogleLogin}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-[#FFFDF9] border-2 border-[#EDE5D8] hover:border-[#4A3C31]/40 text-[#4A3C31] font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {isLoadingGoogle ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#F38181]" />
              ) : (
                <GoogleLogo />
              )}
              <span>{isLoadingGoogle ? 'Redirecting to Google...' : 'Continue with Google (Gmail)'}</span>
            </button>
            <p className="text-[11px] text-center text-[#746356]">
              Sign in with your Gmail or institutional Google Workspace account
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#EDE5D8] w-full" />
            <span className="bg-[#F7F3EE] px-3 text-[11px] font-semibold uppercase tracking-wider text-[#99897D] shrink-0">
              or with email & password
            </span>
            <div className="border-t border-[#EDE5D8] w-full" />
          </div>

          {/* Email / Password Tabs */}
          <div className="flex rounded-2xl bg-[#EDE5D8]/60 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-white text-[#4A3C31] shadow-xs'
                  : 'text-[#746356] hover:text-[#4A3C31]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-white text-[#4A3C31] shadow-xs'
                  : 'text-[#746356] hover:text-[#4A3C31]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {authMode === 'register' && (
              <div>
                <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#99897D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="you@gmail.com or you@mit.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#EDE5D8] focus:border-[#F38181] outline-none text-xs text-[#4A3C31]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4A3C31] block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#99897D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
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

            <button
              type="submit"
              disabled={isSubmittingEmail}
              className="w-full py-3 rounded-2xl bg-[#F38181] hover:bg-[#EA6E6E] disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmittingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{authMode === 'signin' ? 'Sign In with Email' : 'Create Account'}</span>
            </button>
          </form>

          {/* Optional Dev Toggle: Quick Demo Role Switcher for Testing 2-Sided OTP Handoff */}
          {isDemoLoginEnabled && (
            <div className="bg-[#FFF8DF] border border-[#FCE38A] rounded-2xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#746356] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#F38181]" />
                  Dev Mode · Quick Demo Switcher
                </span>
                <span className="text-[10px] text-[#99897D]">For testing Buyer ↔ Seller OTP</span>
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
                  <div className="text-[10px] text-[#746356]">4th Year CSE · Seller</div>
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
                  <div className="text-[10px] text-[#746356]">1st Year · Buyer</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
