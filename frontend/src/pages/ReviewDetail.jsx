import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Forms
  const [selfAssessmentText, setSelfAssessmentText] = useState('');
  const [managerAssessmentText, setManagerAssessmentText] = useState('');
  const [rating, setRating] = useState('');
  
  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await reviewsAPI.getOne(id);
        setReview(res.data);
        setSelfAssessmentText(res.data.selfAssessmentText || '');
        setManagerAssessmentText(res.data.managerAssessmentText || '');
        setRating(res.data.rating || '');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load review');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [id]);

  const handleSelfAssessment = async (e) => {
    e.preventDefault();
    try {
      const res = await reviewsAPI.submitSelfAssessment({ reviewCycleId: review.reviewCycleId, selfAssessmentText });
      setReview(res.data);
      alert('Self-assessment updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit');
    }
  };

  const handleManagerAssessment = async (e) => {
    e.preventDefault();
    try {
      const res = await reviewsAPI.finalize({ 
        employeeId: review.employeeId, 
        reviewCycleId: review.reviewCycleId, 
        managerAssessmentText, 
        rating: parseInt(rating) 
      });
      setReview(res.data);
      alert('Review finalized successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to finalize');
    }
  };

  if (loading) return <div className="py-20 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="text-red-500 py-10 text-center">{error}</div>;
  if (!review) return <div className="py-10 text-center">Not found</div>;

  const isEmployee = user.id === review.employeeId;
  const isManager = user.id === review.managerId;
  const cycleStatus = review.reviewCycle.status;

  return (
    <div className="max-w-4xl mx-auto space-y-6 transition-colors duration-200">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Details</h1>
        <div className="flex gap-2">
          {review.status === 'Finalized' && (
            <button 
              onClick={handlePrint}
              className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center gap-1.5 transition-colors"
            >
              <span>📄</span> Export to PDF
            </button>
          )}
          <button onClick={() => navigate('/reviews')} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white text-sm">← Back to Reviews</button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .bg-white { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
          .dark .bg-slate-800 { background: white !important; color: black !important; border: 1px solid #e5e7eb !important; }
          .dark .text-white { color: black !important; }
          .dark .text-slate-300 { color: #374151 !important; }
          .dark .bg-slate-900 { background: white !important; }
        }
      `}} />

      <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 rounded-lg p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{review.employee?.name}</h2>
          <p className="text-gray-600 dark:text-slate-300 mt-1">Review Cycle: {review.reviewCycle?.title} <span className="text-sm bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full ml-1">{cycleStatus}</span></p>
        </div>
        <div className="text-left md:text-right">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${review.status === 'Finalized' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {review.status}
          </span>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Manager: {review.manager?.name}</p>
        </div>
      </div>

      {isEmployee && cycleStatus === 'Under Review' && review.status !== 'Finalized' && (
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Edit Self Assessment</h2>
          <form onSubmit={handleSelfAssessment} className="space-y-4">
            <textarea
              className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
              rows={5}
              required
              value={selfAssessmentText}
              onChange={e => setSelfAssessmentText(e.target.value)}
              placeholder="Reflect on your performance..."
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Update Assessment</button>
          </form>
        </div>
      )}

      {review.selfAssessmentText && (
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Self Assessment</h2>
          <p className="whitespace-pre-wrap text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900 p-4 rounded-md border border-gray-100 dark:border-slate-700">{review.selfAssessmentText}</p>
          {review.selfAssessmentSubmittedAt && (
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-2 text-right">Submitted at: {new Date(review.selfAssessmentSubmittedAt).toLocaleString()}</p>
          )}
        </div>
      )}

      {isManager && cycleStatus === 'Under Review' && review.status !== 'Finalized' && (
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Manager Final Review</h2>
          <form onSubmit={handleManagerAssessment} className="space-y-4">
            <div>
              <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-slate-300">Assessment text</label>
              <textarea
                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
                rows={5}
                required
                value={managerAssessmentText}
                onChange={e => setManagerAssessmentText(e.target.value)}
                placeholder="Write your final review feedback..."
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-slate-300">Overall Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                required
                className="w-full md:w-32 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                value={rating}
                onChange={e => setRating(e.target.value)}
              />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm text-yellow-800">
              Warning: Finalizing a review cannot be undone. Once finalized, the employee will see your feedback and rating.
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Finalize Review</button>
          </form>
        </div>
      )}

      {review.managerAssessmentText && (
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Manager Assessment</h2>
          <div className="mb-4">
            <span className="inline-flex items-center bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-md border border-blue-100 dark:border-blue-500/20 font-semibold text-lg">
              Rating: {review.rating} / 5
            </span>
          </div>
          <p className="whitespace-pre-wrap text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900 p-4 rounded-md border border-gray-100 dark:border-slate-700">{review.managerAssessmentText}</p>
          {review.finalizedAt && (
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-2 text-right">Finalized at: {new Date(review.finalizedAt).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
