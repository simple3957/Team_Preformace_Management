import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { goalsAPI, cyclesAPI } from '../services/api';
import Pagination from '../components/Pagination';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');

  useEffect(() => {
    cyclesAPI.getAll({ limit: 100 }).then(res => setCycles(res.data.data)).catch(console.error);
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (selectedCycle) params.cycleId = selectedCycle;
      const res = await goalsAPI.getAll(params);
      setGoals(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [page, selectedCycle]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await goalsAPI.delete(id);
      loadGoals();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete goal');
    }
  };

  const statusColors = {
    'Not Started': 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300',
    'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  };

  const weightColors = {
    'Low': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    'Medium': 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    'High': 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
  };

  return (
    <div className="space-y-6 transition-colors duration-200">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goals</h1>
        <Link to="/goals/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Create Goal
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <select 
          value={selectedCycle} 
          onChange={e => setSelectedCycle(e.target.value)}
          className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-md p-2 shadow-sm text-sm"
        >
          <option value="">All Cycles</option>
          {cycles.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Goal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {goals.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-slate-400">No goals found.</td></tr>
                ) : goals.map(goal => (
                  <tr key={goal.id}>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      <div>{goal.title}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400 font-normal">{goal.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${weightColors[goal.weight || 'Medium']}`}>
                        {goal.weight || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${goal.progress || 0}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-slate-400">{goal.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[goal.status]}`}>
                        {goal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <Link to={`/goals/${goal.id}/edit`} className="text-blue-600 hover:text-blue-900">Edit</Link>
                      <button onClick={() => handleDelete(goal.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
