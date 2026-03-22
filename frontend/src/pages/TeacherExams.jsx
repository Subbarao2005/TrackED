import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Sparkles, Play, Square, Trash2, Eye, RefreshCw, BookOpen, ChevronDown, ChevronUp, Users } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function TeacherExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedExam, setExpandedExam] = useState(null);
  const [resultsMap, setResultsMap] = useState({});
  const [loadingResults, setLoadingResults] = useState(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [manualTopics, setManualTopics] = useState('');
  const [targetStudent, setTargetStudent] = useState('all');
  const [studentList, setStudentList] = useState([]);

  const token = () => localStorage.getItem('token');

  const fetchExams = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/exam/teacher', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setExams(res.data);
    } catch (err) {
      toast.error('Failed to fetch exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchExams(); 
    
    // Fetch live student mappings to populate the targeting dropdown
    const fetchMapping = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/teacher/students-mapping', {
          headers: { Authorization: `Bearer ${token()}` }
        });
        setStudentList(res.data.students || []);
      } catch (err) { }
    };
    fetchMapping();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setShowGenModal(false);
    toast.loading('AI is analysing the topics and crafting questions...', { id: 'gen' });
    try {
      await axios.post('http://localhost:5000/api/exam/generate', { manualTopics, targetStudent }, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      toast.success('Exam generated successfully! Review and publish.', { id: 'gen' });
      setManualTopics('');
      setTargetStudent('all');
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed.', { id: 'gen' });
    } finally {
      setGenerating(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/exam/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      toast.success(`Exam ${status}!`);
      fetchExams();
    } catch (err) {
      toast.error('Failed to update exam status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam? All submissions will also be erased.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/exam/${id}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      toast.success('Exam deleted.');
      fetchExams();
    } catch (err) {
      toast.error('Failed to delete exam.');
    }
  };

  const loadResults = async (examId) => {
    setLoadingResults(examId);
    try {
      const res = await axios.get(`http://localhost:5000/api/exam/${examId}/results`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setResultsMap(prev => ({ ...prev, [examId]: res.data }));
    } catch (err) {
      toast.error('Failed to load results.');
    } finally {
      setLoadingResults(null);
    }
  };

  const statusColor = { draft: 'amber', published: 'emerald', closed: 'slate' };
  const statusLabel = { draft: 'Draft', published: 'Live', closed: 'Closed' };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="teacher" />

      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Exam Control</h1>
            <p className="text-slate-400 text-sm mt-1">Generate, publish, and review AI-crafted weekly assessments.</p>
          </div>
          <button
            onClick={() => setShowGenModal(true)}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-2xl text-white font-bold transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60"
          >
            {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {generating ? 'Generating...' : 'Generate AI Exam'}
          </button>
        </header>

        {/* Generate Modal */}
        {showGenModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#0A0F1C] border border-slate-700 w-[540px] p-8 rounded-3xl shadow-2xl relative">
              <h2 className="text-2xl font-bold text-white mb-2">Generate AI Exam</h2>
              <p className="text-slate-400 text-sm mb-6">Enter one topic per line. Leave blank to auto-detect from this week's assigned tasks.</p>
              
              <div className="mb-4">
                 <label className="block text-sm font-semibold text-slate-300 mb-2">Target Student (Optional)</label>
                 <select 
                    value={targetStudent}
                    onChange={e => setTargetStudent(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:border-violet-500/50 transition-all text-sm font-medium appearance-none cursor-pointer"
                 >
                    <option value="all">Assign Globally to All Students</option>
                    {studentList.map(s => (
                       <option key={s.user?._id} value={s.user?._id}>{s.user?.name} ({s.user?.email})</option>
                    ))}
                 </select>
              </div>

              <label className="block text-sm font-semibold text-slate-300 mb-2">Topics (one per line)</label>
              <textarea
                value={manualTopics}
                onChange={e => setManualTopics(e.target.value)}
                rows={8}
                placeholder={`E.g.:
Photosynthesis
Newton's Laws of Motion
Algebra - Quadratic Equations
World War 2 Causes`}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none transition-all text-sm font-medium mb-4"
              />
              
              <div className="flex gap-3">
                <button onClick={() => setShowGenModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700">
                  Cancel
                </button>
                <button onClick={handleGenerate} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Generate with AI
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-center py-20">Loading exams...</p>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <BookOpen className="w-9 h-9 text-slate-600" />
            </div>
            <p className="text-slate-500 font-semibold">No exams yet. Click "Generate AI Exam" to start.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {exams.map(exam => (
              <div key={exam._id} className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg overflow-hidden">
                {/* Exam Header */}
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-lg leading-tight">{exam.title}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {exam.weekTopics.slice(0, 3).map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-medium">{t}</span>
                        ))}
                        {exam.weekTopics.length > 3 && <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full">+{exam.weekTopics.length - 3} more</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${statusColor[exam.status]}-500/10 text-${statusColor[exam.status]}-400 border border-${statusColor[exam.status]}-500/20`}>
                      {statusLabel[exam.status]}
                    </span>

                    {/* Status Controls */}
                    {exam.status === 'draft' && (
                      <button onClick={() => handleStatus(exam._id, 'published')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all">
                        <Play className="w-4 h-4" /> Publish
                      </button>
                    )}
                    {exam.status === 'published' && (
                      <button onClick={() => handleStatus(exam._id, 'closed')} className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-all">
                        <Square className="w-4 h-4" /> Close Exam
                      </button>
                    )}
                    {exam.status === 'closed' && (
                      <button onClick={() => { loadResults(exam._id); setExpandedExam(expandedExam === exam._id ? null : exam._id); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all">
                        <Users className="w-4 h-4" /> {loadingResults === exam._id ? 'Loading…' : 'View Results'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(exam._id)} className="p-2 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedExam(expandedExam === exam._id ? null : exam._id)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all">
                      {expandedExam === exam._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Exam Preview (Questions) */}
                {expandedExam === exam._id && (
                  <div className="border-t border-slate-800 p-6 space-y-6">
                    {/* Results Table (for closed exams) */}
                    {resultsMap[exam._id] && (
                      <div>
                        <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400"/>Student Results</h3>
                        {resultsMap[exam._id].length === 0 ? (
                          <p className="text-slate-500 text-sm">No submissions yet.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-800">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-slate-500 border-b border-slate-800 text-left">
                                  <th className="px-4 py-3 font-semibold">Student</th>
                                  <th className="px-4 py-3 font-semibold">MCQ</th>
                                  <th className="px-4 py-3 font-semibold">Short Ans</th>
                                  <th className="px-4 py-3 font-semibold">Total</th>
                                  <th className="px-4 py-3 font-semibold">Grade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {resultsMap[exam._id].map(sub => {
                                  const pct = Math.round((sub.totalScore / sub.maxScore) * 100);
                                  const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F';
                                  const gradeColor = { A: 'emerald', B: 'cyan', C: 'amber', D: 'orange', F: 'rose' }[grade];
                                  return (
                                    <tr key={sub._id} className="hover:bg-slate-900/50 transition-colors">
                                      <td className="px-4 py-3 font-bold text-white">{sub.student?.name}</td>
                                      <td className="px-4 py-3 text-slate-300">{sub.mcqScore}/10</td>
                                      <td className="px-4 py-3 text-slate-300">{sub.shortAnswerScore}/10</td>
                                      <td className="px-4 py-3 font-bold text-white">{sub.totalScore}/{sub.maxScore}</td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-${gradeColor}-500/10 text-${gradeColor}-400`}>{grade} ({pct}%)</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* MCQs Preview */}
                    <div>
                      <h3 className="font-bold text-white mb-3">MCQ Questions ({exam.mcqs.length})</h3>
                      <div className="space-y-3">
                        {exam.mcqs.map((q, i) => (
                          <div key={i} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                            <p className="text-slate-200 font-medium text-sm mb-2">Q{i + 1}. {q.question}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, j) => (
                                <span key={j} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${j === q.correctOption ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                                  {String.fromCharCode(65 + j)}. {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Short Answer Preview */}
                    <div>
                      <h3 className="font-bold text-white mb-3">Short Answer Questions ({exam.shortAnswers.length})</h3>
                      <div className="space-y-3">
                        {exam.shortAnswers.map((q, i) => (
                          <div key={i} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                            <p className="text-slate-200 font-medium text-sm">Q{i + 1}. {q.question}</p>
                            <p className="text-xs text-slate-500 mt-2 italic">Model: {q.modelAnswer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
