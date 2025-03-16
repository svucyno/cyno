'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function SignInPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && !loading) {
            router.push('/registrations');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to BMS Admin
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Use your Google account to access the admin panel
                    </p>
                </div>
                <div>
                    <button
                        onClick={signInWithGoogle}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                            </svg>
                        </span>
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
} 