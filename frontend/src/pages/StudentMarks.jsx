import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Bell, BookOpen, Award, FileText, Sparkles, Brain } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function StudentMarks() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/exam/student/submissions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubmissions(res.data);
      } catch (err) {
        toast.error('Failed to load marks.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="student" />

      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Marks Record</h1>
            <p className="text-slate-400 text-sm mt-1">Previous conducted exams and marks given by your teachers.</p>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 rounded-full border border-slate-800 bg-[#0A0F1C] text-slate-400 hover:text-indigo-400 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white flex items-center gap-2"><Award className="w-5 h-5 text-indigo-400"/> Examination Results</h2>
          </div>
          
          {loading ? (
            <p className="text-slate-500 text-center py-20 font-bold">Querying AI Database...</p>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Brain className="w-9 h-9 text-slate-600" />
              </div>
              <p className="text-slate-500 font-semibold">No AI Exams have been evaluated yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {submissions.map((sub, index) => {
                const chronologicalWeek = submissions.length - index; // Because they are sorted newest-first (index 0 is highest week number)
                
                const pct = Math.round((sub.totalScore / sub.maxScore) * 100);
                const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F';
                const gradeColor = { A: 'emerald', B: 'cyan', C: 'amber', D: 'orange', F: 'rose' }[grade];

                return (
                  <div key={sub._id} className="bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/30 transition-colors shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all pointer-events-none"></div>
                    
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 shadow-sm shrink-0">
                          <BookOpen className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                             <h3 className="font-bold text-white text-xl">Week {chronologicalWeek} Assessment</h3>
                             <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">{sub.exam?.title || 'System Evaluation'}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium mt-1">
                            {new Date(sub.createdAt).toLocaleDateString()} • {sub.exam?.weekTopics?.join(', ') || 'No topics'}
                          </p>
                          
                          {/* AI Summary Banner */}
                          {sub.aiSummary && (
                            <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-300 text-sm font-medium flex gap-3 max-w-3xl leading-relaxed">
                              <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                              <p className="italic">{sub.aiSummary}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score Metrics */}
                      <div className="flex gap-6 items-center lg:items-end justify-center shrink-0">
                         <div className="text-center">
                           <p className="text-xl font-bold text-slate-300">{sub.mcqScore}<span className="text-xs text-slate-500">/10</span></p>
                           <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">MCQ</p>
                         </div>
                         <div className="w-px h-10 bg-slate-800"></div>
                         <div className="text-center">
                           <p className="text-xl font-bold text-slate-300">{sub.shortAnswerScore}<span className="text-xs text-slate-500">/10</span></p>
                           <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Short</p>
                         </div>
                         <div className="w-px h-10 bg-slate-800"></div>
                         <div className="text-center min-w-[100px]">
                           <p className={`text-4xl font-extrabold text-${gradeColor}-400`}>{sub.totalScore}<span className="text-base text-slate-500 font-bold">/{sub.maxScore}</span></p>
                           <p className={`text-xs font-bold text-${gradeColor}-500 mt-1 uppercase tracking-widest`}>Grade {grade}</p>
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
