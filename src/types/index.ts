export interface IUser {
  _id?: string;
  name: string;
  email: string;
  photoURL?: string;
  password?: string;
  createdAt: string;
}

export interface IStudio {
  _id?: string;
  id?: string;
  title: string;
  category: 'Photo Studio' | 'Sound Stage' | 'Podcast Room' | 'Music Suite' | 'Art Workshop';
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  location: string;
  images: string[];
  imageUrl: string;
  amenities: string[];
  overview: string;
  rating: number;
  reviewCount: number;
  ownerEmail: string;
  ownerName: string;
  ownerPhoto?: string;
  featured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface IBooking {
  _id?: string;
  id?: string;
  studioId: string;
  studioTitle: string;
  studioImage: string;
  studioLocation: string;
  category: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  shootDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm format e.g. 10:00
  endTime: string;   // HH:mm format e.g. 14:00
  durationHours: number;
  hourlyRate: number;
  securityDeposit: number;
  subtotal: number;
  totalCost: number;
  crewCount: number;
  gearNotes?: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface IWishlistItem {
  _id?: string;
  userEmail: string;
  studioId: string;
  createdAt: string;
}
