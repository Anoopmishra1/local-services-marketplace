import React, { useEffect, useState } from 'react';
import api from '../services/api';

const TABS = ['all', 'pending', 'approved'];

export default function Providers() {
    const [tab, setTab] = useState('pending');
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProviders = (t) => {
        setLoading(true);
        api.get(`/admin/providers?status=${t}&limit=50`)
            .then(({ data }) => setProviders(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProviders(tab); }, [tab]);

    const approve = async (id, val) => {
        await api.patch(`/admin/providers/${id}/approve`, { approve: val });
        fetchProviders(tab);
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800">Service Providers</h1>
                <p className="text-gray-400 text-sm mt-1">Review, approve or reject provider applications.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {TABS.map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all
            ${tab === t ? 'bg-violet-600 text-white shadow' : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-300'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div></div>
            ) : (
                <div className="space-y-4">
                    {providers.length === 0 && <p className="text-center text-gray-400 mt-16">No providers found</p>}
                    {providers.map((p) => (
                        <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                            <img
                                src={p.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.users?.name || 'U')}&background=6C63FF&color=fff`}
                                className="w-14 h-14 rounded-full object-cover"
                                alt={p.users?.name}
                            />
                            <div className="flex-1">
                                <p className="font-bold text-gray-800 text-base">{p.users?.name}</p>
                                <p className="text-sm text-gray-500">{p.users?.email} · {p.users?.phone}</p>
                                <p className="text-xs text-violet-600 font-semibold mt-1">{p.categories?.name} · ₹{p.hourly_rate}/hr · {p.experience_yrs}y exp</p>
                                <p className="text-xs text-gray-400 mt-0.5">{p.city}, {p.state}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full text-center ${p.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {p.is_approved ? '✓ Approved' : '⏳ Pending'}
                                </span>
                                {!p.is_approved ? (
                                    <button onClick={() => approve(p.id, true)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition">
                                        ✓ Approve
                                    </button>
                                ) : (
                                    <button onClick={() => approve(p.id, false)}
                                        className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold px-4 py-2 rounded-lg transition">
                                        Revoke
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
