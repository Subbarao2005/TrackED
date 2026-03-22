import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { Bell, CheckSquare, Send, Calendar, Clock, Link, CheckCircle2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MentorTasks() {
  const [taskTitle, setTaskTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [target, setTarget] = useState('all');
  const [recentTasks, setRecentTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Grading State
  const [gradingTask, setGradingTask] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const fetchRecentTasks = async () => {
     try {
       const token = localStorage.getItem('token');
       const res = await axios.get('http://localhost:5000/api/tasks/mentor', {
          headers: { Authorization: `Bearer ${token}` }
       });
       setRecentTasks(res.data);
     } catch (err) {
       console.error(err);
     }
  };

  useEffect(() => {
     fetchRecentTasks();
     
     // Also fetch live assigned students for the dropdown
     const fetchStudentRoster = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/attendance/today', {
               headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(res.data.roster);
        } catch(err) {
            console.error('Roster fetch failed:', err);
        }
     };
     fetchStudentRoster();
  }, []);

  const updateTaskStatus = async (id, status) => {
    try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/tasks/${id}/status`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Task status updated!");
        fetchRecentTasks();
    } catch(err) { 
        toast.error("Failed to update task status"); 
    }
  };

  const handleGradeSubmit = async (taskId) => {
    if (!grade) return toast.error("Please enter a grade.");
    setIsGrading(true);
    try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/tasks/${taskId}/submit`, 
          { grade, feedback },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Task graded and approved!");
        setGradingTask(null);
        setGrade('');
        setFeedback('');
        fetchRecentTasks();
    } catch(err) { 
        toast.error(err.response?.data?.message || "Failed to submit grade"); 
    } finally {
        setIsGrading(false);
    }
  };
  
  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/tasks/assign', 
        { title: taskTitle, deadline, target },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Task successfully pushed to students!');
      setTaskTitle('');
      setDeadline('');
      fetchRecentTasks(); // Live refresh the UI log
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to assign task.');
      console.error("AXIOS Assign Err:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="mentor" />

      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Assign Tasks</h1>
            <p className="text-slate-400 text-sm mt-1">Create and assign daily work parameters to students.</p>
          </div>
          <button className="relative p-2 rounded-full border border-slate-800 bg-[#0A0F1C] text-slate-400 hover:text-indigo-400 transition-colors">
             <Bell className="w-5 h-5" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* New Task Form */}
          <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-8">
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-bold text-white flex items-center gap-2"><CheckSquare className="w-5 h-5 text-indigo-400"/> Create New Assignment</h2>
             </div>
             
             <form onSubmit={handleAssign} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Assignment Description</label>
                  <textarea 
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    rows="4"
                    placeholder="E.g., Complete Chapter 4 Physics Workbook by tomorrow..."
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none transition-all"
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Due Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="date"
                        required
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Assign To</label>
                    <select 
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option value="all">All My Students</option>
                      {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all flex justify-center items-center gap-2 hover:-translate-y-0.5">
                  <Send className="w-4 h-4" /> {loading ? "Broadcasting..." : "Push Assignment"}
                </button>
             </form>
          </div>

          {/* Recently Assigned Tasks */}
          <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-8">
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-slate-400"/> Recently Assigned</h2>
             </div>
             
             <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
               {recentTasks.length === 0 ? (
                 <p className="text-slate-500 text-sm">No recent assignments found.</p>
               ) : recentTasks.map((t) => (
                 <motion.div layout key={t._id} className="p-5 bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl relative overflow-hidden">
                   
                   {/* Highlight Under Review tasks */}
                   {t.status === 'Under Review' && (
                     <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                   )}

                   <div className="flex justify-between items-start mb-3">
                     <div>
                       <h3 className="font-bold text-slate-200 text-lg">{t.title}</h3>
                       <p className="text-xs text-slate-400 mt-1">Student: <span className="font-bold text-slate-300">{t.student?.name || 'Unknown'}</span></p>
                     </div>
                     <span className={`text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-${t.color}-500/10 text-${t.color}-400 border border-${t.color}-500/20 shadow-inner`}>{t.status}</span>
                   </div>

                   {/* Submissions & Grading UI */}
                   {t.status === 'Under Review' && t.submissionUrl && (
                     <div className="mt-4 p-4 bg-slate-950/50 border border-cyan-500/20 rounded-xl">
                       <div className="flex items-center gap-2 mb-4">
                         <div className="bg-cyan-500/10 p-2 rounded-lg"><Link className="w-4 h-4 text-cyan-400" /></div>
                         <a href={t.submissionUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 truncate max-w-[200px]">
                           View Submission Link
                         </a>
                       </div>

                       {gradingTask === t._id ? (
                         <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                           <input 
                              type="number" min="0" max="100" placeholder="Grade (0-100)"
                              value={grade} onChange={e => setGrade(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                           />
                           <textarea 
                              placeholder="Feedback (optional)..." rows="2"
                              value={feedback} onChange={e => setFeedback(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none resize-none"
                           />
                           <div className="flex gap-2">
                             <button onClick={() => handleGradeSubmit(t._id)} disabled={isGrading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2">
                               <CheckCircle2 className="w-4 h-4" /> Approve & Grade
                             </button>
                             <button onClick={() => {setGradingTask(null); setGrade(''); setFeedback('');}} className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-sm transition-all">
                               Cancel
                             </button>
                           </div>
                         </div>
                       ) : (
                         <button 
                           onClick={() => setGradingTask(t._id)}
                           className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 font-bold rounded-lg text-sm transition-all flex justify-center items-center gap-2"
                         >
                           <MessageSquare className="w-4 h-4" /> Grade Task
                         </button>
                       )}
                     </div>
                   )}

                   {/* Completed Status view */}
                   {t.status === 'Completed' && t.grade && (
                     <div className="mt-3 text-xs bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center justify-between">
                       <span className="text-emerald-400 font-bold">Grade: {t.grade}/100</span>
                       {t.feedback && <span className="text-slate-400 italic truncate max-w-[150px]">"{t.feedback}"</span>}
                     </div>
                   )}

                   {/* Quick Status toggle for Pending/In progress */}
                   {t.status !== 'Completed' && t.status !== 'Under Review' && (
                     <div className="mt-3 flex gap-2">
                       <button 
                         onClick={() => updateTaskStatus(t._id)}
                         className="flex-1 py-1.5 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-400 transition-colors"
                       >
                         Nudge Status (Debug)
                       </button>
                     </div>
                   )}

                 </motion.div>
               ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
