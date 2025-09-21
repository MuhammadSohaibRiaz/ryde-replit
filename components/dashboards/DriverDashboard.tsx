'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Users, Power, Car } from 'lucide-react';

interface DriverDashboardProps {
  driver: any;
}

export default function DriverDashboard({ driver }: DriverDashboardProps) {
  const [isOnline, setIsOnline] = useState(driver?.status === 'online');
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleOnlineStatus = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/driver', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_available: !isOnline,
        }),
      });

      if (response.ok) {
        setIsOnline(!isOnline);
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!driver) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading driver dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
          <span className="text-sm text-gray-500">
            Rating: {driver.rating}/5.0 ({driver.ridesCompleted} rides)
          </span>
        </div>
        <button
          onClick={toggleOnlineStatus}
          disabled={isUpdating}
          className={`flex items-center px-4 py-2 rounded-full transition-colors ${
            isOnline 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Power className="w-4 h-4 mr-2" />
          {isUpdating ? 'Updating...' : isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Vehicle Info */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-3 mb-3">
          <Car className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Vehicle Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Vehicle:</span>
            <p className="font-medium">
              {driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Color:</span>
            <p className="font-medium">{driver.vehicle.color}</p>
          </div>
          <div>
            <span className="text-gray-500">License Plate:</span>
            <p className="font-medium">{driver.vehicle.licensePlate}</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <p className={`font-medium ${driver.documents.verified ? 'text-green-600' : 'text-yellow-600'}`}>
              {driver.documents.verified ? 'Verified' : 'Pending Verification'}
            </p>
          </div>
        </div>
      </div>

      {/* Earnings & Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Today's Summary</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-600 p-4 rounded-lg text-white">
            <p className="text-sm opacity-90">Today's Earnings</p>
            <p className="text-3xl font-bold">${driver.todayStats.earnings.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Completed Rides</p>
            <p className="text-3xl font-semibold text-blue-600">{driver.todayStats.completedRides}</p>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Earnings</p>
            <p className="text-lg font-semibold">${driver.earnings.total.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Rides</p>
            <p className="text-lg font-semibold">{driver.ridesCompleted}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Average Rating</p>
            <p className="text-lg font-semibold">{driver.rating}/5.0</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Recent Activity</h3>
          {driver.recentActivity && driver.recentActivity.length > 0 ? (
            driver.recentActivity.slice(0, 5).map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-sm">{activity.passenger}</p>
                    <p className="text-xs text-gray-500">
                      {activity.from} → {activity.to}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">${activity.amount.toFixed(2)}</p>
                  <p className={`text-xs ${
                    activity.status === 'completed' ? 'text-green-600' : 
                    activity.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {activity.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400">Go online to start receiving ride requests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}