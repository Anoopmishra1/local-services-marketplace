import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });

const STATUS_COLOR = {
    open: 'bg-red-100 text-red-700',
    in_review: 'bg-blue-100 text-blue-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-gray-100 text-gray-500',
};

export default function Disputes() {
    const [disputes, setDisputes] = useState([]);
    const [status, setStatus] = useState('open');
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState({});

    const fetchDisputes = (s) => {
        setLoading(true);
        api.get(`/admin/disputes?status=${s}&limit=50`)
            .then(({ data }) => setDisputes(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDisputes(status); }, [status]);

    const updateDispute = async (id, newStatus) => {
        await api.patch(`/admin/disputes/${id}`, { status: newStatus, admin_notes: notes[id] || '' });
        fetchDisputes(status);
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800">Disputes & Complaints</h1>
                <p className="text-gray-400 text-sm mt-1">Resolve customer and provider disputes.</p>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {['open', 'in_review', 'resolved', 'closed'].map((s) => (
                    <button key={s} onClick={() => setStatus(s)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all
            ${status === s ? 'bg-violet-600 text-white shadow' : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-300'}`}>
                        {s.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div></div>
            ) : (
                <div className="space-y-4">
                    {disputes.length === 0 && <p className="text-center text-gray-400 mt-16">No {status} disputes</p>}
                    {disputes.map((d) => (
                        <div key={d.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[d.status]}`}>
                                            {d.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString('en-IN')}</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 mb-1">
                                        Raised by: {d.raised_by_user?.name} ({d.raised_by_user?.email})
                                    </p>
                                    <p className="text-sm text-gray-500 mb-1">Service: {d.bookings?.service_type}</p>
                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mt-2">{d.description}</p>
                                </div>

                                {(d.status === 'open' || d.status === 'in_review') && (
                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                        <button onClick={() => updateDispute(d.id, 'in_review')}
                                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold px-3 py-2 rounded-lg transition">
                                            Mark In Review
                                        </button>
                                        <button onClick={() => updateDispute(d.id, 'resolved')}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition">
                                            ✓ Resolve
                                        </button>
                                        <button onClick={() => updateDispute(d.id, 'closed')}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-3 py-2 rounded-lg transition">
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Admin Notes */}
                            {(d.status === 'open' || d.status === 'in_review') && (
                                <div className="mt-3">
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Admin Notes</label>
                                    <textarea
                                        rows={2}
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                                        placeholder="Add internal notes..."
                                        value={notes[d.id] || d.admin_notes || ''}
                                        onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
