import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API, headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });

export default function Revenue() {
    const [data, setData] = useState(null);
    const [loading, setLoad] = useState(true);
    const [fromDate, setFrom] = useState('');
    const [toDate, setTo] = useState('');

    const fetchRevenue = () => {
        setLoad(true);
        const q = new URLSearchParams();
        if (fromDate) q.append('from_date', fromDate);
        if (toDate) q.append('to_date', toDate);
        api.get(`/admin/revenue?${q}`).then(({ data: d }) => setData(d)).finally(() => setLoad(false));
    };

    useEffect(() => { fetchRevenue(); }, []);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800">Revenue & Commissions</h1>
                <p className="text-gray-400 text-sm mt-1">Platform earnings and provider payouts.</p>
            </div>

            {/* Date Filter */}
            <div className="flex gap-3 mb-6 flex-wrap">
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">From</label>
                    <input type="date" value={fromDate} onChange={(e) => setFrom(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">To</label>
                    <input type="date" value={toDate} onChange={(e) => setTo(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div className="flex items-end">
                    <button onClick={fetchRevenue}
                        className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition">
                        Apply Filter
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                    {[
                        { label: 'Platform Revenue', value: `₹${data.total_revenue.toFixed(0)}`, color: 'border-emerald-500', emoji: '💰' },
                        { label: 'Total Payouts', value: `₹${data.total_payouts.toFixed(0)}`, color: 'border-violet-500', emoji: '💸' },
                        { label: 'Unsettled Payouts', value: `₹${data.unsettled_amount.toFixed(0)}`, color: 'border-amber-500', emoji: '⏳' },
                    ].map((c) => (
                        <div key={c.label} className={`bg-white rounded-2xl p-5 shadow-sm border-t-4 ${c.color}`}>
                            <p className="text-sm font-semibold text-gray-400">{c.label}</p>
                            <p className="text-3xl font-black text-gray-800 mt-1">{c.value} <span>{c.emoji}</span></p>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center mt-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div></div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {['Provider', 'Gross', 'Commission (15%)', 'Payout', 'Settled', 'Date'].map((h) => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(data?.records || []).map((r, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-5 py-4 font-semibold text-gray-700">{r.providers?.users?.name}</td>
                                    <td className="px-5 py-4 text-gray-600">₹{parseFloat(r.gross_amount).toFixed(0)}</td>
                                    <td className="px-5 py-4 text-emerald-600 font-bold">₹{parseFloat(r.commission).toFixed(0)}</td>
                                    <td className="px-5 py-4 text-violet-600 font-bold">₹{parseFloat(r.provider_payout).toFixed(0)}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.is_settled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {r.is_settled ? 'Settled' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                                </tr>
                            ))}
                            {(data?.records?.length === 0) && (
                                <tr><td colSpan="6" className="text-center py-16 text-gray-400">No revenue data</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
