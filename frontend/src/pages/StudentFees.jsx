import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { DollarSign, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function StudentFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState({ open: false, feeId: null, type: 'upi' }); // type: upi or cash
  const [receiptRef, setReceiptRef] = useState('');
  const [cashCode, setCashCode] = useState('');

  const fetchFees = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/finance/student/fees', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFees(res.data);
      } catch (err) { toast.error('Failed to load fees'); }
      finally { setLoading(false); }
  };
  
  useEffect(() => { fetchFees(); }, []);

  const handleSubmitReceipt = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/finance/student/fees/${showModal.feeId}/submit`, 
        { receiptRef },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Receipt submitted to Admin for verification!');
      setShowModal({ open: false, feeId: null });
      setReceiptRef('');
      fetchFees();
    } catch (err) {
      toast.error('Failed to submit receipt.');
    }
  };

  const handleSubmitCash = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/finance/student/fees/${showModal.feeId}/verify-cash`, 
        { code: cashCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cash payment physically verified! Invoice settled.');
      setShowModal({ open: false, feeId: null, type: 'upi' });
      setCashCode('');
      fetchFees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid Cash Code!');
    }
  };

  const activeFees = fees.filter(f => f.status !== 'paid');
  const paidFees = fees.filter(f => f.status === 'paid');
  const totalPending = activeFees.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="student" />

      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Fee Details & History</h1>
            <p className="text-slate-400 text-sm mt-1">Review your tuition status and track pending fees assigned by administration.</p>
          </div>
        </header>

        {/* Status Banner */}
        <div className={`mb-10 p-6 rounded-3xl border ${totalPending > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'} flex items-center justify-between`}>
           <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${totalPending > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                 <DollarSign className={`w-8 h-8 ${totalPending > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-400">Total Outstanding Balance</p>
                 <p className={`text-4xl font-extrabold ${totalPending > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>₹{totalPending}</p>
              </div>
           </div>
           {totalPending === 0 && !loading && (
             <span className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 shadow-lg px-6 py-3 rounded-xl">
               <CheckCircle2 className="w-5 h-5"/> Account Cleared
             </span>
           )}
        </div>

        {/* Active Pending Fees */}
        <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
               <span className="bg-rose-500/20 text-rose-400 p-2 rounded-xl"><Clock className="w-5 h-5"/></span> Action Required
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                 <p className="text-slate-500 font-bold">Checking ledger...</p>
              ) : activeFees.length === 0 ? (
                 <p className="text-slate-500 font-bold bg-[#0A0F1C] border border-slate-800 p-6 rounded-3xl w-full col-span-full text-center">No outstanding bills at this time.</p>
              ) : activeFees.map(fee => {
                   const isProcessing = fee.status === 'processing';
                   return (
                     <div key={fee._id} className={`bg-slate-900 border ${isProcessing ? 'border-amber-500/30' : 'border-rose-500/30'} p-6 rounded-3xl shadow-lg relative overflow-hidden group`}>
                        <div className={`absolute top-0 left-0 w-full h-1 ${isProcessing ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-bold text-white text-lg">{fee.description}</p>
                            <p className={`text-sm font-medium mt-1 ${isProcessing ? 'text-amber-400' : 'text-rose-400'}`}>Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-wider font-bold ${isProcessing ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            VERIFYING
                          </span>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-center gap-2">
                          <p className="text-3xl font-extrabold text-white shrink-0">₹{fee.amount}</p>
                          {!isProcessing ? (
                             <div className="flex gap-2">
                               <button onClick={() => setShowModal({ open: true, feeId: fee._id, type: 'cash' })} className="text-[10px] uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl border border-slate-700 transition-colors">
                                 Cash Ref
                               </button>
                               <button onClick={() => setShowModal({ open: true, feeId: fee._id, type: 'upi' })} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-colors shrink-0">
                                 Submit Online
                               </button>
                             </div>
                          ) : (
                             <p className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-center max-w-[120px] truncate" title={fee.receiptRef}>
                               UPI: {fee.receiptRef}
                             </p>
                          )}
                        </div>
                     </div>
                   );
                 }
              )}
            </div>
        </div>

        {/* Previous Paid Transactions */}
        <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
               <span className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl"><CheckCircle2 className="w-5 h-5"/></span> Previous Transactions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                 <p className="text-slate-500 font-bold">Checking ledger...</p>
              ) : paidFees.length === 0 ? (
                 <p className="text-slate-500 font-bold bg-[#0A0F1C] border border-slate-800 p-6 rounded-3xl w-full col-span-full text-center">No past transactions found.</p>
              ) : paidFees.map(fee => (
                   <div key={fee._id} className="bg-[#0A0F1C] border border-slate-800 p-6 rounded-3xl shadow-md relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50"></div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-white text-lg">{fee.description}</p>
                          <p className="text-sm text-slate-500 font-medium mt-1">Recorded: {new Date(fee.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-800/80 flex justify-between items-center">
                        <p className="text-2xl font-extrabold text-white">₹{fee.amount}</p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400">
                          PAID
                        </span>
                      </div>
                   </div>
                 )
              )}
            </div>
        </div>
      </div>

      {/* Submit Modals */}
      {showModal.open && showModal.type === 'upi' && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#0A0F1C] border border-slate-700 w-[450px] p-8 rounded-3xl shadow-2xl relative">
              <h2 className="text-2xl font-bold text-white mb-2">Submit Payment Receipt</h2>
              <p className="text-slate-400 text-sm mb-6">Enter your UPI Transaction ID or Bank Reference Number. An Admin will verify the bill.</p>
              
              <form onSubmit={handleSubmitReceipt} className="space-y-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">UPI / Transaction ID</label>
                    <input type="text" required value={receiptRef} onChange={e => setReceiptRef(e.target.value)} placeholder="e.g. 32091484729" className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:border-indigo-500/50" />
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowModal({ open: false, feeId: null })} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700">Cancel</button>
                    <button type="submit" className="flex-1 py-3 text-white rounded-xl font-bold transition-all bg-indigo-600 hover:bg-indigo-500">Submit Verification</button>
                 </div>
              </form>
            </div>
         </div>
      )}

      {showModal.open && showModal.type === 'cash' && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#0A0F1C] border border-cyan-500/50 w-[450px] p-8 rounded-3xl shadow-2xl shadow-cyan-500/10 relative">
              <h2 className="text-2xl font-bold text-white mb-2">Instant Cash Verification</h2>
              <p className="text-slate-400 text-sm mb-6">Type the 6-character unique code the Teacher handed you physically to automatically settle this invoice.</p>
              
              <form onSubmit={handleSubmitCash} className="space-y-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Secret Cash Code</label>
                    <input type="text" maxLength={6} required value={cashCode} onChange={e => setCashCode(e.target.value.toUpperCase())} placeholder="e.g. X9F3B1" className="w-full px-4 py-3 bg-slate-900 border border-cyan-500/30 rounded-2xl text-cyan-400 uppercase tracking-widest font-extrabold focus:outline-none focus:border-cyan-400 text-center text-xl" />
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowModal({ open: false, feeId: null })} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700">Cancel</button>
                    <button type="submit" className="flex-1 py-3 text-white rounded-xl font-bold transition-all bg-cyan-600 hover:bg-cyan-500 border border-cyan-400">Unlock Verification</button>
                 </div>
              </form>
            </div>
         </div>
      )}
    </div>
  );
}
