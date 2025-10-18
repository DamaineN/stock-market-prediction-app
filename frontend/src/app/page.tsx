'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Small delay to ensure proper hydration
      const timeout = setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [router, mounted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-md px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Stolckr</h1>
          <p className="text-lg text-gray-600 mb-6">
            AI-Powered Stock Market Analysis
          </p>
        </div>
        
        {mounted ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Redirecting to dashboard...</span>
            </div>
            
            <div className="text-sm text-gray-500">
              <p className="mb-2">Taking too long? Navigate manually:</p>
              <div className="space-y-2">
                <Link 
                  href="/dashboard" 
                  className="block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Go to Dashboard
                </Link>
                <Link 
                  href="/login" 
                  className="block border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">
            <p>Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}
