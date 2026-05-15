import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cyclesAPI, goalsAPI, reviewsAPI } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [directReports, setDirectReports] = useState([]);
  const [managerStats, setManagerStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [cyclesRes, goalsRes, reviewsRes] = await Promise.all([
        cyclesAPI.getAll({ limit: 5 }),
        goalsAPI.getAll({ limit: 5 }),
        reviewsAPI.getAll({ limit: 5 })
      ]);

      setCycles(cyclesRes.data.data);
      setGoals(goalsRes.data.data);
      setReviews(reviewsRes.data.data);

      if (user?.role === 'manager') {
        const [reportsRes, statsRes] = await Promise.all([
          reviewsAPI.getDirectReports(),
          reviewsAPI.getStatsSummary()
        ]);
        setDirectReports(reportsRes.data);
        setManagerStats(statsRes.data);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statusColors = {
    'Open': 'bg-green-100 text-green-700',
    'Under Review': 'bg-blue-100 text-blue-700',
    'Closed': 'bg-gray-100 text-gray-700'
  };

  const goalStatusColors = {
    'Not Started': 'bg-gray-100 text-gray-700',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    'Completed': 'bg-green-100 text-green-700'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {user?.role === 'manager' ? 'Manager Dashboard' : 'My Dashboard'}
        </h1>
        <p className="mt-1 text-gray-500 dark:text-slate-400">Welcome back, {user?.name}!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Active Cycles</p>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {cycles.filter(c => c.status !== 'Closed').length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">My Goals</p>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{goals.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Pending Reviews</p>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {reviews.filter(r => r.status === 'Pending').length}
          </p>
        </div>
        {user?.role === 'manager' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Direct Reports</p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{directReports.length}</p>
          </div>
        )}
      </div>

      {/* Active Review Cycles */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Review Cycles</h2>
          <Link to="/cycles" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">View all →</Link>
        </div>
        {cycles.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-400 text-sm">No review cycles yet.</p>
        ) : (
          <div className="space-y-3">
            {cycles.filter(c => c.status !== 'Closed').map(cycle => (
              <div key={cycle.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{cycle.title}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[cycle.status] || ''}`}>
                  {cycle.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Goals */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Goals</h2>
          <Link to="/goals" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">View all →</Link>
        </div>
        {goals.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-400 text-sm">No goals created yet.</p>
        ) : (
          <div className="space-y-3">
            {goals.slice(0, 5).map(goal => (
              <div key={goal.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{goal.title}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{goal.reviewCycle?.title}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${goalStatusColors[goal.status] || ''}`}>
                  {goal.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manager Specific Insights */}
      {user?.role === 'manager' && managerStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Review Status Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Review Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-slate-400">Finalized Reviews</span>
                  <span className="font-medium dark:text-white">{managerStats.finalized} / {managerStats.totalReports}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(managerStats.finalized / managerStats.totalReports) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-slate-400">Pending Actions</span>
                  <span className="font-medium dark:text-white">{managerStats.pending} / {managerStats.totalReports}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(managerStats.pending / managerStats.totalReports) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Ratings Comparison */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historical Ratings</h2>
            {managerStats.historicalRatings.length === 0 ? (
              <p className="text-gray-500 dark:text-slate-400 text-sm">No historical ratings available yet.</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {managerStats.historicalRatings.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{r.employeeName}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{r.cycleTitle}</p>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, star) => (
                        <span key={star} className={`text-sm ${star < r.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600'}`}>★</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manager: Direct Reports */}
      {user?.role === 'manager' && directReports.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Direct Reports</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {directReports.map(report => (
              <div key={report.id} className="flex items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold mr-3">
                  {report.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{report.name}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{report.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
