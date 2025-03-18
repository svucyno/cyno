'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase/config';
import ProtectedRoute from './components/ProtectedRoute';

interface DashboardStats {
  totalRegistrations: number;
  successfulRegistrations: number;
  failedRegistrations: number;
  pendingRegistrations: number;
  hackathonSubmissions: number;
  ideathonSubmissions: number;
  paperSubmissions: number;
}

interface RecentActivity {
  id: string;
  type: string;
  name: string;
  action: string;
  timestamp: Date;
}

function DashboardContent() {
  const { logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    successfulRegistrations: 0,
    failedRegistrations: 0,
    pendingRegistrations: 0,
    hackathonSubmissions: 0,
    ideathonSubmissions: 0,
    paperSubmissions: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all collections
      const registrationsSnapshot = await getDocs(collection(db, 'registrations'));
      const successRegistrationsSnapshot = await getDocs(collection(db, 'successRegistrations'));
      const failedRegistrationsSnapshot = await getDocs(collection(db, 'failedRegistrations'));
      const hackathonSnapshot = await getDocs(collection(db, 'hackathon_registrations'));
      const ideathonSnapshot = await getDocs(collection(db, 'ideathon_registrations'));
      const paperSnapshot = await getDocs(collection(db, 'paper_presentations'));

      setStats({
        totalRegistrations: registrationsSnapshot.size + successRegistrationsSnapshot.size + failedRegistrationsSnapshot.size,
        successfulRegistrations: successRegistrationsSnapshot.size,
        failedRegistrations: failedRegistrationsSnapshot.size,
        pendingRegistrations: registrationsSnapshot.size,
        hackathonSubmissions: hackathonSnapshot.size,
        ideathonSubmissions: ideathonSnapshot.size,
        paperSubmissions: paperSnapshot.size
      });

      // Get recent activities from successful and failed registrations
      const recentSuccessful = successRegistrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'Registration',
        name: doc.data().name,
        action: 'Verified',
        timestamp: new Date(doc.data().verifiedAt)
      }));

      const recentFailed = failedRegistrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'Registration',
        name: doc.data().name,
        action: 'Rejected',
        timestamp: new Date(doc.data().verifiedAt)
      }));

      // Combine and sort by timestamp
      const allActivities = [...recentSuccessful, ...recentFailed]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      setRecentActivities(allActivities);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      window.location.href = window.location.origin;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of all registrations and submissions
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Registrations */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Registrations</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.totalRegistrations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Successful Registrations */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Successful</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.successfulRegistrations}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-green-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-green-700">
                {((stats.successfulRegistrations / stats.totalRegistrations) * 100).toFixed(1)}% success rate
              </span>
            </div>
          </div>
        </div>

        {/* Failed Registrations */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-red-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.failedRegistrations}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-red-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-red-700">
                {((stats.failedRegistrations / stats.totalRegistrations) * 100).toFixed(1)}% rejection rate
              </span>
            </div>
          </div>
        </div>

        {/* Pending Registrations */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.pendingRegistrations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Submissions Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        {/* Hackathon Card */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 overflow-hidden shadow rounded-lg text-white">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Hackathon</h3>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.hackathonSubmissions}</p>
            <p className="text-purple-100 mt-1">Active Submissions</p>
          </div>
        </div>

        {/* Ideathon Card */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 overflow-hidden shadow rounded-lg text-white">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Ideathon</h3>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.ideathonSubmissions}</p>
            <p className="text-blue-100 mt-1">Active Submissions</p>
          </div>
        </div>

        {/* Paper Presentation Card */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 overflow-hidden shadow rounded-lg text-white">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Paper Presentation</h3>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{stats.paperSubmissions}</p>
            <p className="text-pink-100 mt-1">Active Submissions</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${activity.action === 'Verified' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                  {activity.action === 'Verified' ? (
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.type} was {activity.action.toLowerCase()}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {activity.timestamp.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
