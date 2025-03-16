'use client';

import Sidebar from './Sidebar';
import Header from './Header';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from './ProtectedRoute';
import 'react-toastify/dist/ReactToastify.css';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                            {children}
                        </main>
                    </div>
                </div>
            </ProtectedRoute>
            <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
    );
} 