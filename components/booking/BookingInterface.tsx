'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BOOKING_STATES } from '@/config/constants';
import type { BookingState, Location, RouteDetails, Driver } from '@/types';
import MapView from '@/components/map/MapView';
import LocationSelector from './LocationSelector';
import RideConfirmation from './RideConfirmation';
import DriverSearch from './DriverSearch';
import DriverTracking from './DriverTracking';

export default function BookingInterface() {
  const [bookingState, setBookingState] = useState<BookingState>({
    pickup: null,
    dropoff: null,
    selectedDriver: null,
    routeDetails: null,
    status: BOOKING_STATES.INITIAL,
  });

  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff' | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleLocationSelect = useCallback((location: Location) => {
    if (activeInput === 'pickup') {
      setBookingState(prev => ({
        ...prev,
        pickup: location,
      }));
    } else if (activeInput === 'dropoff') {
      setBookingState(prev => ({
        ...prev,
        dropoff: location,
      }));
    }

    setActiveInput(null);
    
    // If both locations are set, move to confirmation
    if (bookingState.pickup && activeInput === 'dropoff') {
      setBookingState(prev => ({
        ...prev,
        status: BOOKING_STATES.CONFIRMING_LOCATIONS,
      }));
    } else if (bookingState.dropoff && activeInput === 'pickup') {
      setBookingState(prev => ({
        ...prev,
        status: BOOKING_STATES.CONFIRMING_LOCATIONS,
      }));
    } else {
      setBookingState(prev => ({
        ...prev,
        status: BOOKING_STATES.INITIAL,
      }));
    }
  }, [activeInput, bookingState.pickup, bookingState.dropoff]);

  const handleRouteCalculated = useCallback((details: RouteDetails) => {
    setBookingState(prev => ({
      ...prev,
      routeDetails: details,
    }));
  }, []);

  const handleRequestRide = useCallback(async () => {
    if (!bookingState.pickup) return;

    setBookingState(prev => ({
      ...prev,
      status: BOOKING_STATES.FINDING_DRIVERS,
    }));

    try {
      // Search for available drivers
      const response = await fetch('/api/booking/search-drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_location: {
            lat: bookingState.pickup.coordinates.lat,
            lng: bookingState.pickup.coordinates.lng,
          },
          radius: 10, // 10km radius
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find drivers');
      }

      if (data.drivers && data.drivers.length > 0) {
        // Convert the first available driver to our expected Driver format
        const apiDriver = data.drivers[0];
        const driver: Driver = {
          id: apiDriver.id,
          name: apiDriver.name || 'Unknown Driver',
          email: '', // Not provided by API
          phone: '', // Hidden until ride is confirmed for privacy
          rating: apiDriver.rating || 5.0,
          ridesCompleted: apiDriver.total_rides || 0,
          favoriteLocations: [],
          paymentMethods: [],
          rideHistory: [],
          emergencyContacts: [],
          twoFactorEnabled: false,
          status: 'active',
          vehicle: {
            make: apiDriver.vehicle?.make || 'Unknown',
            model: apiDriver.vehicle?.model || 'Vehicle',
            year: apiDriver.vehicle?.year || new Date().getFullYear(),
            color: apiDriver.vehicle?.color || 'Unknown',
            licensePlate: 'Hidden', // Hidden until ride is confirmed for privacy
            insurance: {
              provider: 'Verified',
              policyNumber: 'VERIFIED',
              expiryDate: '2025-12-31',
            },
          },
          documents: [],
          earnings: {
            total: 0,
            lastWeek: 0,
            currentWeek: 0,
            pending: 0,
            stats: {
              totalTrips: apiDriver.total_rides,
              averageRating: apiDriver.rating,
              completionRate: 98,
              cancellationRate: 2,
            },
          },
          schedule: {},
          performance: {
            rating: apiDriver.rating,
            acceptance: 95,
            completion: 98,
          },
        };

        setBookingState(prev => ({
          ...prev,
          selectedDriver: driver,
          status: BOOKING_STATES.DRIVER_FOUND,
        }));

        // Simulate driver accepting the ride
        setTimeout(() => {
          setBookingState(prev => ({
            ...prev,
            status: BOOKING_STATES.DRIVER_ACCEPTED,
          }));

          // Set initial driver location (with fallback)
          const startLocation = {
            lat: apiDriver.location?.lat || bookingState.pickup?.coordinates.lat || 0,
            lng: apiDriver.location?.lng || bookingState.pickup?.coordinates.lng || 0,
          };
          setDriverLocation(startLocation);
          
          setBookingState(prev => ({
            ...prev,
            status: BOOKING_STATES.DRIVER_ARRIVING,
          }));
        }, 2000);
      } else {
        // No drivers found
        setBookingState(prev => ({
          ...prev,
          status: BOOKING_STATES.NO_DRIVERS_FOUND,
        }));
      }
    } catch (error) {
      console.error('Error searching for drivers:', error);
      setBookingState(prev => ({
        ...prev,
        status: BOOKING_STATES.ERROR,
      }));
    }
  }, [bookingState.pickup]);

  const handleCancelRide = useCallback(() => {
    setBookingState({
      pickup: null,
      dropoff: null,
      selectedDriver: null,
      routeDetails: null,
      status: BOOKING_STATES.INITIAL,
    });
    setDriverLocation(null);
    setActiveInput(null);
  }, []);

  const handleEditLocation = useCallback((type: 'pickup' | 'dropoff') => {
    setActiveInput(type);
    setBookingState(prev => ({
      ...prev,
      status: BOOKING_STATES.SELECTING_LOCATION,
    }));
  }, []);

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0">
        <MapView
          pickup={bookingState.pickup}
          dropoff={bookingState.dropoff}
          driverLocation={driverLocation}
          onRouteCalculated={handleRouteCalculated}
          selectionMode={bookingState.status === BOOKING_STATES.SELECTING_LOCATION}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {/* Overlay Components */}
      <AnimatePresence mode="wait">
        {bookingState.status === BOOKING_STATES.INITIAL && (
          <LocationSelector
            key="location-selector"
            pickup={bookingState.pickup}
            dropoff={bookingState.dropoff}
            onLocationClick={(type) => {
              setActiveInput(type);
              setBookingState(prev => ({
                ...prev,
                status: BOOKING_STATES.SELECTING_LOCATION,
              }));
            }}
            onEditLocation={handleEditLocation}
            onConfirmLocations={() => setBookingState(prev => ({
              ...prev,
              status: BOOKING_STATES.CONFIRMING_LOCATIONS,
            }))}
          />
        )}

        {bookingState.status === BOOKING_STATES.SELECTING_LOCATION && (
          <LocationSelector
            key="location-search"
            pickup={bookingState.pickup}
            dropoff={bookingState.dropoff}
            activeInput={activeInput}
            onLocationSelect={handleLocationSelect}
            onBack={() => {
              setActiveInput(null);
              setBookingState(prev => ({
                ...prev,
                status: BOOKING_STATES.INITIAL,
              }));
            }}
            onLocationClick={() => {}}
            onEditLocation={handleEditLocation}
            onConfirmLocations={() => {}}
          />
        )}

        {bookingState.status === BOOKING_STATES.CONFIRMING_LOCATIONS && (
          <RideConfirmation
            key="ride-confirmation"
            pickup={bookingState.pickup!}
            dropoff={bookingState.dropoff!}
            routeDetails={bookingState.routeDetails}
            onRequestRide={handleRequestRide}
            onEditLocation={handleEditLocation}
          />
        )}

        {bookingState.status === BOOKING_STATES.FINDING_DRIVERS && (
          <DriverSearch key="driver-search" />
        )}

        {(bookingState.status === BOOKING_STATES.DRIVER_FOUND ||
          bookingState.status === BOOKING_STATES.DRIVER_ACCEPTED ||
          bookingState.status === BOOKING_STATES.DRIVER_ARRIVING) && (
          <DriverTracking
            key="driver-tracking"
            driver={bookingState.selectedDriver!}
            routeDetails={bookingState.routeDetails}
            status={bookingState.status}
            onCancelRide={handleCancelRide}
          />
        )}
      </AnimatePresence>
    </div>
  );
}