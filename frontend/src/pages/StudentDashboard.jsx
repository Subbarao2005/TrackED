import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { SkeletonStatCard, SkeletonTableRow } from '../components/SkeletonCard';
import { Bell, Search, TrendingUp, CheckCircle, CalendarDays, BookOpen, Calendar, ArrowUpRight, Clock, MapPin, CheckSquare, User, Key, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const [stats, setStats] = useState({ percentage: 100, todaysStatus: 'Pending', totalClassesRecorded: 0 });
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Smart Attendance OTP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpVal, setOtpVal] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
     const fetchDashboardData = async () => {
         try {
             const token = localStorage.getItem('token');
             const headers = { Authorization: `Bearer ${token}` };
             
             const statsRes = await axios.get('http://localhost:5000/api/attendance/student-stats', { headers });
             const tasksRes = await axios.get('http://localhost:5000/api/tasks/student', { headers });
             const notifsRes = await axios.get('http://localhost:5000/api/notifications', { headers });
             
             setStats(statsRes.data);
             setTasks(tasksRes.data);
             setNotifications(notifsRes.data);
         } catch(err) {
             console.error(err);
         } finally {
             setLoading(false);
         }
     };
     fetchDashboardData();
  }, []);

  const handleReadNotif = async (id) => {
      try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
          setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      } catch (err) {}
  };

  const verifyOTP = async () => {
      if (otpVal.length !== 4) return toast.error("OTP must be 4 digits.");
      setVerifying(true);
      try {
          const token = localStorage.getItem('token');
          await axios.post('http://localhost:5000/api/attendance/verify-otp', 
            { otp: otpVal }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success("Attendance Automatically Logged!");
          setStats(prev => ({ ...prev, todaysStatus: 'Present', percentage: prev.totalClassesRecorded === 0 ? 100 : Math.round(((prev.attendedClasses + 1) / (prev.totalClassesRecorded + 1))*100) }));
          setShowOtpModal(false);
          setOtpVal('');
      } catch (err) {
          toast.error(err.response?.data?.message || "OTP Verification Failed.");
      } finally {
          setVerifying(false);
      }
  };

  // SVG Gauge Calculation
  const attendanceScore = stats.percentage; 
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendanceScore / 100) * circumference;

  // Framer Motion variants
  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' } })
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      {/* Sidebar Integration */}
      <Sidebar role="student" />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8">
        
        {/* Top Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Performance Overview</h1>
            <p className="text-slate-400 text-sm mt-1">Check your latest academic statistics and upcoming tasks.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-[#0A0F1C] border border-slate-800 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 shadow-inner w-64 text-slate-200 font-medium transition-all hidden md:block"
              />
            </div>
            {/* Smart Attendance Button */}
            <button 
              onClick={() => setShowOtpModal(true)}
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg"
            >
              <Key className="w-4 h-4"/>
              Enter Smart OTP
            </button>
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className={`relative p-2 rounded-full border ${showNotifs ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 bg-[#0A0F1C]'} text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors`}>
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                  </>
                )}
              </button>
              
              {showNotifs && (
                 <div className="absolute right-0 mt-3 w-80 bg-[#0A0F1C] border border-slate-700 shadow-2xl rounded-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                       <h3 className="text-sm font-bold text-white">System Alerts</h3>
                       <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">{notifications.filter(n=>!n.read).length} New</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                       {notifications.length === 0 ? (
                           <p className="text-xs text-slate-500 p-4 text-center font-medium">All caught up! No notifications.</p>
                       ) : notifications.map(n => (
                           <div key={n._id} onClick={() => !n.read && handleReadNotif(n._id)} className={`p-4 border-b border-slate-800/50 hover:bg-slate-900 cursor-pointer transition-colors ${!n.read ? 'bg-cyan-500/5' : ''}`}>
                               <p className={`text-xs ${!n.read ? 'text-slate-200 font-bold' : 'text-slate-400 font-medium'}`}>{n.message}</p>
                               <span className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-wider block">{new Date(n.createdAt).toLocaleDateString()}</span>
                           </div>
                       ))}
                    </div>
                 </div>
              )}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
                JD
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-white leading-tight">John Doe</p>
                <p className="text-xs text-slate-400 font-medium">B.Tech - 3rd Year</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {loading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>

          <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible"
            className="bg-[#0A0F1C] border border-slate-800/80 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:border-cyan-500/50 transition-colors cursor-default">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" className="stroke-slate-800" strokeWidth="12" fill="none" />
                  <motion.circle
                     cx="80" cy="80" r="70"
                     className="stroke-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                     strokeWidth="12"
                     fill="none"
                     strokeDasharray={circumference}
                     initial={{ strokeDashoffset: circumference }}
                     animate={{ strokeDashoffset: loading ? circumference : strokeDashoffset }}
                     transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                     strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-slate-400 font-medium text-sm">Overall Attendance</h3>
            <p className="text-3xl font-extrabold text-white mt-1">{`${stats.percentage}%`}</p>
          </motion.div>

          <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible"
            className="bg-[#0A0F1C] border border-slate-800/80 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-colors cursor-default">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-3">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 relative z-10">
                <Calendar className="w-6 h-6 text-indigo-400" />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full relative z-10 ${stats.todaysStatus === 'Present' ? 'bg-emerald-500/10 text-emerald-400' : stats.todaysStatus === 'Absent' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'}`}>
                Today: {stats.todaysStatus}
              </span>
            </div>
            <h3 className="text-slate-400 font-medium text-sm">Classes Tracked</h3>
            <p className="text-3xl font-extrabold text-white mt-1">{stats.totalClassesRecorded}</p>
            {stats.totalClassesRecorded > 0 && (
              <div className="flex gap-3 mt-3 pt-3 border-t border-slate-800">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  {stats.attendedClasses} Present
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                  {stats.absentClasses} Absent
                </span>
              </div>
            )}
          </motion.div>

          <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible"
            className="bg-[#0A0F1C] border border-slate-800/80 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-colors cursor-default">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <CheckCircle className="w-6 h-6 text-rose-400" />
              </div>
              {tasks.filter(t => t.status === 'Pending').length > 0 && (
                <span className="bg-rose-500/10 text-rose-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  {tasks.filter(t => t.status === 'Pending').length} Due
                </span>
              )}
            </div>
            <h3 className="text-slate-400 font-medium text-sm">Pending Tasks</h3>
            <p className="text-3xl font-bold text-white mt-1">{tasks.filter(t => t.status === 'Pending').length}</p>
            {tasks.filter(t => t.status === 'In Progress').length > 0 && (
              <p className="text-xs text-amber-400 font-bold mt-2">{tasks.filter(t => t.status === 'In Progress').length} In Progress</p>
            )}
          </motion.div>

          <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible"
            className="bg-gradient-to-br from-indigo-600 to-cyan-600 border border-cyan-500/50 p-6 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.2)] relative overflow-hidden">
            <div className="absolute right-0 top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
            <CalendarDays className="w-8 h-8 text-white/80 mb-6" />
            <h3 className="text-cyan-100 font-medium text-sm">Next Mentor Meeting</h3>
            <p className="text-xl font-bold text-white mt-1">{stats.nextMeeting || 'Not Scheduled'}</p>
            <p className="text-sm text-cyan-200 mt-2 font-medium border-t border-cyan-400/30 pt-2">{stats.mentorName ? `Prof. ${stats.mentorName}` : 'Unassigned Mentor'}</p>
          </motion.div>

          </> /* end loading conditional */
          )}

        </div>

        {/* Lower Dashboard Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6">
             <h2 className="text-xl font-bold text-white mb-6">Recent Daily Tasks</h2>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-sm border-b border-slate-800">
                      <th className="pb-3 font-semibold">Task Description</th>
                      <th className="pb-3 font-semibold">Assigned By</th>
                      <th className="pb-3 font-semibold">Deadline</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium">
          {loading ? (
            <>
              <SkeletonTableRow cols={4} />
              <SkeletonTableRow cols={4} />
              <SkeletonTableRow cols={4} />
            </>
          ) : tasks.length === 0 ? (
             <tr><td colSpan="4" className="py-8 text-center text-slate-500">Syncing live task database...</td></tr>
          ) : tasks.map(task => {
                       const colorClass = task.color === 'rose' ? 'bg-rose-500/10 text-rose-400' : task.color === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400';
                       return (
                         <tr key={task._id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                           <td className="py-4 text-slate-200">{task.title}</td>
                           <td className="py-4 text-slate-400">{task.assignedBy?.name || 'Unknown Mentor'}</td>
                           <td className="py-4 text-slate-400">{task.deadline}</td>
                           <td className="py-4 text-right">
                              <span className={`px-3 py-1.5 font-bold rounded-full text-[10px] tracking-widest uppercase ${colorClass}`}>
                                {task.status}
                              </span>
                           </td>
                         </tr>
                       );
                    })}
                  </tbody>
                </table>
             </div>
          </div>

          <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-bold text-white mb-2 self-start">Monthly Gauge</h2>
            <div className="relative w-40 h-40 flex items-center justify-center mt-4">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                <motion.circle
                  cx="80" cy="80" r="70"
                  stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: loading ? circumference : strokeDashoffset }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  className="text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{loading ? '...' : `${stats.percentage}%`}</span>
                <span className="text-xs text-slate-400 font-medium">Attendance</span>
              </div>
            </div>
            <p className="mt-6 text-slate-400 text-sm font-medium">Your interactive attendance performance automatically synced securely with your Mentor's database.</p>
          </div>
        </div>

      </div>

      {/* Smart OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0A0F1C] border border-emerald-500/30 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                 <Key className="w-8 h-8 text-emerald-400" />
              </div>
              
              <h2 className="text-2xl font-black text-white text-center mb-2">Smart Attendance</h2>
              <p className="text-slate-400 text-sm text-center mb-8">Enter the 4-digit OTP displayed on your Mentor's screen to log your presence.</p>

              <input 
                 type="text" 
                 maxLength="4"
                 value={otpVal}
                 onChange={e => setOtpVal(e.target.value.replace(/\D/g, ''))}
                 className="w-full bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 text-center text-4xl font-black tracking-[0.5em] py-4 rounded-xl text-emerald-400 outline-none mb-6 placeholder-slate-700"
                 placeholder="0000"
              />

              <div className="flex gap-4">
                <button onClick={() => setShowOtpModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 transition-colors">Cancel</button>
                <button 
                  onClick={verifyOTP} 
                  disabled={verifying}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  {verifying ? "..." : "Verify"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
