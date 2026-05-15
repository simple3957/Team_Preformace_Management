import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { goalsAPI, cyclesAPI } from '../services/api';

export default function GoalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    reviewCycleId: '', 
    status: 'Not Started',
    weight: 'Medium',
    progress: 0
  });
  const [cycles, setCycles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cyclesAPI.getAll({ status: 'Open', limit: 50 })
      .then(res => setCycles(res.data.data))
      .catch(console.error);

    if (isEditing) {
      goalsAPI.getOne(id)
        .then(res => setFormData({
          title: res.data.title,
          description: res.data.description || '',
          reviewCycleId: res.data.reviewCycleId,
          status: res.data.status,
          weight: res.data.weight || 'Medium',
          progress: res.data.progress || 0
        }))
        .catch(err => setError(err.response?.data?.error || 'Failed to load goal'));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEditing) {
        await goalsAPI.update(id, formData);
      } else {
        await goalsAPI.create(formData);
      }
      navigate('/goals');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 transition-colors duration-200">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Goal' : 'Create Goal'}</h1>
      
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 p-4 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Title</label>
          <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm border p-2" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Description</label>
          <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm border p-2" />
        </div>

        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Review Cycle</label>
            <select required value={formData.reviewCycleId} onChange={e => setFormData({...formData, reviewCycleId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm border p-2">
              <option value="">Select a cycle</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Weight (Impact)</label>
          <select value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm border p-2">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Progress ({formData.progress}%)</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={formData.progress} 
            onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})} 
            className="mt-2 block w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" 
          />
        </div>

        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Status</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm border p-2">
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={() => navigate('/goals')} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">Save</button>
        </div>
      </form>
    </div>
  );
}
