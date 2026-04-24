import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Providers from './pages/Providers';
import Bookings from './pages/Bookings';
import Revenue from './pages/Revenue';
import Disputes from './pages/Disputes';
import Login from './pages/Login';

export default function App() {
    const [admin, setAdmin] = useState(null);
    const [checking, setChecking] = useState(true);

    // On mount, check if an admin session exists
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        const user = localStorage.getItem('admin_user');
        if (token && user) {
            try {
                setAdmin(JSON.parse(user));
            } catch {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
            }
        }
        setChecking(false);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setAdmin(null);
    };

    // Show nothing while checking auth (prevents flash)
    if (checking) return null;

    // Not logged in → show login page
    if (!admin) {
        return (
            <Routes>
                <Route path="/login" element={<Login onLogin={setAdmin} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // Authenticated admin layout
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar admin={admin} onLogout={handleLogout} />
            <main className="flex-1 overflow-y-auto p-6">
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/providers" element={<Providers />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/revenue" element={<Revenue />} />
                    <Route path="/disputes" element={<Disputes />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </main>
        </div>
    );
}
