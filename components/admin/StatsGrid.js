'use client';

import { useState, useEffect } from 'react';
import { Users, Car, DollarSign, Star } from "lucide-react"

export default function StatsGrid() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          
          const statsData = [
            {
              icon: Users,
              title: "Total Users",
              value: data.overview.totalUsers.toLocaleString(),
              color: "bg-blue-500",
            },
            {
              icon: Car,
              title: "Total Rides",
              value: data.overview.totalRides.toLocaleString(),
              color: "bg-green-500",
            },
            {
              icon: DollarSign,
              title: "Revenue",
              value: `$${data.overview.totalRevenue.toLocaleString()}`,
              color: "bg-yellow-500",
            },
            {
              icon: Star,
              title: "Avg. Rating",
              value: data.overview.avgRating.toString(),
              color: "bg-purple-500",
            },
          ];
          
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to default values
        setStats([
          { icon: Users, title: "Total Users", value: "0", color: "bg-blue-500" },
          { icon: Car, title: "Total Rides", value: "0", color: "bg-green-500" },
          { icon: DollarSign, title: "Revenue", value: "$0", color: "bg-yellow-500" },
          { icon: Star, title: "Avg. Rating", value: "0", color: "bg-purple-500" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="ml-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats?.map((stat) => (
        <div
          key={stat.title}
          className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
              <stat.icon className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

