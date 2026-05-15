import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { reviewsAPI } from '../services/api';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user) {
      reviewsAPI.getAll({ status: 'Pending', limit: 1 })
        .then(res => setPendingCount(res.data.pagination.total))
        .catch(console.error);
    }
  }, [user]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Goals', href: '/goals', icon: '🎯' },
    { name: 'Review Cycles', href: '/cycles', icon: '🔄' },
    { name: 'Reviews', href: '/reviews', icon: '📝' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Top Nav */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <Link to="/" className="flex items-center text-xl font-bold text-blue-600">
                ⚡ PerfManager
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {navigation.map(item => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="mr-1.5">{item.icon}</span> {item.name}
                    {item.name === 'Reviews' && pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-right">
                <span className="text-gray-500 dark:text-slate-400">Signed in as </span>
                <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
                <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  user?.role === 'manager' 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                }`}>
                  {user?.role}
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button
                onClick={logout}
                className="rounded-md bg-gray-100 dark:bg-slate-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="sm:hidden border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 flex space-x-1 overflow-x-auto">
        {navigation.map(item => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
              isActive(item.href)
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="mr-1">{item.icon}</span> {item.name}
          </Link>
        ))}
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
