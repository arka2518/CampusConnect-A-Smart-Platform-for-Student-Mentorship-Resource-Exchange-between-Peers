import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  mockAccommodations, 
  mockMentors, 
  mockResources, 
  mockSeniorBundles 
} from './data/mockData';
import {
  Accommodation,
  CartItem,
  CartResponse,
  Mentor,
  MyListingsSummary,
  MyOrdersSummary,
  Order,
  Resource,
  UserProfile,
} from './types';
import { fetchCurrentUserProfile, setAuthAccessToken } from './api/authApi';
import { fetchMyListings, fetchResources } from './api/resourcesApi';
import {
  addToCartApi,
  clearCartApi,
  fetchCart,
  fetchMyOrders,
  removeFromCartApi,
} from './api/ordersApi';
import { supabase } from './lib/supabase';
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
import { OnboardingModal } from './components/OnboardingModal';
import { PublishResourceModal } from './components/PublishResourceModal';
import { MyListingsModal } from './components/MyListingsModal';
import { CartDrawer } from './components/CartDrawer';
import { MyOrdersModal } from './components/MyOrdersModal';
import { Toast } from './components/Toast';
import { 
  Home, Users, BookOpen, RefreshCw, Plus, Package, ShoppingBag
} from 'lucide-react';

const EMPTY_CART: CartResponse = {
  items: [],
  totalAmount: 0,
  availableCount: 0,
  unavailableCount: 0,
};

const EMPTY_ORDERS_SUMMARY: MyOrdersSummary = {
  totalOrders: 0,
  pendingPickups: 0,
  completedPickups: 0,
  cancelledPickups: 0,
};

function recomputeCart(items: CartItem[]): CartResponse {
  let totalAmount = 0;
  let availableCount = 0;
  let unavailableCount = 0;
  for (const item of items) {
    if (item.isAvailable) {
      availableCount++;
      totalAmount += item.price;
    } else {
      unavailableCount++;
    }
  }
  return { items, totalAmount, availableCount, unavailableCount };
}

