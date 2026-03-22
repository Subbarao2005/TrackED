import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { User, Lock, Save, ShieldCheck, Mail, Key } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Profile() {
  const [user, setUser] = useState({ name: '', email: '', role: '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (err) {
        toast.error('Failed to load profile parameters.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match!');
    }
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/profile/password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Encryption key updated successfully!');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed.');
    } finally {
      setUpdating(false);
    }
  };

  const getRoleColor = (role) => {
    if (role === 'admin') return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    if (role === 'developer') return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
    if (role === 'teacher') return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30';
    if (role === 'mentor') return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
  };

  if (loading) return <div className="min-h-screen bg-[#060913] flex items-center justify-center text-cyan-500">Loading Profile Data...</div>;

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      {/* We determine the sidebar to render based on user's role natively stored in localStorage to match visual consistency */}
      <Sidebar role={localStorage.getItem('role') || 'student'} />

      <div className="flex-1 ml-64 p-8 overflow-y-auto w-full">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">Personal Workspace Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your identity mappings and secure access keys.</p>
        </header>

        <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Panel: Profile Info */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0A0F1C] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-all"></div>
            
            <div className="flex items-center gap-6 mb-10 relative">
               <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-inner relative">
                  <span className="text-4xl font-black text-slate-300">
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </span>
                  <div className="absolute -bottom-2 -right-2 bg-slate-800 p-2 rounded-full border border-slate-700 shadow-md">
                     <ShieldCheck className={`w-4 h-4 ${getRoleColor(user.role).split(' ')[0]}`} />
                  </div>
               </div>
               <div>
                  <h2 className="text-2xl font-black text-white">{user.name}</h2>
                  <span className={`inline-block mt-2 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border ${getRoleColor(user.role)}`}>
                    {user.role} Clearance
                  </span>
               </div>
            </div>

            <div className="space-y-6 relative">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><User className="w-4 h-4"/> Global Identity Name</label>
                 <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-slate-300 font-medium">
                   {user.name}
                 </div>
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Mail className="w-4 h-4"/> Primary Authentication Email</label>
                 <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-slate-300 font-medium font-mono text-sm">
                   {user.email}
                 </div>
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Key className="w-4 h-4"/> System Node ID</label>
                 <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-slate-500 font-mono text-xs truncate">
                   {user._id}
                 </div>
               </div>
            </div>
            {/* Note: In a robust v3.0, users could edit their email/names here via PUT /api/auth/profile */}
          </motion.div>

          {/* Right Panel: Password Change Matrix */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-[#0A0F1C] border border-rose-500/10 rounded-3xl p-8 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                 <Lock className="w-6 h-6 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Security Encryption Reset</h2>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div>
                 <label className="text-xs font-bold text-slate-400 mb-2 block ml-1">Current Protocol Key</label>
                 <input 
                   type="password" required 
                   placeholder="••••••••"
                   value={passwords.oldPassword} onChange={e => setPasswords({...passwords, oldPassword: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500 transition-colors shadow-inner font-mono tracking-widest placeholder-slate-600"
                 />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-400 mb-2 block ml-1">New 256-bit Key</label>
                 <input 
                   type="password" required 
                   placeholder="••••••••"
                   value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500 transition-colors shadow-inner font-mono tracking-widest placeholder-slate-600"
                 />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-400 mb-2 block ml-1">Confirm Protocol Match</label>
                 <input 
                   type="password" required 
                   placeholder="••••••••"
                   value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500 transition-colors shadow-inner font-mono tracking-widest placeholder-slate-600"
                 />
              </div>
              <button disabled={updating} type="submit" className="w-full py-4 mt-6 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white shadow-[0_0_20px_rgba(225,29,72,0.2)] transition-all flex justify-center items-center gap-2">
                 {updating ? <span className="animate-pulse">Rewriting Cipher...</span> : <><Save className="w-4 h-4"/> Confirm Key Override</>}
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
