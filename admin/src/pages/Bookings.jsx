import React, { useEffect, useState } from 'react';
import api from '../services/api';

const STATUS_COLOR = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-violet-100 text-violet-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
};

export default function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        setLoading(true);
        const q = statusFilter ? `?status=${statusFilter}` : '';
        api.get(`/admin/bookings${q}&limit=50`)
            .then(({ data }) => setBookings(data))
            .finally(() => setLoading(false));
    }, [statusFilter]);

    const STATUSES = ['', 'pending', 'accepted', 'completed', 'cancelled'];

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">All Bookings</h1>
                    <p className="text-gray-400 text-sm mt-1">Monitor all service bookings on the platform.</p>
                </div>
                <select
                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-300"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div></div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {['Customer', 'Provider', 'Service', 'Scheduled', 'Amount', 'Status'].map((h) => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {bookings.length === 0 && (
                                <tr><td colSpan="6" className="text-center py-16 text-gray-400">No bookings found</td></tr>
                            )}
                            {bookings.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 font-semibold text-gray-700">{b.customer?.name}</td>
                                    <td className="px-5 py-4 text-gray-600">{b.providers?.users?.name}</td>
                                    <td className="px-5 py-4 text-gray-600">{b.service_type}</td>
                                    <td className="px-5 py-4 text-gray-500">{new Date(b.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                    <td className="px-5 py-4 font-bold text-violet-600">₹{b.total_amount}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${STATUS_COLOR[b.status]}`}>{b.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
