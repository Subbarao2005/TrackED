import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { UserPlus, Trash2, Edit, CheckCircle, XCircle, Settings, Users } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function TeacherUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student' });
  const [formLoad, setFormLoad] = useState(false);

  const fetchUsers = async () => {
     try {
         const token = localStorage.getItem('token');
         const res = await axios.get('http://localhost:5000/api/teacher/users', {
             headers: { Authorization: `Bearer ${token}` }
         });
         setUsers(res.data);
     } catch (err) {
         toast.error("Failed to query active user table from Mongo.");
     } finally {
         setLoading(false);
     }
  };

  useEffect(() => {
      fetchUsers();
  }, []);

  const handleCreate = async (e) => {
      e.preventDefault();
      setFormLoad(true);
      try {
         const token = localStorage.getItem('token');
         await axios.post('http://localhost:5000/api/teacher/user', newUser, {
             headers: { Authorization: `Bearer ${token}` }
         });
         toast.success(`${newUser.role} officially registered in the Database!`);
         setIsModalOpen(false);
         setNewUser({ name: '', email: '', role: 'student' });
         fetchUsers();
      } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to map user profile.');
      } finally {
          setFormLoad(false);
      }
  };

  const handleDelete = async (userId) => {
      if(!window.confirm('Are you strictly positive? This will trigger a Database Cascade wipe and destroy any associated tasks and attendance.')) return;
      
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/teacher/user/${userId}`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          toast.success("Identity profile successfully eliminated.");
          fetchUsers();
      } catch (err) {
          toast.error("Database cascade crash.");
      }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="teacher" />

      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">System Administration</h1>
            <p className="text-slate-400 text-sm mt-1">Spawn and eliminate Mentor and Student roles securely.</p>
          </div>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-2xl text-white font-bold transition-all shadow-md shadow-fuchsia-500/20 flex items-center gap-2"
          >
             <UserPlus className="w-5 h-5"/> Instantiate Native Role
          </button>
        </header>

        {isModalOpen && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-[#0A0F1C] border border-slate-700 w-[500px] p-8 rounded-3xl shadow-2xl relative">
                  <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-500 hover:text-white">
                     <XCircle className="w-6 h-6" />
                  </button>
                  <h2 className="text-2xl font-bold text-white mb-6">Create System Profile</h2>
                  
                  <form onSubmit={handleCreate} className="space-y-4">
                     <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">Target Classification</label>
                        <select 
                           value={newUser.role}
                           onChange={e => setNewUser({...newUser, role: e.target.value})}
                           className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 appearance-none pointer-events-none opacity-80"
                        >
                           <option value="student">Student Account (Only)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">Entity Name</label>
                        <input required type="text" placeholder="John Doe" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500" />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-2">Auth Endpoint (Email)</label>
                        <input required type="email" placeholder="john@tracked.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500" />
                     </div>
                     <p className="text-xs text-slate-500 font-medium pb-2 border-b border-slate-800">Registration automatically hashes a default 'password' key internally.</p>
                     <button disabled={formLoad} type="submit" className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-bold text-white shadow-md transition-all">
                        {formLoad ? "Mounting Structure..." : "Confirm DB Creation"}
                     </button>
                  </form>
              </div>
           </div>
        )}

        <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-fuchsia-400"/> Operational Accounts Graph</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-sm border-b border-slate-800">
                  <th className="pb-3 font-semibold pl-2">Security ID Trace</th>
                  <th className="pb-3 font-semibold">Entity Map</th>
                  <th className="pb-3 font-semibold">Native Email</th>
                  <th className="pb-3 font-semibold">Classification Tier</th>
                  <th className="pb-3 font-semibold text-right pr-2">Database Wipe</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {loading ? (
                    <tr><td colSpan="5" className="py-8 text-center text-slate-500">Querying live User Schemas from MongoDB Cluster...</td></tr>
                ) : users.length === 0 ? (
                    <tr><td colSpan="5" className="py-8 text-center text-slate-500">No external accounts detected in structural mapping.</td></tr>
                ) : users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 pl-2 text-slate-500 font-mono text-xs">{u._id}</td>
                    <td className="py-4 text-white font-bold">{u.name}</td>
                    <td className="py-4 text-slate-300">{u.email}</td>
                    <td className="py-4">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'mentor' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                       <button onClick={() => handleDelete(u._id)} className="p-2.5 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white rounded-xl transition-all shadow-md group">
                          <Trash2 className="w-4 h-4" />
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
