import { Sparkles, Search, PlusCircle, Home, Users, BookOpen, Layers, LogIn, LogOut } from 'lucide-react';
import { UserProfile } from '../types';

export type NavTab = 'all' | 'accommodations' | 'mentors' | 'resources' | 'bundles';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenListModal: () => void;
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onOpenListModal,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#F7F3EE]/95 backdrop-blur-md border-b border-[#EDE5D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div 
            onClick={() => onTabChange('all')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#FCE38A] border border-[#DDD1BD] flex items-center justify-center font-extrabold text-xl text-[#4A3C31] shadow-xs group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-[#4A3C31] flex items-center gap-1">
                Campus<span className="text-[#F38181]">Connect</span>
              </div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#746356] block -mt-0.5">
                Senior-Junior Exchange
              </span>
            </div>
          </div>

          {/* Central Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-[#99897D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search rooms, dates, mentors, courses (e.g. CS201, May 15)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white border border-[#EDE5D8] focus:border-[#F38181] text-xs text-[#4A3C31] placeholder-[#99897D] outline-none shadow-xs transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#99897D] hover:text-[#4A3C31]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action: Auth & Post Handoff */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-white border border-[#EDE5D8] shadow-xs">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#EDE5D8]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/mentors/mentor-1.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#FCE38A] text-[#4A3C31] font-bold text-xs flex items-center justify-center shrink-0">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-[#4A3C31] leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-[#746356] leading-tight">
                      {currentUser.role}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-2xl border border-[#EDE5D8] bg-white hover:bg-[#FDE8E8] text-[#746356] hover:text-[#EA6E6E] transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 sm:px-3.5 py-2 rounded-2xl border border-[#DDD1BD] bg-white hover:bg-[#F7F3EE] text-[#4A3C31] text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-[#F38181]" />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={onOpenListModal}
              className="px-3.5 sm:px-4 py-2 rounded-2xl bg-[#F38181] hover:bg-[#EA6E6E] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Post Senior Handoff</span>
              <span className="sm:hidden">Post</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-[#99897D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search rooms, vacancy dates, courses..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white border border-[#EDE5D8] focus:border-[#F38181] text-xs text-[#4A3C31] outline-none"
            />
          </div>
        </div>

        {/* Module Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
          <button
            onClick={() => onTabChange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#4A3C31] text-[#F7F3EE] shadow-xs'
                : 'bg-white/70 text-[#746356] hover:bg-white hover:text-[#4A3C31]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Hub Overview</span>
          </button>

          <button
            onClick={() => onTabChange('accommodations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'accommodations'
                ? 'bg-[#4A3C31] text-[#F7F3EE] shadow-xs'
                : 'bg-white/70 text-[#746356] hover:bg-white hover:text-[#4A3C31]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Accommodations & Vacancies</span>
          </button>

          <button
            onClick={() => onTabChange('mentors')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'mentors'
                ? 'bg-[#4A3C31] text-[#F7F3EE] shadow-xs'
                : 'bg-white/70 text-[#746356] hover:bg-white hover:text-[#4A3C31]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Peer Mentorship</span>
          </button>

          <button
            onClick={() => onTabChange('resources')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'resources'
                ? 'bg-[#4A3C31] text-[#F7F3EE] shadow-xs'
                : 'bg-white/70 text-[#746356] hover:bg-white hover:text-[#4A3C31]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Resource Marketplace</span>
          </button>

          <button
            onClick={() => onTabChange('bundles')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'bundles'
                ? 'bg-[#4A3C31] text-[#F7F3EE] shadow-xs'
                : 'bg-[#FCE38A] text-[#4A3C31] hover:bg-[#FAD872]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F38181]" />
            <span>Graduating Senior Bundles</span>
          </button>
        </div>
      </div>
    </header>
  );
};
