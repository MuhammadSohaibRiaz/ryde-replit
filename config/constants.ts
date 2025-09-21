export const MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCeiu1ZkE95Ler7aYMCifN0cKZ9Xa6EHb0",
  libraries: ["places", "geometry"] as const,
  defaultCenter: { lat: 51.5074, lng: -0.1278 }, // London center
  defaultZoom: 13,
  mapOptions: {
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
  },
};

export const BOOKING_STATES = {
  INITIAL: 'initial',
  SELECTING_LOCATION: 'selecting_location',
  CONFIRMING_LOCATIONS: 'confirming_locations',
  FINDING_DRIVERS: 'finding_drivers',
  DRIVER_FOUND: 'driver_found',
  DRIVER_ACCEPTED: 'driver_accepted',
  DRIVER_ARRIVING: 'driver_arriving',
  NO_DRIVERS_FOUND: 'no_drivers_found',
  ERROR: 'error',
} as const;

export const ROUTES = {
  HOME: '/',
  MAIN: '/main',
  PROFILE: '/profile',
  DRIVER_PROFILE: '/driver-profile',
  REGISTER_DRIVER: '/register-driver',
  ADMIN: '/admin',
  AUTH: {
    PASSENGER_LOGIN: '/auth/passenger/login',
    PASSENGER_REGISTER: '/auth/passenger/register',
    DRIVER_LOGIN: '/auth/driver/login',
    DRIVER_REGISTER: '/auth/driver/register',
  },
} as const;

export const PRICING_PLANS = [
  {
    id: 'silver',
    name: 'Silver Plan',
    price: 99,
    features: [
      'Up to 300 Trips',
      'Basic Support Access',
      'Access to city drives',
      'Keep 80% of profits',
      '10% off fuel',
    ],
    color: 'gray',
  },
  {
    id: 'gold',
    name: 'Gold Plan',
    price: 199,
    features: [
      'Up to 600 Trips',
      'Priority Support Access',
      'Access to city and suburban drives',
      'Keep 90% of profits',
      '15% off fuel',
    ],
    color: 'yellow',
    popular: true,
  },
  {
    id: 'diamond',
    name: 'Diamond Plan',
    price: 299,
    features: [
      'Unlimited Trips',
      '24/7 Dedicated Support',
      'Access to all drive zones',
      'VIP Trip Alerts',
      'Keep 100% of profits',
      '20% off fuel',
    ],
    color: 'cyan',
  },
] as const;

export const DRIVER_REQUIREMENTS = [
  'Valid driver\'s license',
  'Proof of residency in your city/state',
  'Proof of auto insurance',
  'A smartphone with a data plan',
  '21 years of age or older',
  'At least one year of licensed driving experience in the US (3 years if you\'re under 23 years old)',
  'A clean driving record',
] as const;