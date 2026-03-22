import React from 'react';
import Sidebar from '../components/Sidebar';
import { Search, Bell, BarChart, GraduationCap, Building2, TrendingUp, Settings } from 'lucide-react';

export default function TeacherDashboard() {
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="teacher" />

      <div className="flex-1 ml-64 p-8">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Global Administration</h1>
            <p className="text-slate-400 text-sm mt-1">Supervise mentors and students across the entire institution.</p>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 rounded-full border border-slate-800 bg-[#0A0F1C] text-slate-400 hover:text-purple-400 hover:border-purple-500/50 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                DR
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-white leading-tight">Dr. Richards</p>
                <p className="text-xs text-slate-400 font-medium">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Mentors', value: '42', icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Total Students', value: '1,284', icon: GraduationCap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: 'Avg Attendance', value: '89.2%', icon: BarChart, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'System Health', value: '98%', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#0A0F1C] border border-slate-800/80 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <h3 className="text-slate-400 font-medium text-sm">{stat.label}</h3>
              <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Mentors Table */}
          <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-white">Mentor Performance</h2>
               <button className="p-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><Settings className="w-4 h-4" /></button>
             </div>
             
             <div className="space-y-4">
                {[
                  { name: 'Mr. Parker', rating: '98%', students: 24, progress: 'bg-emerald-500', width: '98%' },
                  { name: 'Ms. Jenkins', rating: '92%', students: 28, progress: 'bg-emerald-400', width: '92%' },
                  { name: 'Dr. Banner', rating: '74%', students: 15, progress: 'bg-amber-500', width: '74%' },
                  { name: 'Mrs. Davis', rating: '61%', students: 21, progress: 'bg-rose-500', width: '61%' },
                ].map((mentor, i) => (
                  <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <div className="flex justify-between text-sm font-medium mb-2">
                       <span className="text-slate-200">{mentor.name}</span>
                       <span className="text-slate-400">{mentor.rating} Rating</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2">
                      <div className={`${mentor.progress} h-1.5 rounded-full`} style={{ width: mentor.width }}></div>
                    </div>
                    <span className="text-xs text-slate-500">{mentor.students} Active Students</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Quick Admin Actions Box */}
          <div className="bg-gradient-to-br from-[#0A0F1C] to-slate-900 rounded-3xl border border-slate-800/80 shadow-lg p-6">
             <h2 className="text-xl font-bold text-white mb-6">Administrative Actions</h2>
             <div className="flex flex-col gap-4">
                <button className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-colors group">
                  <div className="flex flex-col text-left">
                     <span className="text-purple-400 font-bold mb-1">Generate Monthly Report</span>
                     <span className="text-xs text-slate-400">Export student & mentor PDF report</span>
                  </div>
                  <BarChart className="text-slate-600 group-hover:text-purple-400 transition-colors w-6 h-6" />
                </button>
                <button className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-colors group">
                  <div className="flex flex-col text-left">
                     <span className="text-cyan-400 font-bold mb-1">Onboard New Mentor</span>
                     <span className="text-xs text-slate-400">Add credentials and set department</span>
                  </div>
                  <Building2 className="text-slate-600 group-hover:text-cyan-400 transition-colors w-6 h-6" />
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
