import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Search, Bell, Users, CheckSquare, Clock, ArrowUpRight, FileCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MentorDashboard() {
  const [dashboardData, setDashboardData] = useState({ students: [], metrics: null });
  const [loading, setLoading] = useState(true);
  
  const [meetingModal, setMeetingModal] = useState({ open: false, studentId: null, name: '' });
  const [meetingDate, setMeetingDate] = useState('');

  const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/mentor/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || "Failed to load secure dashboard data");
      } finally {
        setLoading(false);
      }
  };
  
  useEffect(() => { fetchDashboard(); }, []);

  const handleSetMeeting = async (e) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/mentor/meeting/${meetingModal.studentId}`, 
          { dateStr: meetingDate }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Meeting Scheduled Successfully!");
        setMeetingModal({ open: false, studentId: null, name: '' });
        setMeetingDate('');
        fetchDashboard();
    } catch (err) { toast.error("Failed to assign meeting limit"); }
  }

  const metrics = dashboardData.metrics || { totalAssigned: 0, pendingSubmissions: 0, avgWeeklyHours: 0 };
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="mentor" />

      <div className="flex-1 ml-64 p-8">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Mentor Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your assigned students and track their daily progress.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="bg-[#0A0F1C] border border-slate-800 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 shadow-inner w-64 text-slate-200 font-medium transition-all"
              />
            </div>
            <button className="relative p-2 rounded-full border border-slate-800 bg-[#0A0F1C] text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                MP
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-white leading-tight">Mr. Parker</p>
                <p className="text-xs text-slate-400 font-medium">Senior Mentor</p>
              </div>
            </div>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0A0F1C] border border-slate-800/80 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:border-violet-500/50 transition-colors cursor-default">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <Users className="w-6 h-6 text-violet-400" />
              </div>
            </div>
            <h3 className="text-slate-400 font-medium text-sm">Assigned Students</h3>
            <p className="text-3xl font-bold text-white mt-1">{loading ? "..." : metrics.totalAssigned}</p>
          </div>

          <div className="bg-[#0A0F1C] border border-slate-800/80 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-colors cursor-default">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <CheckSquare className="w-6 h-6 text-amber-400" />
              </div>
              <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">Requires Attention</span>
            </div>
            <h3 className="text-slate-400 font-medium text-sm">Pending Submissions</h3>
            <p className="text-3xl font-bold text-white mt-1">{loading ? "..." : metrics.pendingSubmissions}</p>
          </div>

          <div className="bg-[#0A0F1C] border border-slate-800/80 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-colors cursor-default">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-slate-400 font-medium text-sm">Average Weekly Hours</h3>
            <p className="text-3xl font-bold text-white mt-1">{loading ? "..." : metrics.avgWeeklyHours} <span className="text-lg text-slate-500">hrs</span></p>
          </div>
        </div>

        {/* Assigned Students List */}
        <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white">Student Roster</h2>
             <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2">
               Assign Daily Work <FileCheck className="w-4 h-4" />
             </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-sm border-b border-slate-800">
                  <th className="pb-3 font-semibold">Student Name</th>
                  <th className="pb-3 font-semibold">Today's Attendance</th>
                  <th className="pb-3 font-semibold">Scheduled Meeting</th>
                  <th className="pb-3 font-semibold">Current GPA</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {loading ? (
                    <tr><td colSpan="5" className="py-8 text-center text-slate-500">Connecting to Database...</td></tr>
                ) : dashboardData.students.length === 0 ? (
                    <tr><td colSpan="5" className="py-8 text-center text-slate-500">You have no assigned students yet.</td></tr>
                ) : (
                  dashboardData.students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">{student.name.charAt(0)}</div>
                      <span className="text-slate-200">{student.name}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${student.attendance === 'Present' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {student.attendance}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="bg-slate-800/50 px-3 py-1.5 border border-slate-700/50 rounded-lg text-xs font-medium text-cyan-200">
                         {student.nextMeeting}
                      </span>
                    </td>
                    <td className="py-4 text-slate-200 font-bold">{student.marks}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => setMeetingModal({ open: true, studentId: student.id, name: student.name })} className="text-cyan-400 hover:text-cyan-300 font-bold text-xs border border-cyan-500/30 px-3 py-1.5 rounded-lg hover:bg-cyan-500/10 mr-2 transition-colors">
                        Set Meeting
                      </button>
                      <button className="text-indigo-400 hover:text-indigo-300 transition-colors p-2 hover:bg-indigo-500/10 rounded-lg inline-block align-middle">
                        <ArrowUpRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Meeting Modal */}
      {meetingModal.open && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#0A0F1C] border border-cyan-500/50 w-[450px] p-8 rounded-3xl shadow-2xl relative">
              <h2 className="text-2xl font-bold text-white mb-2">Schedule Meeting</h2>
              <p className="text-slate-400 text-sm mb-6">Assign a next meeting boundary for {meetingModal.name}.</p>
              
              <form onSubmit={handleSetMeeting} className="space-y-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Timing Label</label>
                    <input type="text" required value={meetingDate} onChange={e => setMeetingDate(e.target.value)} placeholder="e.g. Tommorrow, 10:00 AM" className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:border-cyan-500/50" />
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setMeetingModal({ open: false })} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700">Cancel</button>
                    <button type="submit" className="flex-1 py-3 text-white rounded-xl font-bold transition-all bg-cyan-600 hover:bg-cyan-500">Assign Timing</button>
                 </div>
              </form>
            </div>
         </div>
      )}
    </div>
  );
}
