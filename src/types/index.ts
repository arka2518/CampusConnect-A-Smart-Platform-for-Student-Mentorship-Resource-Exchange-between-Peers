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
    name: string;
    year: string;
    department: string;
    verified: boolean;
  };
  pickupLocation: string;
  description: string;
  handwrittenNotesIncluded: boolean;
  edition: string;
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
  name: string;
  email: string;
  role: 'Incoming Junior' | 'Graduating Senior';
  department: string;
  year: string;
  avatar?: string;
  verifiedStudent: boolean;
}

