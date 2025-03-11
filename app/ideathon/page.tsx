'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

interface IdeathonSubmission {
    id: string;
    name: string;
    email: string;
    mobile: string;
    driveLink: string;
    paymentId: string;
    uid: string;
    status?: 'pending' | 'verified' | 'rejected';
    date: string;
}

export default function IdeathonPage() {
    const [submissions, setSubmissions] = useState<IdeathonSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingActions, setProcessingActions] = useState<{ [key: string]: 'verify' | 'reject' | null }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [allSubmissions, setAllSubmissions] = useState<IdeathonSubmission[]>([]);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = allSubmissions.filter(submission =>
                submission.paymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                submission.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSubmissions(filtered);
        } else {
            setSubmissions(allSubmissions);
        }
    }, [searchQuery, allSubmissions]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const submissionsSnapshot = await getDocs(collection(db, 'ideathon'));
            const submissionsData = submissionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as IdeathonSubmission[];
            setAllSubmissions(submissionsData);
            setSubmissions(submissionsData);
        } catch (error) {
            console.error('Error fetching ideathon submissions:', error);
            toast.error('Error loading submissions');
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (submission: IdeathonSubmission, isVerified: boolean) => {
        const action = isVerified ? 'verify' : 'reject';
        setProcessingActions(prev => ({ ...prev, [submission.id]: action }));

        try {
            // Send email first
            try {
                console.log(`Attempting to send ${isVerified ? 'verification' : 'rejection'} email to:`, submission.email);
                const emailData = {
                    to: submission.email,
                    name: submission.name,
                    uid: submission.uid,
                    isRejected: !isVerified,
                    isIdeathon: true
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

            // Update submission status
            await updateDoc(doc(db, 'ideathon', submission.id), {
                status: isVerified ? 'verified' : 'rejected',
                verifiedAt: new Date().toISOString()
            });

            // Update local state
            const updatedSubmissions = allSubmissions.map(sub =>
                sub.id === submission.id
                    ? { ...sub, status: isVerified ? 'verified' : 'rejected' as 'verified' | 'rejected' }
                    : sub
            );
            setAllSubmissions(updatedSubmissions);
            setSubmissions(updatedSubmissions.filter(sub =>
                sub.paymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.name.toLowerCase().includes(searchQuery.toLowerCase())
            ));

            toast.success(`Submission ${isVerified ? 'verified' : 'rejected'} and email sent successfully`);
        } catch (error) {
            console.error('Error processing submission:', error);
            toast.error('Error processing submission');
        } finally {
            setProcessingActions(prev => ({ ...prev, [submission.id]: null }));
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[600px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading submissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Ideathon Submissions</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        A list of all ideathon submissions.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mt-4 mb-6">
                <div className="relative rounded-md shadow-sm max-w-md">
                    <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                        placeholder="Search by Name or Payment ID"
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
                        Found {submissions.length} {submissions.length === 1 ? 'result' : 'results'}
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
                                            Drive Link
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Payment ID
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            UID
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Status
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Submission Date
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {submissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-8 text-center text-sm text-gray-500">
                                                No submissions found
                                            </td>
                                        </tr>
                                    ) : (
                                        submissions.map((submission) => (
                                            <tr key={submission.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    {submission.name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {submission.email}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {submission.mobile}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">
                                                    <a
                                                        href={submission.driveLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        View Submission
                                                    </a>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {submission.paymentId}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {submission.uid}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        ${submission.status === 'verified' ? 'bg-green-100 text-green-800' :
                                                            submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'}`}>
                                                        {submission.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {formatDate(submission.date)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="flex space-x-2">
                                                        {(!submission.status || submission.status === 'pending') && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleVerification(submission, true)}
                                                                    disabled={!!processingActions[submission.id]}
                                                                    className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${processingActions[submission.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    {processingActions[submission.id] === 'verify' ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                    ) : (
                                                                        'Verify'
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleVerification(submission, false)}
                                                                    disabled={!!processingActions[submission.id]}
                                                                    className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${processingActions[submission.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    {processingActions[submission.id] === 'reject' ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                    ) : (
                                                                        'Reject'
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
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