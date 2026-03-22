import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Bell, ShieldCheck, CheckCircle2, XCircle, Key, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MentorAttendance() {
  const [students, setStudents] = useState([]);
  const [todayDate, setTodayDate] = useState('');
  const [loading, setLoading] = useState(true);
  
  // OTP State
  const [otpData, setOtpData] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
     const fetchRoster = async () => {
         try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/attendance/today', {
               headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(res.data.roster);
            setTodayDate(res.data.date);
         } catch(err) {
            toast.error('Failed to grab today\'s register form.');
         } finally {
            setLoading(false);
         }
     };
     fetchRoster();
  }, []);

  const generateOTP = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/attendance/generate-otp', {}, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setOtpData(res.data);
      toast.success("5-minute OTP Generated Successfully!");
    } catch(err) {
      toast.error("Failed to generate OTP.");
    } finally {
      setGenerating(false);
    }
  };

  const markStatus = (id, status) => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s));
  };

  const submitAttendance = async () => {
    const unmarked = students.filter(s => s.status === null);
    if (unmarked.length > 0) {
      toast.error(`Please explicitly mark everyone (${unmarked.length} remaining)`);
      return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const payload = {
            date: todayDate,
            attendanceData: students.map(s => ({ student: s.id, status: s.status }))
        };

        await axios.post('http://localhost:5000/api/attendance/mark', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Register Synchronized Explicitly!");
    } catch(err) {
        toast.error("Failed to commit register.");
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="mentor" />

      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Attendance Marking</h1>
            <p className="text-slate-400 text-sm mt-1">Manage daily attendance via manual entry or Smart OTP.</p>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 rounded-full border border-slate-800 bg-[#0A0F1C] text-slate-400 hover:text-indigo-400 transition-colors">
               <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Smart OTP Section */}
        <div className="bg-gradient-to-r from-indigo-500/10 border border-indigo-500/30 rounded-3xl p-6 max-w-4xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
             <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2 mb-2"><Key className="w-5 h-5"/> Smart OTP System</h2>
             <p className="text-sm text-slate-400 max-w-md">Generate a distinct 4-digit code. Students can enter this on their devices to log attendance automatically. Valid for 5 minutes.</p>
           </div>
           
           <div className="flex items-center gap-4">
              {otpData ? (
                 <div className="flex items-center gap-4 bg-[#0A0F1C] border border-indigo-500/50 p-4 rounded-2xl shadow-lg">
                    <div className="text-center">
                       <p className="text-3xl font-black text-indigo-400 tracking-[0.2em]">{otpData.otp}</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3"/> Active Now</p>
                    </div>
                    <button onClick={generateOTP} className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 border border-slate-700 bg-slate-900 rounded-lg transition-colors">New</button>
                 </div>
              ) : (
                 <button onClick={generateOTP} disabled={generating} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg flex items-center gap-2">
                    <Key className="w-4 h-4"/> {generating ? "Generating..." : "Generate OTP"}
                 </button>
              )}
           </div>
        </div>

        {/* Manual Tracker */}
        <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-400"/> Daily Register: {todayDate || '...'}</h2>
             <button disabled={loading} onClick={submitAttendance} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
               Commit Register
             </button>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr className="text-slate-400 text-sm">
                  <th className="py-4 pl-6 font-semibold">Student Name</th>
                  <th className="py-4 font-semibold">ID Code</th>
                  <th className="py-4 pr-6 font-semibold text-right">Mark Status</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium divide-y divide-slate-800">
                {loading ? (
                    <tr><td colSpan="3" className="py-8 text-center text-slate-500">Retrieving Master Student Roster...</td></tr>
                ) : students.length === 0 ? (
                    <tr><td colSpan="3" className="py-8 text-center text-slate-500">You literally do not have any students assigned to track.</td></tr>
                ) : students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 pl-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">{student.name.charAt(0)}</div>
                      <span className="text-slate-200 text-base">{student.name}</span>
                    </td>
                    <td className="py-4 text-slate-500 font-mono text-xs max-w-[120px] truncate">{student.id}</td>
                    <td className="py-4 pr-6 flex justify-end gap-3">
                      <button 
                        onClick={() => markStatus(student.id, 'Present')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${student.status === 'Present' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-[#0A0F1C] border-slate-700 text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/30'}`}
                      >
                         <CheckCircle2 className="w-4 h-4" /> Present
                      </button>
                      <button 
                        onClick={() => markStatus(student.id, 'Absent')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${student.status === 'Absent' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-[#0A0F1C] border-slate-700 text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/30'}`}
                      >
                         <XCircle className="w-4 h-4" /> Absent
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
