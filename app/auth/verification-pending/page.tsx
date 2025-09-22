'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, FileText, Mail, AlertCircle, Upload, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function VerificationPending() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/driver/login');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, account_status, full_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        
        // If user is not a driver, redirect
        if (profile.user_type !== 'driver') {
          router.push('/main');
          return;
        }

        // If user is verified, redirect to driver dashboard
        if (profile.account_status === 'active') {
          router.push('/driver-profile');
          return;
        }
      }

      // Get driver profile
      const { data: driverData } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (driverData) {
        setDriverProfile(driverData);
      }

      // Get driver documents
      const { data: documentsData } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', user.id)
        .eq('is_current', true)
        .order('created_at', { ascending: false });

      if (documentsData) {
        setDocuments(documentsData);
      }
      
      setLoading(false);
    };

    checkUserStatus();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const getDocumentStatus = (docType) => {
    const doc = documents.find(d => d.document_type === docType);
    return doc ? doc.status : 'missing';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'pending': return 'text-orange-600';
      case 'under_review': return 'text-blue-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'under_review': return <FileText className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Upload className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const requiredDocuments = [
    { type: 'drivers_license', label: 'Driver\'s License', required: true },
    { type: 'vehicle_registration', label: 'Vehicle Registration', required: true },
    { type: 'insurance_certificate', label: 'Insurance Certificate', required: true },
    { type: 'profile_photo', label: 'Profile Photo', required: true },
    { type: 'vehicle_photo', label: 'Vehicle Photo', required: true }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center">
            <Clock className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Driver Verification in Progress
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hello {userProfile?.full_name}, your driver application is currently being reviewed
          </p>
        </div>

        <div className="space-y-6">
          {/* Application Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Application Status</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-2 w-2 bg-green-400 rounded-full"></div>
                <p className="ml-3 text-sm text-gray-600">Account created ✓</p>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-2 w-2 bg-green-400 rounded-full"></div>
                <p className="ml-3 text-sm text-gray-600">Email verified ✓</p>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-2 w-2 bg-green-400 rounded-full"></div>
                <p className="ml-3 text-sm text-gray-600">Driver information submitted ✓</p>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 h-2 w-2 bg-orange-400 rounded-full animate-pulse"></div>
                <p className="ml-3 text-sm text-gray-600">
                  Status: <span className="font-medium capitalize">{driverProfile?.verification_status || 'Pending'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  What happens next?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You'll need to upload required documents (driver's license, vehicle registration, insurance)</li>
                    <li>Our verification team will review all your documents</li>
                    <li>Review process typically takes 1-3 business days</li>
                    <li>You'll receive an email notification once approved</li>
                    <li>Once approved, you can start receiving ride requests!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {driverProfile?.admin_notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <Mail className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Message from Review Team
                  </h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    {driverProfile.admin_notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {driverProfile?.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Action Required
                  </h3>
                  <p className="mt-2 text-sm text-red-700">
                    {driverProfile.rejection_reason}
                  </p>
                  <p className="mt-2 text-sm text-red-600">
                    Please address the issues mentioned and contact support to resubmit your documents.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Support Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Mail className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Need Help?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              If you have questions about your application status or need to upload/update your documents, 
              our support team is here to help you through the verification process.
            </p>
            <div className="flex space-x-3">
              <Link 
                href="mailto:support@ryde.com?subject=Driver Verification Help"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                Contact Support
              </Link>
              <button
                onClick={() => router.refresh()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Refresh Status
              </button>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              Please keep this page bookmarked. You can return here anytime to check your verification status.
            </p>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}