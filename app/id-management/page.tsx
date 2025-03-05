'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

interface Participant {
    id: string;
    name: string;
    email: string;
    phone: string;
    paymentId: string;
    isIssued: boolean;
    uid?: string;
}

export default function IDManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [uid, setUid] = useState('');

    useEffect(() => {
        fetchAllParticipants();
    }, []);

    useEffect(() => {
        filterParticipants();
    }, [searchQuery, participants]);

    const fetchAllParticipants = async () => {
        setLoading(true);
        try {
            const participantsRef = collection(db, 'participants');
            const participantsSnapshot = await getDocs(participantsRef);
            const participantsData = participantsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Participant[];
            setParticipants(participantsData);
            setFilteredParticipants(participantsData);
        } catch (error) {
            console.error('Error fetching participants:', error);
            toast.error('Error fetching participants');
        } finally {
            setLoading(false);
        }
    };

    const filterParticipants = () => {
        if (!searchQuery.trim()) {
            setFilteredParticipants(participants);
            return;
        }

        const searchQueryLower = searchQuery.toLowerCase();
        const filtered = participants.filter(participant => {
            if (searchQuery.includes('@')) {
                return participant.email.toLowerCase() === searchQueryLower;
            }
            if (searchQuery.match(/^[0-9]+$/)) {
                return participant.paymentId === searchQuery || participant.uid === searchQuery;
            }
            return participant.name.toLowerCase().includes(searchQueryLower);
        });

        setFilteredParticipants(filtered);
    };

    const issueId = async (participant: Participant) => {
        if (!uid.trim()) {
            toast.error('Please enter a UID');
            return;
        }

        try {
            const participantRef = doc(db, 'participants', participant.id);
            await updateDoc(participantRef, {
                uid: uid,
                isIssued: true
            });

            // Update local state
            const updatedParticipants = participants.map(p =>
                p.id === participant.id
                    ? { ...p, uid, isIssued: true }
                    : p
            );
            setParticipants(updatedParticipants);
            setFilteredParticipants(prevFiltered =>
                prevFiltered.map(p =>
                    p.id === participant.id
                        ? { ...p, uid, isIssued: true }
                        : p
                )
            );

            setUid('');
            setSelectedParticipant(null);
            toast.success('ID issued successfully!');
        } catch (error) {
            console.error('Error issuing ID:', error);
            toast.error('Error issuing ID. Please try again.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">ID Management</h1>

            <div className="mb-6">
                <div className="max-w-xl">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                        Search Participants
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                            type="text"
                            name="search"
                            id="search"
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                            placeholder="Search by name, email, or payment ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-4">Loading participants...</div>
            ) : (
                <div className="flex flex-col">
                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Phone
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Payment ID
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredParticipants.map((participant) => (
                                            <tr key={participant.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {participant.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {participant.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {participant.phone}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {participant.paymentId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${participant.isIssued
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {participant.isIssued ? 'Issued' : 'Not Issued'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {!participant.isIssued && (
                                                        <button
                                                            onClick={() => setSelectedParticipant(participant)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Issue ID
                                                        </button>
                                                    )}
                                                    {participant.isIssued && participant.uid && (
                                                        <span className="text-gray-600">ID: {participant.uid}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for ID issuance */}
            {selectedParticipant && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                            Issue ID for {selectedParticipant.name}
                                        </h3>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                                                placeholder="Enter UID"
                                                value={uid}
                                                onChange={(e) => setUid(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => issueId(selectedParticipant)}
                                >
                                    Issue
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => {
                                        setSelectedParticipant(null);
                                        setUid('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 