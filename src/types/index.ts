export type AccommodationType = 'Single Room' | 'Shared 2BHK' | 'Studio Flat' | 'Hostel Bed' | '1BHK Private';

export interface Accommodation {
  id: string;
  title: string;
  type: AccommodationType;
  rent: number;
  deposit: number;
  vacantDate: string; // The crucial graduation/vacating date
  academicCycleReason: string;
  distanceFromCampus: string;
  location: string;
  image: string;
  rating: number;
  reviewCount: number;
  furnished: 'Fully Furnished' | 'Semi-Furnished' | 'Unfurnished';
  billsIncluded: string[];
  amenities: string[];
  seniorOwner: {
    name: string;
    department: string;
    year: string;
    verified: boolean;
    contactNote: string;
    phonePreview: string;
    emailPreview: string;
  };
  description: string;
  roommatePreferences?: string;
  brokerBypassBadge: boolean;
}

export interface Mentor {
  id: string;
  name: string;
  avatar: string;
  department: string;
  year: string;
  cgpa: string;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  sessionsCompleted: number;
  bio: string;
  specialties: string[];
  coursesTaken: string[];
  upcomingSlots: {
    id: string;
    date: string;
    time: string;
    type: '1-on-1 Coffee Chat' | 'Course Guidance' | 'Resume Review' | 'Room Handoff Walkthrough';
  }[];
  linkedHandoffItem?: string;
  officeHours: string;
}

export type ResourceCategory = 'Textbook' | 'Lab Equipment' | 'Electronics' | 'Study Notes' | 'Hostel Essentials';

export type ResourceStatus = 'Available' | 'Reserved' | 'Handed Over';

export interface ResourceReservation {
  id: string;
  buyerId: string;
  buyerName: string;
  status: 'Pending Handoff' | 'Verified & Complete' | 'Cancelled';
  otpCode?: string;
  createdAt: string;
}

export interface FairPriceEstimate {
  recommended_price: number;
  min_fair_price: number;
  max_fair_price: number;
  historical_avg_price: number | null;
  sample_count: number;
  savings_percent?: number;
  basis: string;
}

export interface MyListingsSummary {
  total: number;
  available: number;
  reserved: number;
  handedOver: number;
  pendingOtpCount: number;
}

export interface MyListingsResponse {
  items: Resource[];
  summary: MyListingsSummary;
}

export interface CartItem {
  cartItemId: string;
  resourceId: string;
  title: string;
  category: string;
  courseCode: string;
  condition: string;
  price: number;
  image: string;
  pickupLocation: string;
  availableUntil: string;
  status: ResourceStatus;
  isAvailable: boolean;
  seller: {
    id: string;
    name: string;
    department: string;
  };
  addedAt: string;
}

export interface CartResponse {
  items: CartItem[];
  totalAmount: number;
  availableCount: number;
  unavailableCount: number;
}

export interface OrderItem {
  resourceId: string;
  reservationId: string;
  title: string;
  category: string;
  courseCode: string;
  image: string;
  price: number;
  pickupLocation: string;
  availableUntil: string;
  reservationStatus: 'Pending Handoff' | 'Verified & Complete' | 'Cancelled';
  otpCode?: string;
  verifiedAt?: string | null;
  seller: {
    id: string;
    name: string;
    department: string;
    phone: string;
    email: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: 'Active' | 'Partially Completed' | 'Completed' | 'Cancelled';
  createdAt: string;
  isDirectReservation: boolean;
  items: OrderItem[];
}

export interface MyOrdersSummary {
  totalOrders: number;
  pendingPickups: number;
  completedPickups: number;
  cancelledPickups: number;
}

export interface MyOrdersResponse {
  orders: Order[];
  summary: MyOrdersSummary;
}

export interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  price: number;
  originalPrice: number;
  condition: 'Like New' | 'Gently Used' | 'Annotated with Exam Notes';
  image: string;
  courseCode: string;
  courseName: string;
  department: string;
  seller: {
    id?: string;
    name: string;
    year: string;
    department: string;
    verified: boolean;
    phone?: string;
    email?: string;
    contactUnmasked?: boolean;
  };
  pickupLocation: string;
  description: string;
  handwrittenNotesIncluded: boolean;
  edition: string;
  availableUntil: string;
  availableUntilIso?: string;
  status?: ResourceStatus;
  activeReservation?: ResourceReservation;
}

export interface SeniorHandoffBundle {
  id: string;
  seniorName: string;
  seniorAvatar: string;
  degree: string;
  graduationTerm: string;
  destination: string;
  quote: string;
  accommodation: Accommodation;
  resource: Resource;
  mentor: Mentor;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: 'Incoming Junior' | 'Graduating Senior';
  department: string;
  year: string;
  phone?: string | null;
  avatar?: string;
  verifiedStudent: boolean;
  onboardingCompleted?: boolean;
  isDemoAccount?: boolean;
}

