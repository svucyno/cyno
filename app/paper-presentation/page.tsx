'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import ProtectedRoute from '../components/ProtectedRoute';

interface PaperSubmission {
    id: string;
    name: string;
    email: string;
    mobile: string;
    driveLink: string;
    paymentId: string;
    status: 'pending' | 'verified' | 'rejected';
    date: string;
    teamMembers?: string[];
    collegeName?: string;
}

function PaperPresentationContent() {
    const [submissions, setSubmissions] = useState<PaperSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingActions, setProcessingActions] = useState<{ [key: string]: 'verify' | 'reject' | null }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [allSubmissions, setAllSubmissions] = useState<PaperSubmission[]>([]);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = allSubmissions.filter(submission =>
                submission.paymentId.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSubmissions(filtered);
        } else {
            setSubmissions(allSubmissions);
        }
    }, [searchQuery, allSubmissions]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const submissionsSnapshot = await getDocs(collection(db, 'paper_presentations'));
            const submissionsData = submissionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PaperSubmission[];
            setAllSubmissions(submissionsData);
            setSubmissions(submissionsData);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            toast.error('Error loading submissions');
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (submission: PaperSubmission, isVerified: boolean) => {
        const action = isVerified ? 'verify' : 'reject';
        setProcessingActions(prev => ({ ...prev, [submission.id]: action }));

        try {
            // Send email first
            try {
                const emailData = {
                    to: submission.email,
                    name: submission.name,
                    uid: submission.id,
                    isRejected: !isVerified,
                    teamMembers: submission.teamMembers,
                    isPaperPresentation: true,
                    whatsappLink: isVerified
                        ? 'https://chat.whatsapp.com/LPZ2D9fqcIEHWNg6LOUJVp'
                        : 'https://chat.whatsapp.com/KxGOfKz0QddLdDE3oD4fuL',
                    whatsappGroupName: isVerified ? 'BMS Announcements' : 'BMS Queries'
                };

                const response = await fetch('/api/send-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(emailData),
                });

                if (!response.ok) {
                    throw new Error('Failed to send email');
                }
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                toast.error('Failed to send verification email');
                return;
            }

            // Update submission status in the same collection
            await updateDoc(doc(db, 'paper_presentations', submission.id), {
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
                sub.paymentId.toLowerCase().includes(searchQuery.toLowerCase())
            ));

            toast.success(`Submission ${isVerified ? 'verified' : 'rejected'} and email sent successfully`);
        } catch (error) {
            console.error('Error processing submission:', error);
            toast.error('Error processing submission');
        } finally {
            setProcessingActions(prev => ({ ...prev, [submission.id]: null }));
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSubmissions();
        setRefreshing(false);
        toast.success('Records refreshed successfully');
    };

    const handleExportData = () => {
        try {
            // Create CSV header
            const headers = [
                'Name',
                'Email',
                'Mobile',
                'Drive Link',
                'Payment ID',
                'College Name',
                'Team Members',
                'Date',
                'Status'
            ].join(',');

            // Convert submissions to CSV rows
            const rows = submissions.map(sub => {
                return [
                    sub.name,
                    sub.email,
                    sub.mobile,
                    sub.driveLink,
                    sub.paymentId,
                    sub.collegeName || 'N/A',
                    (sub.teamMembers || []).join('; '),
                    new Date(sub.date).toLocaleDateString(),
                    sub.status || 'pending'
                ].map(field => `"${field}"`).join(',');
            });

            // Combine headers and rows
            const csvContent = [headers, ...rows].join('\n');

            // Create and download the file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `paper-presentation-submissions-${date}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Exported ${submissions.length} submissions successfully`);
        } catch (error) {
            console.error('Error exporting data:', error);
            toast.error('Error exporting data');
        }
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
            <div className="sm:flex sm:items-center mb-6">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Paper Presentation Submissions</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        A list of all paper presentation submissions and their verification status.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
                    <button
                        onClick={handleExportData}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Export to Excel
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {refreshing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <div className="max-w-xl">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                        Search Submissions
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                            type="text"
                            name="search"
                            id="search"
                            className="block w-full rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Search by payment ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
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
                                            Mobile
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Drive Link
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Payment ID
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            College Name
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Team Members
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Date
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Status
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {submissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-sm text-gray-500">
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
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <a
                                                        href={submission.driveLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        View Paper
                                                    </a>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {submission.paymentId}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {submission.collegeName || 'N/A'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {submission.teamMembers?.join(', ') || 'None'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(submission.date).toLocaleDateString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${submission.status === 'verified'
                                                        ? 'bg-green-100 text-green-800'
                                                        : submission.status === 'rejected'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {submission.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    {(!submission.status || submission.status === 'pending') && (
                                                        <div className="flex space-x-2">
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
                                                        </div>
                                                    )}
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

export default function PaperPresentationPage() {
    return (
        <ProtectedRoute>
            <PaperPresentationContent />
        </ProtectedRoute>
    );
} 