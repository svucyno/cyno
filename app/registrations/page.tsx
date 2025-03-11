'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

interface Registration {
    id: string;
    name: string;
    email: string;
    mobile: string;
    paymentId: string;
    totalAmount: number;
    date: string;
    selectedEvents?: string[];
    uid: string;
}

export default function RegistrationsPage() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingActions, setProcessingActions] = useState<{ [key: string]: 'verify' | 'reject' | null }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    useEffect(() => {
        // Filter registrations based on search query
        if (searchQuery.trim()) {
            const filtered = allRegistrations.filter(registration =>
                registration.paymentId.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setRegistrations(filtered);
        } else {
            setRegistrations(allRegistrations);
        }
    }, [searchQuery, allRegistrations]);

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const registrationsSnapshot = await getDocs(collection(db, 'registrations'));
            const registrationsData = registrationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Registration[];
            setAllRegistrations(registrationsData);
            setRegistrations(registrationsData);
        } catch (error) {
            console.error('Error fetching registrations:', error);
            toast.error('Error loading registrations');
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (registration: Registration, isVerified: boolean) => {
        const action = isVerified ? 'verify' : 'reject';
        setProcessingActions(prev => ({ ...prev, [registration.id]: action }));

        try {
            // Try to send email first (for both verification and rejection)
            try {
                console.log(`Attempting to send ${isVerified ? 'verification' : 'rejection'} email to:`, registration.email);
                const emailData = {
                    to: registration.email,
                    name: registration.name,
                    uid: registration.uid,
                    events: registration.selectedEvents || [],
                    isRejected: !isVerified
                };
                console.log('Email data:', emailData);

                const response = await fetch('/api/send-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(emailData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Failed to send email:', errorData);
                    toast.error(`Failed to send ${isVerified ? 'verification' : 'rejection'} email. Please try again.`);
                    return;
                }

                const responseData = await response.json();
                console.log('Email sent successfully:', responseData);
            } catch (emailError: any) {
                console.error('Error sending email:', emailError);
                toast.error(`Failed to send ${isVerified ? 'verification' : 'rejection'} email. Please try again.`);
                return;
            }

            // Proceed with verification/rejection only if email was sent successfully
            const targetCollection = isVerified ? 'successRegistrations' : 'failedRegistrations';
            const newDoc = await addDoc(collection(db, targetCollection), {
                ...registration,
                verifiedAt: new Date().toISOString(),
                status: isVerified ? 'verified' : 'rejected',
                date: new Date().toISOString()
            });

            // Remove from registrations collection
            await deleteDoc(doc(db, 'registrations', registration.id));

            // Update local state
            const updatedRegistrations = allRegistrations.filter(reg => reg.id !== registration.id);
            setAllRegistrations(updatedRegistrations);
            setRegistrations(updatedRegistrations.filter(reg =>
                reg.paymentId.toLowerCase().includes(searchQuery.toLowerCase())
            ));

            toast.success(`Registration ${isVerified ? 'verified' : 'rejected'} and email sent successfully`);
        } catch (error) {
            console.error('Error processing registration:', error);
            toast.error('Error processing registration');
        } finally {
            setProcessingActions(prev => ({ ...prev, [registration.id]: null }));
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        // Handle both Firestore Timestamp and string dates
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[600px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading registrations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Registrations</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        A list of all registrations pending verification.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mt-4 mb-6">
                <div className="relative rounded-md shadow-sm max-w-md">
                    <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                        placeholder="Search by Payment ID"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
                {searchQuery && (
                    <p className="mt-2 text-sm text-gray-500">
                        Found {registrations.length} {registrations.length === 1 ? 'result' : 'results'}
                    </p>
                )}
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            Name
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Email
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Phone
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Payment ID
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Amount
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Selected Events
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            UID
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Registration Date
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {registrations.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-8 text-center text-sm text-gray-500">
                                                No pending registrations found
                                            </td>
                                        </tr>
                                    ) : (
                                        registrations.map((registration) => (
                                            <tr key={registration.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    {registration.name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {registration.email}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {registration.mobile}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {registration.paymentId}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    ₹{registration.totalAmount}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">
                                                    <div className="flex flex-wrap gap-1">
                                                        {registration.selectedEvents?.map((event, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                                            >
                                                                {event}
                                                            </span>
                                                        )) || 'None'}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {registration.uid || 'Not assigned'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {formatDate(registration.date)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleVerification(registration, true)}
                                                            disabled={!!processingActions[registration.id]}
                                                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${processingActions[registration.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {processingActions[registration.id] === 'verify' ? (
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            ) : (
                                                                'Verify'
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerification(registration, false)}
                                                            disabled={!!processingActions[registration.id]}
                                                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${processingActions[registration.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {processingActions[registration.id] === 'reject' ? (
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            ) : (
                                                                'Reject'
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 