function recomputeOrdersSummary(orders: Order[]): MyOrdersSummary {
  let pendingPickups = 0;
  let completedPickups = 0;
  let cancelledPickups = 0;
  for (const order of orders) {
    for (const item of order.items) {
      if (item.reservationStatus === 'Pending Handoff') pendingPickups++;
      else if (item.reservationStatus === 'Verified & Complete') completedPickups++;
      else if (item.reservationStatus === 'Cancelled') cancelledPickups++;
    }
  }
  return {
    totalOrders: orders.length,
    pendingPickups,
    completedPickups,
    cancelledPickups,
  };
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication state (hydrates automatically from Supabase Auth / Google OAuth)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isFirstTimeOnboarding, setIsFirstTimeOnboarding] = useState(false);

  // Live Resource Exchange state (falls back cleanly to mockResources if backend is offline)
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [myListings, setMyListings] = useState<Resource[]>([]);
  const [myListingsSummary, setMyListingsSummary] = useState<MyListingsSummary>({
    total: 0,
    available: 0,
    reserved: 0,
    handedOver: 0,
    pendingOtpCount: 0,
  });
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  // Shopping Cart & Buyer Orders state
  const [cart, setCart] = useState<CartResponse>(EMPTY_CART);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myOrdersSummary, setMyOrdersSummary] = useState<MyOrdersSummary>(EMPTY_ORDERS_SUMMARY);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);

  // Sub-category filters
  const [roomFilter, setRoomFilter] = useState('All');
  const [mentorFilter, setMentorFilter] = useState('All');
  const [resourceFilter, setResourceFilter] = useState('All');

  // Modals state
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isMyListingsOpen, setIsMyListingsOpen] = useState(false);

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; subtext?: string } | null>(null);

  // Sync Supabase Auth session (Google / Gmail OAuth & Email login) with our PostgreSQL `users` table
  const syncSupabaseSession = useCallback(
    async (
      session: {
        access_token: string;
        user: {
          email?: string;
          user_metadata?: { full_name?: string; name?: string; avatar_url?: string; picture?: string };
        };
      } | null,
      showWelcomeToast: boolean
    ) => {
      if (!session) {
        setAuthAccessToken(null);
        setCurrentUser((prev) => (prev?.isDemoAccount ? prev : null));
        return;
      }

      setAuthAccessToken(session.access_token);

      try {
        const profile = await fetchCurrentUserProfile(session.access_token);
        setCurrentUser(profile);

        if (!profile.onboardingCompleted) {
          setIsFirstTimeOnboarding(true);
          setIsOnboardingOpen(true);
        } else if (showWelcomeToast) {
          setToast({
            message: `Welcome back, ${profile.name}!`,
            subtext: `Signed in via Google · ${profile.role}`,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        // If backend explicitly rejected an unauthorized email domain, sign out cleanly
        if (msg.toLowerCase().includes('approved email domains')) {
          await supabase?.auth.signOut();
          setAuthAccessToken(null);
          setCurrentUser(null);
          setToast({
            message: 'Sign-In Blocked by Campus Domain Policy',
            subtext: msg,
          });
          return;
        }

        // Fallback if backend API isn't running yet: still reflect real Google profile locally
        const email = session.user.email || 'student@gmail.com';
        const fallbackUser: UserProfile = {
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            email.split('@')[0],
          email,
          role: 'Incoming Junior',
          department: 'Computer Science',
          year: '1st Year (Junior)',
          avatar:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture,
          verifiedStudent: true,
          onboardingCompleted: true,
          isDemoAccount: false,
        };
        setCurrentUser(fallbackUser);
      }
    },
    []
  );

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) {
        void syncSupabaseSession(data.session, false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void syncSupabaseSession(session, event === 'SIGNED_IN');
      } else if (event === 'SIGNED_OUT') {
        setAuthAccessToken(null);
        setCurrentUser((prev) => (prev?.isDemoAccount ? prev : null));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncSupabaseSession]);

  const computeSummary = useCallback((items: Resource[]): MyListingsSummary => {
    let available = 0;
    let reserved = 0;
    let handedOver = 0;
    let pendingOtpCount = 0;
    for (const item of items) {
      const s = item.status || 'Available';
      if (s === 'Available') available++;
      else if (s === 'Reserved') {
        reserved++;
        if (item.activeReservation?.status === 'Pending Handoff') pendingOtpCount++;
      } else if (s === 'Handed Over') handedOver++;
    }
    return { total: items.length, available, reserved, handedOver, pendingOtpCount };
  }, []);

  const loadMyListings = useCallback(async () => {
    if (!currentUser) {
      setMyListings([]);
      setMyListingsSummary({ total: 0, available: 0, reserved: 0, handedOver: 0, pendingOtpCount: 0 });
      return;
    }

    try {
      const result = await fetchMyListings(currentUser);
      setMyListings(result.items);
      setMyListingsSummary(result.summary);
    } catch {
      // Offline fallback: match owned items from local resources state
      const mine = resources.filter(
        (r) =>
          (r.seller.email && r.seller.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          r.seller.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      setMyListings(mine);
      setMyListingsSummary(computeSummary(mine));
    }
  }, [currentUser, resources, computeSummary]);

  const loadLiveResources = useCallback(async () => {
    setIsLoadingResources(true);
    try {
      const liveItems = await fetchResources(currentUser);
      setResources(liveItems);
      setIsBackendLive(true);
    } catch {
      // Backend server is not started or unreachable; preserve graceful offline demo mode
      setIsBackendLive(false);
    } finally {
      setIsLoadingResources(false);
    }
  }, [currentUser]);

  const loadCart = useCallback(async () => {
    if (!currentUser) {
      setCart(EMPTY_CART);
      return;
    }
    if (!isBackendLive) return;
    try {
      const liveCart = await fetchCart(currentUser);
      setCart(liveCart);
    } catch {
      // Preserve local cart if backend temporarily unreachable
    }
  }, [currentUser, isBackendLive]);

  const loadMyOrders = useCallback(async () => {
    if (!currentUser) {
      setMyOrders([]);
      setMyOrdersSummary(EMPTY_ORDERS_SUMMARY);
      return;
    }
    if (!isBackendLive) return;
    try {
      const data = await fetchMyOrders(currentUser);
      setMyOrders(data.orders);
      setMyOrdersSummary(data.summary);
    } catch {
      // Preserve offline orders if backend temporarily unreachable
    }
  }, [currentUser, isBackendLive]);

  const isResourceOwner = useCallback(
    (res: Resource): boolean => {
      if (!currentUser) return false;
      if (res.seller.email && res.seller.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return true;
      }
      return res.seller.name.toLowerCase() === currentUser.name.toLowerCase();
    },
    [currentUser]
  );

  const cartResourceIds = useMemo(
    () => new Set(cart.items.map((i) => i.resourceId)),
    [cart.items]
  );

  const handleAddToCart = useCallback(
    async (resource: Resource) => {
      if (!currentUser) {
        setIsLoginModalOpen(true);
        return;
      }
      if (isResourceOwner(resource)) {
        setToast({
          message: 'Cannot add your own listing',
          subtext: 'You are the seller of this resource.',
        });
        return;
      }
      if (cartResourceIds.has(resource.id)) {
        setIsCartOpen(true);
        return;
      }

      if (!isBackendLive) {
        const newItem: CartItem = {
          cartItemId: `offline-cart-${Date.now()}`,
          resourceId: resource.id,
          title: resource.title,
          category: resource.category,
          courseCode: resource.courseCode,
          condition: resource.condition,
          price: resource.price,
          image: resource.image,
          pickupLocation: resource.pickupLocation,
          availableUntil: resource.availableUntil,
          status: resource.status || 'Available',
          isAvailable: !resource.status || resource.status === 'Available',
          seller: {
            id: resource.seller.id || 'offline-seller',
            name: resource.seller.name,
            department: resource.seller.department,
          },
          addedAt: new Date().toISOString(),
        };
        setCart((prev) => recomputeCart([newItem, ...prev.items]));
        setToast({
          message: `Added "${resource.title}" to Cart`,
          subtext: 'Open Cart anytime to checkout and generate handover OTPs.',
        });
        return;
      }

      try {
        const updatedCart = await addToCartApi(resource.id, currentUser);
        setCart(updatedCart);
        setToast({
          message: `Added "${resource.title}" to Cart`,
          subtext: `${updatedCart.items.length} item${updatedCart.items.length === 1 ? '' : 's'} in cart · Total ₹${updatedCart.totalAmount}`,
        });
      } catch (err) {
        setToast({
          message: 'Could not add to Cart',
          subtext: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    },
    [currentUser, isResourceOwner, cartResourceIds, isBackendLive]
  );

  const handleRemoveFromCart = useCallback(
    async (resourceId: string) => {
      if (!currentUser) return;
      if (!isBackendLive) {
        setCart((prev) => recomputeCart(prev.items.filter((i) => i.resourceId !== resourceId)));
        return;
      }
      const updatedCart = await removeFromCartApi(resourceId, currentUser);
      setCart(updatedCart);
    },
    [currentUser, isBackendLive]
  );

  const handleClearCart = useCallback(async () => {
    if (!currentUser) return;
    if (!isBackendLive) {
      setCart(EMPTY_CART);
      return;
    }
    const updatedCart = await clearCartApi(currentUser);
    setCart(updatedCart);
  }, [currentUser, isBackendLive]);

  useEffect(() => {
    void loadLiveResources();
  }, [loadLiveResources]);

  useEffect(() => {
    void loadMyListings();
    void loadCart();
    void loadMyOrders();
  }, [currentUser, isBackendLive]);

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

  // Filtered Resources (uses live Supabase data when backend is running)
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesSearch = 
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.seller.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = resourceFilter === 'All' || res.category === resourceFilter;
      return matchesSearch && matchesCategory;
    });
  }, [resources, searchQuery, resourceFilter]);

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
        onEditProfile={() => {
          setIsFirstTimeOnboarding(false);
          setIsOnboardingOpen(true);
        }}
        onLogout={async () => {
          if (supabase && !currentUser?.isDemoAccount) {
            await supabase.auth.signOut();
          }
          setAuthAccessToken(null);
          setCurrentUser(null);
          setCart(EMPTY_CART);
          setMyOrders([]);
          setMyOrdersSummary(EMPTY_ORDERS_SUMMARY);
          setToast({
            message: 'Signed out successfully',
            subtext: 'Click Sign In anytime to log in with Google or a demo account.',
          });
        }}
        cartCount={cart.items.length}
        onOpenCart={() => {
          if (currentUser && isBackendLive) {
            void loadCart();
          }
          setIsCartOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Academic Calendar Turnover Banner */}
        <AcademicCycleBanner
          onExploreHandoffs={() => setActiveTab('bundles')}
          resourceCount={resources.length}
        />

        {/* 1. Senior Departure Unified Bundle Showcase (The Core Thesis Model) */}
        {(activeTab === 'all' || activeTab === 'bundles') && (
          <div id="bundles-section">
            <SeniorBundleShowcase
              bundles={mockSeniorBundles}
              onSelectAccommodation={(apt) => setSelectedAccommodation(apt)}
              onSelectMentor={(mentor) => setSelectedMentor(mentor)}
              onSelectResource={(res) => {
                const liveMatch = resources.find((r) => r.title === res.title);
                setSelectedResource(liveMatch || res);
              }}
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
            <div className="flex flex-col gap-4 pb-4 border-b border-[#EDE5D8]">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#F38181] uppercase tracking-wider mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Academic Resource Exchange</span>
                    <button
                      type="button"
                      onClick={() => {
                        void loadLiveResources();
                        void loadMyListings();
                        void loadCart();
                        void loadMyOrders();
                      }}
                      title="Refresh resources from backend"
                      className={`normal-case tracking-normal inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                        isBackendLive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-[#EDE5D8] text-[#746356] hover:bg-[#DDD1BD]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isBackendLive ? 'bg-emerald-600' : 'bg-[#99897D]'
                        }`}
                      />
                      {isBackendLive ? 'Live Supabase DB' : 'Offline Demo Data'}
                      <RefreshCw className={`w-3 h-3 ${isLoadingResources ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A3C31]">
                    P2P Course Books & Materials
                  </h2>
                  <p className="text-xs sm:text-sm text-[#746356] mt-1">
                    Textbooks, instruments, and calculators priced fairly instead of discarded at semester end. Handover directly on campus.
                  </p>
                </div>

                {/* Buyer & Seller Action Buttons: My Orders, My Listings, Sell / List Item */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        setIsLoginModalOpen(true);
                        return;
                      }
                      void loadMyOrders();
                      setIsMyOrdersOpen(true);
                    }}
                    className="relative px-3.5 py-2 rounded-2xl bg-white hover:bg-[#FFF8DF] border border-[#DDD1BD] text-[#4A3C31] text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#F38181]" />
                    <span>My Orders</span>
                    {currentUser && myOrdersSummary.pendingPickups > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FCE38A] text-[#4A3C31] text-[10px] font-extrabold">
                        {myOrdersSummary.pendingPickups}
                      </span>
                    )}
                    {myOrdersSummary.pendingPickups > 0 && (
                      <span
                        title={`${myOrdersSummary.pendingPickups} active pickup OTP(s)`}
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#F7F3EE]"
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        setIsLoginModalOpen(true);
                        return;
                      }
                      void loadMyListings();
                      setIsMyListingsOpen(true);
                    }}
                    className="relative px-3.5 py-2 rounded-2xl bg-white hover:bg-[#FFF8DF] border border-[#DDD1BD] text-[#4A3C31] text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5 text-[#F38181]" />
                    <span>My Listings</span>
                    {currentUser && myListingsSummary.total > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FCE38A] text-[#4A3C31] text-[10px] font-extrabold">
                        {myListingsSummary.total}
                      </span>
                    )}
                    {myListingsSummary.pendingOtpCount > 0 && (
                      <span
                        title={`${myListingsSummary.pendingOtpCount} pending buyer OTP(s) to verify`}
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ff1d1d] ring-2 ring-[#F7F3EE]"
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        setIsLoginModalOpen(true);
                        return;
                      }
                      setEditingResource(null);
                      setIsPublishModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-2xl bg-[#F38181] hover:bg-[#EA6E6E] text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Sell / List Item</span>
                  </button>
                </div>
              </div>

              {/* Resource Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {['All', 'Textbook', 'Electronics', 'Lab Equipment', 'Study Notes', 'Hostel Essentials'].map((cat) => (
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
                    isInCart={cartResourceIds.has(res.id)}
                    isOwner={isResourceOwner(res)}
                    onAddToCart={(item) => void handleAddToCart(item)}
                    onOpenCart={() => setIsCartOpen(true)}
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
                <img
                  src="/images/brand/campus-connect-icon.svg"
                  alt="CampusConnect Logo"
                  className="w-8 h-8 rounded-lg object-cover shadow-xs"
                />
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
        currentUser={currentUser}
        isBackendLive={isBackendLive}
        isInCart={selectedResource ? cartResourceIds.has(selectedResource.id) : false}
        onAddToCart={(item) => void handleAddToCart(item)}
        onOpenCart={() => setIsCartOpen(true)}
        onClose={() => setSelectedResource(null)}
        onResourceUpdated={(updated) => {
          setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          setMyListings((prev) => {
            const next = prev.map((r) => (r.id === updated.id ? updated : r));
            setMyListingsSummary(computeSummary(next));
            return next;
          });
          setSelectedResource(updated);
          void loadMyOrders();
          void loadCart();
        }}
        onResourceDeleted={(deletedId) => {
          setResources((prev) => prev.filter((r) => r.id !== deletedId));
          setMyListings((prev) => {
            const next = prev.filter((r) => r.id !== deletedId);
            setMyListingsSummary(computeSummary(next));
            return next;
          });
          setSelectedResource(null);
          void loadCart();
        }}
        onEditListing={(resToEdit) => {
          setSelectedResource(null);
          setEditingResource(resToEdit);
          setIsPublishModalOpen(true);
        }}
        onNotify={(message, subtext) => setToast({ message, subtext })}
        onRequireLogin={() => {
          setSelectedResource(null);
          setIsLoginModalOpen(true);
        }}
      />

      <PublishResourceModal
        isOpen={isPublishModalOpen}
        resourceToEdit={editingResource}
        currentUser={currentUser}
        isBackendLive={isBackendLive}
        onClose={() => {
          setIsPublishModalOpen(false);
          setEditingResource(null);
        }}
        onSaved={(saved, isEdit) => {
          if (isEdit) {
            setResources((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
            setMyListings((prev) => {
              const next = prev.map((r) => (r.id === saved.id ? saved : r));
              setMyListingsSummary(computeSummary(next));
              return next;
            });
            setToast({
              message: `Updated "${saved.title}"!`,
              subtext: `Changes saved ${isBackendLive ? 'to Supabase' : 'locally'}.`,
            });
          } else {
            setResources((prev) => [saved, ...prev]);
            setMyListings((prev) => {
              const next = [saved, ...prev];
              setMyListingsSummary(computeSummary(next));
              return next;
            });
            setToast({
              message: `Published "${saved.title}"!`,
              subtext: `Available until ${saved.availableUntil} · Now live in Resource Exchange.`,
            });
          }
        }}
        onRequireLogin={() => {
          setIsPublishModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <MyListingsModal
        isOpen={isMyListingsOpen}
        items={myListings}
        summary={myListingsSummary}
        currentUser={currentUser}
        isBackendLive={isBackendLive}
        onClose={() => setIsMyListingsOpen(false)}
        onOpenPublishNew={() => {
          setEditingResource(null);
          setIsPublishModalOpen(true);
        }}
        onEditResource={(resToEdit) => {
          setIsMyListingsOpen(false);
          setEditingResource(resToEdit);
          setIsPublishModalOpen(true);
        }}
        onResourceUpdated={(updated) => {
          setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          setMyListings((prev) => {
            const next = prev.map((r) => (r.id === updated.id ? updated : r));
            setMyListingsSummary(computeSummary(next));
            return next;
          });
          void loadMyOrders();
          void loadCart();
        }}
        onResourceDeleted={(deletedId) => {
          setResources((prev) => prev.filter((r) => r.id !== deletedId));
          setMyListings((prev) => {
            const next = prev.filter((r) => r.id !== deletedId);
            setMyListingsSummary(computeSummary(next));
            return next;
          });
        }}
        onNotify={(message, subtext) => setToast({ message, subtext })}
      />

      <ListHandoffModal
        isOpen={isListModalOpen}
        currentUser={currentUser}
        isBackendLive={isBackendLive}
        onClose={() => setIsListModalOpen(false)}
        onSubmitHandoff={(summary, createdResource) => {
          if (createdResource) {
            setResources((prev) => [createdResource, ...prev]);
            setMyListings((prev) => {
              const next = [createdResource, ...prev];
              setMyListingsSummary(computeSummary(next));
              return next;
            });
          }
          setToast({
            message: 'Senior Handoff Listed Successfully!',
            subtext: summary,
          });
        }}
        onRequireLogin={() => {
          setIsListModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onDemoLogin={async (user) => {
          if (supabase) {
            await supabase.auth.signOut();
          }
          setAuthAccessToken(null);
          setCurrentUser(user);
          setToast({
            message: `Switched to Demo Account: ${user.name}`,
            subtext: `${user.role} · ${user.department}`,
          });
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        user={currentUser}
        isBackendLive={isBackendLive}
        isFirstTime={isFirstTimeOnboarding}
        onClose={() => setIsOnboardingOpen(false)}
        onProfileSaved={(updated) => {
          setCurrentUser(updated);
          setToast({
            message: isFirstTimeOnboarding
              ? `Welcome to CampusConnect, ${updated.name}!`
              : 'Student Profile Updated',
            subtext: `${updated.role} · ${updated.department} (${updated.year})`,
          });
        }}
      />

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        currentUser={currentUser}
        isBackendLive={isBackendLive}
        onClose={() => setIsCartOpen(false)}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckoutSuccess={(order) => {
          setCart(EMPTY_CART);
          setIsCartOpen(false);
          if (isBackendLive) {
            void loadLiveResources();
            void loadMyOrders();
            void loadMyListings();
          } else {
            // Update local offline state immediately
            const reservedIds = new Set(order.items.map((i) => i.resourceId));
            setResources((prev) =>
              prev.map((r) => {
                if (!reservedIds.has(r.id)) return r;
                const match = order.items.find((i) => i.resourceId === r.id);
                return {
                  ...r,
                  status: 'Reserved',
                  seller: {
                    ...r.seller,
                    phone: match?.seller.phone || '+91 98765 43210',
                    email: match?.seller.email || `${r.seller.name.toLowerCase().replace(/\s+/g, '.')}@mit.edu`,
                    contactUnmasked: true,
                  },
                  activeReservation: match
                    ? {
                        id: match.reservationId,
                        buyerId: currentUser?.id || 'offline-buyer',
                        buyerName: currentUser?.name || 'Student',
                        status: 'Pending Handoff',
                        otpCode: match.otpCode,
                        createdAt: order.createdAt,
                      }
                    : r.activeReservation,
                };
              })
            );
            setMyOrders((prev) => {
              const next = [order, ...prev];
              setMyOrdersSummary(recomputeOrdersSummary(next));
              return next;
            });
          }
          setIsMyOrdersOpen(true);
          setToast({
            message: `Order ${order.orderNumber} Confirmed!`,
            subtext: `${order.items.length} item${order.items.length === 1 ? '' : 's'} reserved · Pay ₹${order.totalAmount} via Cash/UPI at campus meetup.`,
          });
        }}
        onRequireLogin={() => {
          setIsCartOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <MyOrdersModal
        isOpen={isMyOrdersOpen}
        orders={myOrders}
        summary={myOrdersSummary}
        currentUser={currentUser}
        isBackendLive={isBackendLive}
        onClose={() => setIsMyOrdersOpen(false)}
        onReservationCancelled={(updatedResource, reservationId) => {
          if (isBackendLive) {
            setResources((prev) =>
              prev.map((r) => (r.id === updatedResource.id ? updatedResource : r))
            );
            void loadMyOrders();
            void loadMyListings();
          } else {
            setResources((prev) =>
              prev.map((r) =>
                r.id === updatedResource.id
                  ? { ...r, status: 'Available', activeReservation: undefined }
                  : r
              )
            );
            setMyOrders((prev) => {
              const next: Order[] = prev.map((order) => {
                const updatedItems = order.items.map((item) =>
                  item.reservationId === reservationId
                    ? { ...item, reservationStatus: 'Cancelled' as const, otpCode: undefined }
                    : item
                );
                const allCancelled = updatedItems.every((i) => i.reservationStatus === 'Cancelled');
                return {
                  ...order,
                  status: allCancelled ? ('Cancelled' as const) : order.status,
                  items: updatedItems,
                };
              });
              setMyOrdersSummary(recomputeOrdersSummary(next));
              return next;
            });
          }
        }}
        onNotify={(message, subtext) => setToast({ message, subtext })}
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
