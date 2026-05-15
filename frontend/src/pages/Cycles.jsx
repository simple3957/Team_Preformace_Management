import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cyclesAPI } from '../services/api';
import Pagination from '../components/Pagination';

export default function Cycles() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', startDate: '', endDate: '' });
  const [formError, setFormError] = useState('');

  const loadCycles = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await cyclesAPI.getAll({ page: pageNumber, limit: 10 });
      setCycles(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycles(page);
  }, [page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await cyclesAPI.create(formData);
      setShowCreateForm(false);
      setFormData({ title: '', startDate: '', endDate: '' });
      loadCycles(1);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create cycle');
    }
  };

  const handleTransition = async (id) => {
    try {
      await cyclesAPI.transition(id);
      loadCycles(page);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to transition cycle');
    }
  };

  const statusColors = {
    'Open': 'bg-secondary-light text-secondary-text',
    'Under Review': 'bg-primary-light text-primary-text',
    'Closed': 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-6 transition-colors duration-200">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Cycles</h1>
        {user?.role === 'manager' && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover"
          >
            {showCreateForm ? 'Cancel' : 'Create Cycle'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-medium mb-4 dark:text-white">Create New Review Cycle</h2>
          {formError && <div className="text-red-600 dark:text-red-400 mb-4">{formError}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Title</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm border p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Start Date</label>
                <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">End Date</label>
                <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm border p-2" />
              </div>
            </div>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover">Submit</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {cycles.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-slate-400">No review cycles found.</td></tr>
                ) : cycles.map(cycle => (
                  <tr key={cycle.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{cycle.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[cycle.status]}`}>
                        {cycle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user?.role === 'manager' && cycle.createdBy === user.id && cycle.status !== 'Closed' && (
                        <button onClick={() => handleTransition(cycle.id)} className="text-primary hover:text-primary-text">
                          Move to {cycle.status === 'Open' ? 'Under Review' : 'Closed'}
                        </button>
                      )}
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
