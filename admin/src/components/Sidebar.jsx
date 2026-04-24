import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/providers', icon: '👷', label: 'Providers' },
    { to: '/bookings', icon: '📅', label: 'Bookings' },
    { to: '/revenue', icon: '💰', label: 'Revenue' },
    { to: '/disputes', icon: '⚠️', label: 'Disputes' },
];

export default function Sidebar({ admin, onLogout }) {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <span className="text-2xl font-black text-violet-600">⚡ LocalPro</span>
                <p className="text-xs text-gray-400 mt-1 font-medium">Admin Dashboard</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
                {NAV.map((n) => (
                    <NavLink
                        key={n.to}
                        to={n.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150
              ${isActive
                                ? 'bg-violet-50 text-violet-700 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`
                        }
                    >
                        <span className="text-lg">{n.icon}</span>
                        {n.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer with admin info + logout */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                        {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{admin?.name || 'Admin'}</p>
                        <p className="text-xs text-gray-400 truncate">{admin?.email || 'admin@localapp.in'}</p>
                    </div>
                </div>
                <button
                    id="admin-logout-btn"
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl text-sm font-semibold transition-all duration-150"
                >
                    <span>🚪</span> Sign Out
                </button>
            </div>
        </aside>
    );
}
