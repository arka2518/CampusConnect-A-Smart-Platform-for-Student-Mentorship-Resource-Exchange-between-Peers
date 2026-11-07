import React, { useState, useMemo } from 'react';
import { 
  mockAccommodations, 
  mockMentors, 
  mockResources, 
  mockSeniorBundles 
} from './data/mockData';
import { Accommodation, Mentor, Resource, UserProfile } from './types';
import { Navbar, NavTab } from './components/Navbar';
import { AcademicCycleBanner } from './components/AcademicCycleBanner';
import { AccommodationCard } from './components/AccommodationCard';
import { AccommodationModal } from './components/AccommodationModal';
import { MentorCard } from './components/MentorCard';
import { MentorModal } from './components/MentorModal';
import { ResourceCard } from './components/ResourceCard';
import { ResourceModal } from './components/ResourceModal';
import { SeniorBundleShowcase } from './components/SeniorBundleShowcase';
import { ListHandoffModal } from './components/ListHandoffModal';
import { LoginModal } from './components/LoginModal';
import { Toast } from './components/Toast';
import { 
  Home, Users, BookOpen
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    name: 'Aarav Gupta',
    email: 'aarav.g26@mit.edu',
    role: 'Incoming Junior',
    department: 'First Year Common / Tech',
    year: '1st Year (Junior)',
    avatar: '/images/mentors/mentor-4.jpg',
    verifiedStudent: true,
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sub-category filters
  const [roomFilter, setRoomFilter] = useState('All');
  const [mentorFilter, setMentorFilter] = useState('All');
  const [resourceFilter, setResourceFilter] = useState('All');

  // Modals state
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; subtext?: string } | null>(null);

  // Filtered Accommodations
  const filteredAccommodations = useMemo(() => {
    return mockAccommodations.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vacantDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.seniorOwner.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = roomFilter === 'All' || item.type === roomFilter;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, roomFilter]);

  // Filtered Mentors
  const filteredMentors = useMemo(() => {
    return mockMentors.filter((mentor) => {
      const matchesSearch = 
        mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mentor.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mentor.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        mentor.coursesTaken.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesDept = mentorFilter === 'All' || mentor.department.includes(mentorFilter);
      return matchesSearch && matchesDept;
    });
  }, [searchQuery, mentorFilter]);

  // Filtered Resources
  const filteredResources = useMemo(() => {
    return mockResources.filter((res) => {
      const matchesSearch = 
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.seller.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = resourceFilter === 'All' || res.category === resourceFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, resourceFilter]);

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#4A3C31] flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenListModal={() => setIsListModalOpen(true)}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          setToast({
            message: 'Signed out successfully',
            subtext: 'You are now viewing in guest demo mode.',
          });
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Academic Calendar Turnover Banner */}
        <AcademicCycleBanner onExploreHandoffs={() => setActiveTab('bundles')} />

        {/* 1. Senior Departure Unified Bundle Showcase (The Core Thesis Model) */}
        {(activeTab === 'all' || activeTab === 'bundles') && (
          <div id="bundles-section">
            <SeniorBundleShowcase
              bundles={mockSeniorBundles}
              onSelectAccommodation={(apt) => setSelectedAccommodation(apt)}
              onSelectMentor={(mentor) => setSelectedMentor(mentor)}
              onSelectResource={(res) => setSelectedResource(res)}
            />
          </div>
        )}

        {/* 2. Accommodation & Vacancy Module */}
        {(activeTab === 'all' || activeTab === 'accommodations') && (
          <section id="accommodations-section" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EDE5D8]">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#F38181] uppercase tracking-wider mb-1">
                  <Home className="w-4 h-4" />
                  Housing & Vacancy Sync
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A3C31]">
                  Accommodations & Turnover Vacancies
                </h2>
                <p className="text-xs sm:text-sm text-[#746356] mt-1">
                  Each property displays the verified <strong>date it will be vacant</strong> as graduating seniors depart. No broker lock-ins.
                </p>
              </div>

              {/* Housing Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {['All', 'Studio Flat', 'Shared 2BHK', 'Single Room', '1BHK Private', 'Hostel Bed'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setRoomFilter(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      roomFilter === type
                        ? 'bg-[#FCE38A] text-[#4A3C31] shadow-xs'
                        : 'bg-white text-[#746356] hover:bg-[#EDE5D8]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Accommodation Cards */}
            {filteredAccommodations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccommodations.map((apt) => (
                  <AccommodationCard
                    key={apt.id}
                    accommodation={apt}
                    onSelect={(selected) => setSelectedAccommodation(selected)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#EDE5D8]">
                <p className="text-sm text-[#746356]">No accommodations match your filter.</p>
              </div>
            )}
          </section>
        )}

        {/* 3. Peer-to-Peer Mentorship Module */}
        {(activeTab === 'all' || activeTab === 'mentors') && (
          <section id="mentors-section" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EDE5D8]">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#F38181] uppercase tracking-wider mb-1">
                  <Users className="w-4 h-4" />
                  Senior Mentorship Network
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A3C31]">
                  Verified Senior Mentors
                </h2>
                <p className="text-xs sm:text-sm text-[#746356] mt-1">
                  Connect with final-year students for 1-on-1 guidance, course syllabus tips, and housing orientation before they graduate.
                </p>
              </div>

              {/* Department Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {['All', 'Computer Science', 'Electrical', 'Data Science', 'Mechanical', 'Biotechnology', 'Civil'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setMentorFilter(dept)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      mentorFilter === dept
                        ? 'bg-[#FCE38A] text-[#4A3C31] shadow-xs'
                        : 'bg-white text-[#746356] hover:bg-[#EDE5D8]'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Mentor Cards */}
            {filteredMentors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor) => (
                  <MentorCard
                    key={mentor.id}
                    mentor={mentor}
                    onSelect={(selected) => setSelectedMentor(selected)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#EDE5D8]">
                <p className="text-sm text-[#746356]">No mentors found matching your search.</p>
              </div>
            )}
          </section>
        )}

        {/* 4. Resource Exchange Marketplace */}
        {(activeTab === 'all' || activeTab === 'resources') && (
          <section id="resources-section" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EDE5D8]">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#F38181] uppercase tracking-wider mb-1">
                  <BookOpen className="w-4 h-4" />
                  Academic Resource Exchange
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A3C31]">
                  P2P Course Books & Materials
                </h2>
                <p className="text-xs sm:text-sm text-[#746356] mt-1">
                  Textbooks, instruments, and calculators priced fairly instead of discarded at semester end. Handover directly on campus.
                </p>
              </div>

              {/* Resource Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {['All', 'Textbook', 'Electronics', 'Lab Equipment', 'Hostel Essentials'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setResourceFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      resourceFilter === cat
                        ? 'bg-[#FCE38A] text-[#4A3C31] shadow-xs'
                        : 'bg-white text-[#746356] hover:bg-[#EDE5D8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Resource Cards */}
            {filteredResources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((res) => (
                  <ResourceCard
                    key={res.id}
                    resource={res}
                    onSelect={(selected) => setSelectedResource(selected)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#EDE5D8]">
                <p className="text-sm text-[#746356]">No resources found matching your search.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#EDE5D8] mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="w-7 h-7 rounded-xl bg-[#FCE38A] text-[#4A3C31] font-bold text-sm flex items-center justify-center">
                  C
                </span>
                <span className="font-extrabold text-base text-[#4A3C31]">CampusConnect</span>
              </div>
              <p className="text-xs text-[#746356] max-w-md">
                A unified student platform bridging mentorship access, resource reuse, and accommodation transitions tied to the academic calendar.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-[#746356]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                System Operational · Academic Year 26-27 Cycle
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals Container */}
      <AccommodationModal
        accommodation={selectedAccommodation}
        onClose={() => setSelectedAccommodation(null)}
        onBookHandoff={(title, senior) => {
          setSelectedAccommodation(null);
          setToast({
            message: `Handoff Requested for "${title}"!`,
            subtext: `A walkthrough notification has been sent to ${senior}. Check your student email for the meet link.`,
          });
        }}
      />

      <MentorModal
        mentor={selectedMentor}
        onClose={() => setSelectedMentor(null)}
        onBookSlot={(mentorName, slotTime) => {
          setSelectedMentor(null);
          setToast({
            message: `Mentorship Session Booked with ${mentorName}!`,
            subtext: `Confirmed for ${slotTime}. A calendar invitation has been generated.`,
          });
        }}
      />

      <ResourceModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        onReserveItem={(title, price) => {
          setSelectedResource(null);
          setToast({
            message: `Reserved "${title}" for ₹${price}!`,
            subtext: 'Your campus handover OTP is 8421. Show this to the senior seller upon meeting.',
          });
        }}
      />

      <ListHandoffModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSubmitHandoff={(summary) => {
          setToast({
            message: 'Senior Handoff Listed Successfully!',
            subtext: summary,
          });
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(user) => {
          setCurrentUser(user);
          setToast({
            message: `Welcome, ${user.name}!`,
            subtext: `Verified as ${user.role} · ${user.department}`,
          });
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          subtext={toast.subtext}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default App;
