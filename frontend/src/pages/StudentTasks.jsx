import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { SkeletonTableRow } from '../components/SkeletonCard';
import { Search, Bell, CheckSquare, Clock, Calendar, Filter, ClipboardList, CheckCircle2, Hourglass, UploadCloud, Link } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// ─── Countdown Helper ────────────────────────────────────────────
function getCountdown(deadlineStr) {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline - now;
  if (isNaN(deadline.getTime())) return { label: deadlineStr, urgent: false };
  if (diffMs < 0) return { label: 'Overdue!', urgent: true };
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days === 0 && hours <= 24) return { label: `Due in ${hours}h`, urgent: true };
  if (days === 1) return { label: 'Due Tomorrow', urgent: false };
  if (days <= 3) return { label: `Due in ${days} days`, urgent: false };
  return { label: deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), urgent: false };
}

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Under Review', 'Completed'];

export default function StudentTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Submission State
  const [submitTask, setSubmitTask] = useState(null); // the id of the task being submitted
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/tasks/student', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(res.data);
      } catch (err) {
        toast.error('Could not fetch assigned tasks from server.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleTaskSubmit = async (taskId) => {
    if (!submissionUrl) return toast.error('Please enter a submission link (Drive, GitHub, etc.)');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/tasks/${taskId}/submit`, 
        { submissionUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state smoothly
      setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
      toast.success('Task submitted! Sent to mentor for review.');
      setSubmitTask(null);
      setSubmissionUrl('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Live Filter Logic ────────────────────────────────────────
  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.assignedBy?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchCompleted = showCompleted || t.status !== 'Completed';
    return matchSearch && matchStatus && matchCompleted;
  });

  const pending = tasks.filter(t => t.status === 'Pending').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const underReview = tasks.filter(t => t.status === 'Under Review').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;

  const colorMap = {
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="student" />

      <div className="flex-1 ml-64 p-8">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Daily Tasks</h1>
            <p className="text-slate-400 text-sm mt-1">Work assigned by your mentor, tracked in real-time.</p>
          </div>
          <button className="relative p-2 rounded-full border border-slate-800 bg-[#0A0F1C] text-slate-400 hover:text-cyan-400 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </header>

        {/* Mini stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending', count: pending, color: 'text-rose-400', icon: Hourglass },
            { label: 'In Progress', count: inProgress, color: 'text-amber-400', icon: Clock },
            { label: 'Under Review', count: underReview, color: 'text-cyan-400', icon: UploadCloud },
            { label: 'Completed', count: completed, color: 'text-emerald-400', icon: CheckCircle2 },
          ].map(({ label, count, color, icon: Icon }) => (
            <div key={label} className="bg-[#0A0F1C] border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <Icon className={`w-6 h-6 ${color}`} />
              <div>
                <p className="text-2xl font-extrabold text-white">{loading ? '—' : count}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6">

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-cyan-400" /> Assigned Work
            </h2>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-700/50 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 w-48 transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-700/50">
                {STATUS_FILTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                      statusFilter === s
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Toggle completed */}
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                  showCompleted
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-slate-700 text-slate-500 bg-slate-900 hover:text-slate-300'
                }`}
              >
                {showCompleted ? '✓ Showing Completed' : 'Show Completed'}
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {loading ? (
              // Skeleton loaders
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex gap-4 items-center">
                  <div className="shimmer w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="shimmer h-4 w-2/3 rounded" />
                    <div className="shimmer h-3 w-1/3 rounded" />
                  </div>
                  <div className="shimmer h-7 w-20 rounded-full" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              // Rich empty state
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-6 border border-slate-700 shadow-inner">
                    <ClipboardList className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-300 mb-2">
                    {tasks.length === 0 ? 'No Assignments Yet!' : 'No Matching Tasks'}
                  </h3>
                  <p className="text-slate-500 text-sm max-w-xs">
                    {tasks.length === 0
                      ? 'Your mentor has not assigned any tasks yet. Enjoy the break! 🎉'
                      : 'Try adjusting your search or status filter to find what you\'re looking for.'}
                  </p>
                  {statusFilter !== 'All' && (
                    <button
                      onClick={() => { setStatusFilter('All'); setSearch(''); }}
                      className="mt-6 px-5 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-sm font-bold hover:bg-cyan-500/20 transition-all"
                    >
                      Clear Filters
                    </button>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <AnimatePresence>
                {filtered.map((task, i) => {
                  const c = colorMap[task.color] || colorMap.amber;
                  const countdown = getCountdown(task.deadline);
                  return (
                    <motion.div
                      key={task._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="flex gap-4 items-start">
                        <div className={`p-3 rounded-xl ${c.bg} border ${c.border} ${c.text} flex-shrink-0`}>
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{task.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-xs font-medium text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {task.deadline}
                            </span>
                            <span className={`flex items-center gap-1 font-bold ${countdown.urgent ? 'text-rose-400' : 'text-slate-400'}`}>
                              <Clock className="w-3.5 h-3.5" /> {countdown.label}
                            </span>
                            <span className="text-slate-500">By: {task.assignedBy?.name || 'Your Mentor'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        {submitTask === task._id ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Link className="w-4 h-4 text-cyan-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input 
                                type="url" 
                                placeholder="Paste Google Drive/GitHub link..."
                                value={submissionUrl}
                                onChange={e => setSubmissionUrl(e.target.value)}
                                className="bg-slate-950 border border-slate-700/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-56"
                              />
                            </div>
                            <button 
                              onClick={() => handleTaskSubmit(task._id)}
                              disabled={isSubmitting}
                              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              Send
                            </button>
                            <button 
                              onClick={() => { setSubmitTask(null); setSubmissionUrl(''); }}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            {(task.status === 'Pending' || task.status === 'In Progress') && (
                              <button 
                                onClick={() => setSubmitTask(task._id)}
                                className="px-4 py-1.5 rounded-xl border border-dashed border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-500/80 text-cyan-400 text-xs font-bold transition-colors flex items-center gap-2 flex-shrink-0"
                              >
                                <UploadCloud className="w-4 h-4" /> Submit
                              </button>
                            )}

                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${c.bg} ${c.text} border ${c.border} shadow-inner flex-shrink-0`}>
                              {task.status}
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
