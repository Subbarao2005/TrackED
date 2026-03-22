import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Bell, CheckSquare, Send, Calendar, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MentorTasks() {
  const [taskTitle, setTaskTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [target, setTarget] = useState('all');
  const [recentTasks, setRecentTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const updateTaskStatus = async (id) => {
    try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/tasks/${id}/status`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Task updated!");
        fetchRecentTasks(); // Live refresh the array
    } catch(err) { 
        toast.error("Failed to cycle task status"); 
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
             
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {recentTasks.length === 0 ? (
                 <p className="text-slate-500 text-sm">No recent assignments found.</p>
               ) : recentTasks.map((t) => (
                 <div key={t._id} className="p-4 bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-slate-200">{t.title}</h3>
                     <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${t.color}-500/10 text-${t.color}-400 border border-${t.color}-500/20`}>{t.status}</span>
                       {t.status !== 'Completed' && (
                          <button 
                            onClick={() => updateTaskStatus(t._id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded transition-all shadow-md pb-[-1px]"
                          >
                            Mark
                          </button>
                       )}
                     </div>
                   </div>
                   <div className="flex gap-4 text-xs font-medium text-slate-500 mt-3 pt-3 border-t border-slate-800">
                     <span>Deadline: {t.deadline}</span>
                     <span>Assigned to: <span className="text-slate-300">{t.student?.name || 'Unknown Student'}</span></span>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
