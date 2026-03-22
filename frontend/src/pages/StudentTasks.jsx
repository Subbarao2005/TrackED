import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Search, Bell, CheckSquare, Clock, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function StudentTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchTasks = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:5000/api/tasks/student', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setTasks(res.data);
        } catch (err) {
          toast.error("Could not fetch assigned tasks from Server.");
        } finally {
          setLoading(false);
        }
     };
     fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="student" />

      <div className="flex-1 ml-64 p-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Daily Tasks</h1>
            <p className="text-slate-400 text-sm mt-1">Work assigned by your mentor day by day.</p>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 rounded-full border border-slate-800 bg-[#0A0F1C] text-slate-400 hover:text-cyan-400 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white flex items-center gap-2"><CheckSquare className="w-5 h-5 text-cyan-400"/> Assigned Work</h2>
          </div>
          
          <div className="space-y-4">
            {loading ? (
               <p className="text-slate-500 font-medium">Synchronizing assignments with Mentor...</p>
            ) : tasks.length === 0 ? (
               <p className="text-slate-500 font-medium">You have no pending assignments! Great job.</p>
            ) : tasks.map((task) => (
              <div key={task._id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex gap-4 items-start">
                  <div className={`p-3 rounded-xl bg-${task.color}-500/10 border border-${task.color}-500/20 text-${task.color}-400`}>
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{task.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due: {task.deadline}</span>
                      <span className="text-slate-400">By: {task.assignedBy?.name || 'Your Mentor'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold bg-${task.color}-500/10 text-${task.color}-400 border border-${task.color}-500/20 shadow-inner`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
