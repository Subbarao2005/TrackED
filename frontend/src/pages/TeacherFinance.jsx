import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { CheckCircle2, Clock, Users, Building, Plus, Landmark } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function TeacherFinance() {
  const [activeTab, setActiveTab] = useState('fees'); // 'fees' or 'salaries'
  const [loading, setLoading] = useState(true);
  
  // Data
  const [fees, setFees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  
  // Mappings
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ user: '', amount: '', description: '', date: '' });

  const token = () => localStorage.getItem('token');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'fees') {
        const res = await axios.get('http://localhost:5000/api/finance/fees', { headers: { Authorization: `Bearer ${token()}` } });
        setFees(res.data);
      } else {
        const res = await axios.get('http://localhost:5000/api/finance/salaries', { headers: { Authorization: `Bearer ${token()}` } });
        setSalaries(res.data);
      }
    } catch (err) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/teacher/students-mapping', { headers: { Authorization: `Bearer ${token()}` } });
        setStudents(res.data.students);
        setMentors(res.data.mentors);
      } catch (err) { console.error('Failed to load users for mapping'); }
    };
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'fees') {
        await axios.post('http://localhost:5000/api/finance/fees', {
           student: formData.user, amount: Number(formData.amount), description: formData.description, dueDate: formData.date
        }, { headers: { Authorization: `Bearer ${token()}` } });
        toast.success('Fee assigned successfully!');
      } else {
        await axios.post('http://localhost:5000/api/finance/salaries', {
           mentor: formData.user, amount: Number(formData.amount), description: formData.description, payDate: formData.date
        }, { headers: { Authorization: `Bearer ${token()}` } });
        toast.success('Salary assigned successfully!');
      }
      setShowModal(false);
      setFormData({ user: '', amount: '', description: '', date: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to assign the record');
    }
  };

  const handlePay = async (id) => {
    try {
      const endpoint = activeTab === 'fees' ? `/api/finance/fees/${id}/pay` : `/api/finance/salaries/${id}/pay`;
      await axios.put(`http://localhost:5000${endpoint}`, {}, { headers: { Authorization: `Bearer ${token()}` } });
      toast.success(activeTab === 'fees' ? 'Fee marked as paid by student!' : 'Salary marked as paid out!');
      fetchData();
    } catch (err) { toast.error('Failed to update status'); }
  };

  const activeRecords = (activeTab === 'fees' ? fees : salaries).filter(r => r.status !== 'paid');
  const pastRecords = (activeTab === 'fees' ? fees : salaries).filter(r => r.status === 'paid');

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="teacher" />

      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Financial Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage student fee payments and mentor salary distributions.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5"/> Assign {activeTab === 'fees' ? 'Fee' : 'Salary'}
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('fees')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'fees' ? 'bg-indigo-600 shadow-lg text-white border-transparent' : 'bg-[#0A0F1C] border border-slate-800 text-slate-400 hover:text-white'}`}
          >
            <Users className="w-5 h-5" /> Student Fees
          </button>
          <button 
            onClick={() => setActiveTab('salaries')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'salaries' ? 'bg-emerald-600 shadow-lg text-white border-transparent' : 'bg-[#0A0F1C] border border-slate-800 text-slate-400 hover:text-white'}`}
          >
            <Building className="w-5 h-5" /> Mentor Salaries
          </button>
        </div>

        {/* Pending Ledger */}
        <div className="bg-[#0A0F1C] border border-slate-800/80 rounded-3xl overflow-hidden shadow-lg p-6 mb-12">
          <div className="flex items-center gap-3 mb-6">
             <span className={`p-2 rounded-xl ${activeTab === 'fees' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}><Clock className="w-5 h-5"/></span>
             <h2 className="text-xl font-bold text-white">Pending {activeTab === 'fees' ? 'Bills' : 'Payouts'}</h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
               <p className="text-slate-500 text-center py-6 font-bold">Querying ledger...</p>
            ) : activeRecords.length === 0 ? (
               <p className="text-slate-500 text-center py-6 font-medium">No pending records found.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm">
                    <th className="py-4 px-4 font-semibold uppercase tracking-wider">{activeTab === 'fees' ? 'Student' : 'Mentor'}</th>
                    <th className="py-4 px-4 font-semibold uppercase tracking-wider">Description</th>
                    <th className="py-4 px-4 font-semibold uppercase tracking-wider">Amount</th>
                    <th className="py-4 px-4 font-semibold uppercase tracking-wider">{activeTab === 'fees' ? 'Due Date' : 'Pay Date'}</th>
                    <th className="py-4 px-4 font-semibold uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRecords.map((record) => {
                    const user = activeTab === 'fees' ? record.student : record.mentor;
                    const dateObj = new Date(activeTab === 'fees' ? record.dueDate : record.payDate);
                    const isProcessing = record.status === 'processing';

                    return (
                      <tr key={record._id} className={`border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors ${isProcessing ? 'bg-amber-500/5' : ''}`}>
                        <td className="py-4 px-4 font-bold text-white">
                           {user?.name || 'Unknown User'}
                           {isProcessing && <span className="ml-2 bg-amber-500/20 text-amber-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-amber-500/30">Verification Pending</span>}
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium max-w-[200px] truncate">
                           {record.description}
                           {activeTab === 'fees' && record.cashCode && <div className="mt-1 text-xs text-slate-500 font-bold tracking-widest uppercase">Cash Code: <span className="text-cyan-400 select-all">{record.cashCode}</span></div>}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-white">
                           {activeTab === 'fees' ? `₹${record.amount}` : `₹${record.amount}`}
                           {isProcessing && record.receiptRef && <p className="text-xs text-amber-500 font-medium mt-1">UPI: {record.receiptRef}</p>}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-400 font-medium">{dateObj.toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => handlePay(record._id)}
                              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${isProcessing ? 'bg-amber-600 hover:bg-amber-500 text-white' : (activeTab === 'fees' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white')}`}
                            >
                              {isProcessing ? 'Verify & Approve' : 'Settle as Paid'}
                            </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* History Ledger */}
        <div className="bg-[#0A0F1C] border border-slate-800/80 rounded-3xl overflow-hidden shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
             <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><CheckCircle2 className="w-5 h-5"/></span>
             <h2 className="text-xl font-bold text-white">Previous Transactions</h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
               <p className="text-slate-500 text-center py-6 font-bold">Querying ledger...</p>
            ) : pastRecords.length === 0 ? (
               <p className="text-slate-500 text-center py-6 font-medium">No previous transactions found.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm">
                    <th className="py-4 px-4 font-semibold uppercase tracking-wider">{activeTab === 'fees' ? 'Student' : 'Mentor'}</th>
                    <th className="py-4 px-4 font-semibold uppercase tracking-wider">Description</th>
                    <th className="py-4 px-4 font-semibold uppercase tracking-wider">Amount Settled</th>
                    <th className="py-4 px-4 font-semibold uppercase tracking-wider">Recorded Date</th>
                    <th className="py-4 px-4 font-semibold uppercase tracking-wider">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {pastRecords.map((record) => {
                    const user = activeTab === 'fees' ? record.student : record.mentor;
                    const dateObj = new Date(record.updatedAt);

                    return (
                      <tr key={record._id} className="border-b border-slate-800/30 hover:bg-slate-900/20 transition-colors opacity-80">
                        <td className="py-4 px-4 font-medium text-white">{user?.name || 'Unknown User'}</td>
                        <td className="py-4 px-4 text-slate-300 font-medium max-w-[200px] truncate">{record.description}</td>
                        <td className="py-4 px-4 font-bold text-white">₹{record.amount}</td>
                        <td className="py-4 px-4 text-sm text-slate-400 font-medium">{dateObj.toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                           <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 rounded-full text-[10px] tracking-wider uppercase">
                             <Landmark className="w-3 h-3"/> Closed
                           </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Creation Modal */}
      {showModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#0A0F1C] border border-slate-700 w-[450px] p-8 rounded-3xl shadow-2xl relative">
              <h2 className="text-2xl font-bold text-white mb-6">Assign {activeTab === 'fees' ? 'Student Fee' : 'Mentor Salary'}</h2>
              
              <form onSubmit={handleCreate} className="space-y-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Target {activeTab === 'fees' ? 'Student' : 'Mentor'}</label>
                    <select required value={formData.user} onChange={e => setFormData({...formData, user: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:border-indigo-500/50">
                       <option value="">Select User...</option>
                       {(activeTab === 'fees' ? students : mentors).map(u => (
                          <option key={u.user?._id} value={u.user?._id}>{u.user?.name} ({u.user?.email})</option>
                       ))}
                    </select>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Amount (in ₹)</label>
                    <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="e.g. 500" className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:border-indigo-500/50" />
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                    <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g. September Tuition" className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:border-indigo-500/50" />
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">{activeTab === 'fees' ? 'Due Date' : 'Pay Date'}</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:border-indigo-500/50" />
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700">Cancel</button>
                    <button type="submit" className={`flex-1 py-3 text-white rounded-xl font-bold transition-all ${activeTab === 'fees' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>Assign Payment</button>
                 </div>
              </form>
            </div>
         </div>
      )}
    </div>
  );
}
