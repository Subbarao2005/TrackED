import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Activity, Users, ShieldCheck, Database, Trash2, Edit, Plus, LogIn } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, students: 0, mentors: 0, tasks: 0, completedTasks: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'teacher', password: '' });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const statsRes = await axios.get('http://localhost:5000/api/admin/system-stats', { headers });
      setStats(statsRes.data);

      const usersRes = await axios.get('http://localhost:5000/api/admin/users', { headers });
      setUsers(usersRes.data);
    } catch (err) {
      toast.error('System synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/user', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Node entity created successfully in matrix.');
      setShowForm(false);
      setFormData({ name: '', email: '', role: 'teacher', password: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Node creation failed.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user entirely from the system?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User permanently deleted.');
      fetchData();
    } catch (err) {
      toast.error('Deletion failed.');
    }
  };

  const handleImpersonate = (role) => {
    toast(`Routing to ${role} interface as Root Admin...`);
    window.location.href = `/${role}`;
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="admin" />

      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">System Global Control</h1>
            <p className="text-slate-400 text-sm mt-1">Super Admin Overview. Full cross-functional Matrix access.</p>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0A0F1C] border border-slate-800 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
            <Activity className="w-8 h-8 text-amber-500 mb-4" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Total Entities</p>
            <p className="text-4xl font-black text-white">{stats.users}</p>
          </div>
          <div className="bg-[#0A0F1C] border border-slate-800 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
            <Users className="w-8 h-8 text-cyan-500 mb-4" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Students</p>
            <p className="text-4xl font-black text-white">{stats.students}</p>
          </div>
          <div className="bg-[#0A0F1C] border border-slate-800 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
            <ShieldCheck className="w-8 h-8 text-indigo-500 mb-4" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Mentors</p>
            <p className="text-4xl font-black text-white">{stats.mentors}</p>
          </div>
          <div className="bg-[#0A0F1C] border border-slate-800 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
             <Database className="w-8 h-8 text-emerald-500 mb-4" />
             <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Tasks</p>
             <p className="text-4xl font-black text-white">{stats.tasks} <span className="text-sm font-medium text-emerald-400">({stats.completedTasks} done)</span></p>
          </div>
        </div>

        {/* Global User Control Table */}
        <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6 mb-8">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">Global Entity Matrix</h2>
             <button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] flex items-center gap-2">
               {showForm ? 'Cancel Creation' : <><Plus className="w-4 h-4"/> Draft Entity</>}
             </button>
           </div>

           {/* Create User Form Dropdown */}
           {showForm && (
              <motion.form 
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                onSubmit={handleCreateUser}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-bold ml-1 mb-1 block">Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0A0F1C] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold ml-1 mb-1 block">Email</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#0A0F1C] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="johndoe@tracked.com" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold ml-1 mb-1 block">Role Tier</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-[#0A0F1C] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 appearance-none">
                      <option value="student">Student</option>
                      <option value="mentor">Mentor</option>
                      <option value="teacher">Teacher (Admin Tier 1)</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold ml-1 mb-1 block">Auto Password</label>
                    <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[#0A0F1C] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Defaults to 'password'" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)]">Inject Node into Matrix</button>
                </div>
              </motion.form>
           )}

           {/* Table */}
           <div className="overflow-x-auto rounded-2xl border border-slate-800">
             <table className="w-full text-left">
               <thead className="bg-slate-900 border-b border-slate-800">
                 <tr className="text-slate-400 text-sm">
                   <th className="py-4 pl-6 font-semibold">Entity Profile</th>
                   <th className="py-4 font-semibold">Email Target</th>
                   <th className="py-4 font-semibold">Clearance Role</th>
                   <th className="py-4 pr-6 font-semibold text-right">System Override</th>
                 </tr>
               </thead>
               <tbody className="text-sm font-medium divide-y divide-slate-800 text-slate-300">
                 {loading ? (
                   <tr><td colSpan="4" className="py-8 text-center text-slate-500">Decrypting System Matrix...</td></tr>
                 ) : users.map(u => (
                   <tr key={u._id} className="hover:bg-slate-900/50 transition-colors">
                     <td className="py-4 pl-6 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs shadow-inner">
                         {u.name.charAt(0).toUpperCase()}
                       </div>
                       <span className="text-white font-bold">{u.name}</span>
                     </td>
                     <td className="py-4 text-slate-400">{u.email}</td>
                     <td className="py-4">
                       <span className={`px-2 py-1 uppercase tracking-widest text-[10px] font-black rounded-md bg-opacity-10 border border-opacity-20 
                        ${u.role === 'admin' ? 'text-amber-500 bg-amber-500 border-amber-500' : 
                          u.role === 'teacher' ? 'text-purple-500 bg-purple-500 border-purple-500' : 
                          u.role === 'mentor' ? 'text-cyan-500 bg-cyan-500 border-cyan-500' : 
                          'text-emerald-500 bg-emerald-500 border-emerald-500'}`}>
                         {u.role}
                       </span>
                     </td>
                     <td className="py-4 pr-6 text-right">
                       <div className="flex justify-end gap-2">
                         {['student', 'mentor', 'teacher'].includes(u.role) && (
                            <button onClick={() => handleImpersonate(u.role)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all" title={`Impersonate ${u.role}`}>
                              <LogIn className="w-4 h-4" />
                            </button>
                         )}
                         <button onClick={() => handleDeleteUser(u._id)} disabled={u.role === 'admin'} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
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
