import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewsAPI, cyclesAPI } from '../services/api';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cycles, setCycles] = useState([]);

  // For starting a new self-assessment
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [newAssessmentData, setNewAssessmentData] = useState({ reviewCycleId: '', selfAssessmentText: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'employee') {
      cyclesAPI.getAll({ status: 'Under Review', limit: 100 })
        .then(res => setCycles(res.data.data))
        .catch(console.error);
    }
  }, [user]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewsAPI.getAll({ page, limit: 10 });
      setReviews(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page]);

  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      await reviewsAPI.submitSelfAssessment(newAssessmentData);
      setShowNewAssessment(false);
      setNewAssessmentData({ reviewCycleId: '', selfAssessmentText: '' });
      loadReviews();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit assessment');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 transition-colors duration-200">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h1>
        {user?.role === 'employee' && (
          <button 
            onClick={() => setShowNewAssessment(!showNewAssessment)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showNewAssessment ? 'Cancel' : 'Submit Self-Assessment'}
          </button>
        )}
      </div>

      {showNewAssessment && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-medium mb-4 dark:text-white">New Self Assessment</h2>
          <form onSubmit={handleSubmitAssessment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Review Cycle</label>
              <select required value={newAssessmentData.reviewCycleId} onChange={e => setNewAssessmentData({...newAssessmentData, reviewCycleId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm border p-2">
                <option value="">Select a cycle</option>
                {cycles.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Self Assessment</label>
              <textarea rows={4} required value={newAssessmentData.selfAssessmentText} onChange={e => setNewAssessmentData({...newAssessmentData, selfAssessmentText: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm border p-2 placeholder-gray-400 dark:placeholder-slate-500" placeholder="Reflect on your performance..."></textarea>
            </div>
            <button type="submit" disabled={submitLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {submitLoading ? 'Submitting...' : 'Submit'}
            </button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cycle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {reviews.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-slate-400">No reviews found.</td></tr>
                ) : reviews.map(review => (
                  <tr key={review.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{review.employee?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{review.reviewCycle?.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.status === 'Finalized' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <Link to={`/reviews/${review.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300">View Details</Link>
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
