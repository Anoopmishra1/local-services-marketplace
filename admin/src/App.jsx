import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Providers from './pages/Providers';
import Bookings from './pages/Bookings';
import Revenue from './pages/Revenue';
import Disputes from './pages/Disputes';

export default function App() {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/providers" element={<Providers />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/revenue" element={<Revenue />} />
                    <Route path="/disputes" element={<Disputes />} />
                </Routes>
            </main>
        </div>
    );
}
