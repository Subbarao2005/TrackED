import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { ArrowRightLeft, Users, ShieldCheck, UserCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function TeacherAssignments() {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMapping = async () => {
     try {
         const token = localStorage.getItem('token');
         const res = await axios.get('http://localhost:5000/api/teacher/students-mapping', {
             headers: { Authorization: `Bearer ${token}` }
         });
         setStudents(res.data.students);
         setMentors(res.data.mentors);
     } catch (err) {
         toast.error("Failed to query live relational collections from MongoDB.");
     } finally {
         setLoading(false);
     }
  };

  useEffect(() => {
      fetchMapping();
  }, []);

  const handleAssignment = async (studentId, mentorId) => {
      try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5000/api/teacher/assign`, { studentId, mentorId }, {
             headers: { Authorization: `Bearer ${token}` }
          });
          toast.success("Mentor assigned specifically to this Student natively.");
          fetchMapping(); // Refresh structurally
      } catch (err) {
          toast.error("Failed to execute cross-collection mapping mutations.");
      }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="teacher" />

      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Mentor Assignments</h1>
            <p className="text-slate-400 text-sm mt-1">Cross-link individual students securely to active Teacher Mentors.</p>
          </div>
        </header>

        <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6 max-w-5xl">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-indigo-400"/> Cross-Mapping Authority Table</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-sm border-b border-slate-800">
                  <th className="pb-3 font-semibold pl-2">Student Profile</th>
                  <th className="pb-3 font-semibold">Active Email</th>
                  <th className="pb-3 font-semibold">Native Mentor Tracking</th>
                  <th className="pb-3 font-semibold pr-2">Re-Assign Node Action</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {loading ? (
                    <tr><td colSpan="4" className="py-8 text-center text-slate-500">Querying live Document Arrays from MongoDB Cluster...</td></tr>
                ) : students.length === 0 ? (
                    <tr><td colSpan="4" className="py-8 text-center text-slate-500">No Student collections found in structural schema.</td></tr>
                ) : students.map((s) => (
                  <tr key={s._id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors h-20">
                    <td className="py-4 pl-2 font-bold text-white">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">{s.user?.name?.charAt(0) || '?'}</div>
                           {s.user?.name || 'Corrupted User Document'}
                        </div>
                    </td>
                    <td className="py-4 text-slate-400">{s.user?.email || 'N/A'}</td>
                    <td className="py-4">
                       {s.mentor ? (
                         <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-max shadow-inner">
                           <ShieldCheck className="w-3.5 h-3.5" /> {s.mentor.user?.name || 'Ghost Mentor'}
                         </span>
                       ) : (
                         <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 w-max shadow-inner">
                           <Users className="w-3.5 h-3.5" /> Unassigned Node
                         </span>
                       )}
                    </td>
                    <td className="py-4 pr-2">
                       <select 
                          onChange={(e) => handleAssignment(s._id, e.target.value)}
                          value={s.mentor?._id || 'unassigned'}
                          className="bg-slate-900 border border-slate-700 hover:border-indigo-500/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm font-medium appearance-none cursor-pointer transition-colors"
                       >
                          <option value="unassigned">- Force Unassign -</option>
                          {mentors.map(m => (
                              <option key={m._id} value={m._id}>{m.user?.name}</option>
                          ))}
                       </select>
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
