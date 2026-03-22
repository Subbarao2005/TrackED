import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Mail, Search, Award, CheckCircle, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MentorStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchStudents = async () => {
         try {
             const token = localStorage.getItem('token');
             const res = await axios.get('http://localhost:5000/api/attendance/today', {
                 headers: { Authorization: `Bearer ${token}` }
             });
             setStudents(res.data.roster);
         } catch(err) {
             toast.error('Failed to query assigned Student Roster.');
         } finally {
             setLoading(false);
         }
     };
     fetchStudents();
  }, []);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="mentor" />

      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Assigned Scholars</h1>
            <p className="text-slate-400 text-sm mt-1">Live Database tracking explicitly linked by Global Administrators.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search database..." 
                className="bg-[#0A0F1C] border border-slate-800 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 shadow-inner w-64 text-slate-200 font-medium transition-all"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="text-slate-500 col-span-3 text-center py-10 font-bold">Querying Relational Linkages...</div>
          ) : students.length === 0 ? (
             <div className="text-slate-500 col-span-3 text-center py-10 font-bold">Teacher Administrators have not assigned any students to your Matrix Node yet.</div>
          ) : students.map((s, index) => (
            <div key={s.id} className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6 relative overflow-hidden group hover:border-indigo-500/50 transition-all cursor-default transform hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start gap-4 mb-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/20">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-bold text-lg text-white leading-tight">{s.name}</h3>
                  <p className="text-xs text-slate-400 font-medium text-mono flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5"/> Student Entity
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6 relative z-10">
                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-800">
                  <span className="text-slate-500 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-500"/> Current Standing</span>
                  <span className="font-bold text-white">{s.status || 'No Records Today'}</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-800">
                  <span className="text-slate-500 flex items-center gap-2"><Award className="w-4 h-4 text-emerald-500"/> Structural Code</span>
                  <span className="font-bold text-slate-300 font-mono text-xs">{s.id.slice(-6)}</span>
                </div>
              </div>

              <div className="flex gap-3 relative z-10">
                <button className="flex-1 py-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl text-sm font-bold transition-all shadow-inner hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                  Evaluation File
                </button>
                <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700">
                  <Mail className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
