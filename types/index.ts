export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  rating: number;
  ridesCompleted: number;
  favoriteLocations: string[];
  paymentMethods: PaymentMethod[];
  rideHistory: Ride[];
  emergencyContacts: EmergencyContact[];
  twoFactorEnabled: boolean;
}

export interface Driver extends User {
  status: 'active' | 'offline' | 'suspended';
  vehicle: Vehicle;
  documents: Document[];
  earnings: Earnings;
  schedule: Schedule;
  performance: Performance;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  insurance: Insurance;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  expiryDate: string;
}

export interface Document {
  type: string;
  number: string;
  expiryDate: string;
  status: 'approved' | 'pending' | 'rejected';
  lastVerified: string;
}

export interface Earnings {
  total: number;
  lastWeek: number;
  currentWeek: number;
  pending: number;
  stats: {
    totalTrips: number;
    averageRating: number;
    completionRate: number;
    cancellationRate: number;
  };
}

export interface Schedule {
  [key: string]: {
    active: boolean;
    hours: string;
  };
}

export interface Performance {
  rating: number;
  acceptance: number;
  completion: number;
}

export interface PaymentMethod {
  id: string;
  type: 'Visa' | 'Mastercard' | 'Cash App';
  last4?: string;
  username?: string;
  isDefault: boolean;
}

export interface Ride {
  id: string;
  date: string;
  from: string;
  to: string;
  amount: number;
  driverName: string;
  rating: number;
  status: 'completed' | 'cancelled' | 'in-progress';
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface RouteDetails {
  distance: string;
  duration: string;
  fare: string;
  pickupEta?: number;
}

export interface BookingState {
  pickup: Location | null;
  dropoff: Location | null;
  selectedDriver: Driver | null;
  routeDetails: RouteDetails | null;
  status: 'initial' | 'selecting_location' | 'confirming_locations' | 'finding_drivers' | 'driver_found' | 'driver_accepted' | 'driver_arriving' | 'no_drivers_found' | 'error';
}

export interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

export interface AdminStats {
  totalUsers: number;
  totalRides: number;
  revenue: number;
  avgRating: number;
}