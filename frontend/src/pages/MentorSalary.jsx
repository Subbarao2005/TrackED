import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Building, CheckCircle2, Clock, Landmark } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MentorSalary() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/finance/mentor/salaries', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSalaries(res.data);
      } catch (err) { toast.error('Failed to load salary history'); }
      finally { setLoading(false); }
    };
    fetchSalaries();
  }, []);

  const pendingSalaries = salaries.filter(s => s.status === 'pending');
  const paidSalaries = salaries.filter(s => s.status === 'paid');
  const totalEarned = paidSalaries.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="mentor" />

      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Salary & Payouts</h1>
            <p className="text-slate-400 text-sm mt-1">Track your earnings and pending invoice payouts.</p>
          </div>
        </header>

        {/* Status Banner */}
        <div className="mb-12 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 flex items-center gap-4 shadow-lg shadow-indigo-500/5">
           <div className="p-4 rounded-full bg-indigo-500/10">
              <Building className="w-8 h-8 text-indigo-400" />
           </div>
           <div>
              <p className="text-sm font-bold text-slate-400 lg:tracking-wider">TOTAL LIFETIME EARNINGS</p>
              <p className="text-4xl font-extrabold text-indigo-400 mt-1">₹{totalEarned}</p>
           </div>
        </div>

        {/* Pending Invoices */}
        <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
               <span className="bg-amber-500/20 text-amber-400 p-2 rounded-xl"><Clock className="w-5 h-5"/></span> Processing Payrolls
            </h2>
            <div className="bg-[#0A0F1C] border border-slate-800/80 rounded-3xl p-6 shadow-lg">
               <div className="overflow-x-auto">
                 {loading ? (
                    <p className="text-center py-6 font-bold text-slate-500">Connecting to payroll...</p>
                 ) : pendingSalaries.length === 0 ? (
                    <p className="text-center py-6 font-bold text-slate-500">No pending payouts at this time.</p>
                 ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b border-slate-800 text-slate-400 text-sm">
                           <th className="py-4 px-4 font-semibold uppercase tracking-wider">Description</th>
                           <th className="py-4 px-4 font-semibold uppercase tracking-wider">Amount Expected</th>
                           <th className="py-4 px-4 font-semibold uppercase tracking-wider">Target Date</th>
                           <th className="py-4 px-4 font-semibold uppercase tracking-wider">Status</th>
                         </tr>
                      </thead>
                      <tbody>
                         {pendingSalaries.map((salary) => (
                             <tr key={salary._id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                                <td className="py-4 px-4 font-bold text-white">{salary.description}</td>
                                <td className="py-4 px-4 font-extrabold text-white">₹{salary.amount}</td>
                                <td className="py-4 px-4 text-slate-400 font-medium">{new Date(salary.payDate).toLocaleDateString()}</td>
                                <td className="py-4 px-4">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Clock className="w-3.5 h-3.5"/> PENDING
                                  </span>
                                </td>
                             </tr>
                           )
                         )}
                      </tbody>
                    </table>
                 )}
               </div>
            </div>
        </div>

        {/* Transaction History */}
        <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
               <span className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl"><Landmark className="w-5 h-5"/></span> Previous Transactions
            </h2>
            <div className="bg-[#0A0F1C] border border-slate-800/80 rounded-3xl p-6 shadow-lg">
               <div className="overflow-x-auto">
                 {loading ? (
                    <p className="text-center py-6 font-bold text-slate-500">Loading ledger...</p>
                 ) : paidSalaries.length === 0 ? (
                    <p className="text-center py-6 font-bold text-slate-500">No past payments recorded yet.</p>
                 ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b border-slate-800 text-slate-400 text-sm">
                           <th className="py-4 px-4 font-semibold uppercase tracking-wider">Reference Description</th>
                           <th className="py-4 px-4 font-semibold uppercase tracking-wider">Amount Settled</th>
                           <th className="py-4 px-4 font-semibold uppercase tracking-wider">Date Recorded</th>
                           <th className="py-4 px-4 font-semibold uppercase tracking-wider">Status</th>
                         </tr>
                      </thead>
                      <tbody>
                         {paidSalaries.map((salary) => (
                             <tr key={salary._id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                                <td className="py-4 px-4 font-bold text-white max-w-[200px] truncate">{salary.description}</td>
                                <td className="py-4 px-4 font-extrabold text-white">₹{salary.amount}</td>
                                <td className="py-4 px-4 text-slate-400 font-medium">{new Date(salary.updatedAt).toLocaleDateString()}</td>
                                <td className="py-4 px-4">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3.5 h-3.5"/> PAID
                                  </span>
                                </td>
                             </tr>
                           )
                         )}
                      </tbody>
                    </table>
                 )}
               </div>
            </div>
        </div>

      </div>
    </div>
  );
}
