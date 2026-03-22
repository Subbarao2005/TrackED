import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { CheckCircle2, Circle, ChevronRight, Send, Trophy, Brain, Sparkles, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function StudentExam() {
  const [examData, setExamData] = useState(null);      // { exam, alreadySubmitted, submission }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState('mcq'); // 'mcq' | 'short' | 'result'

  // Answers state
  const [mcqAnswers, setMcqAnswers] = useState([]);
  const [shortAnswers, setShortAnswers] = useState([]);

  const token = () => localStorage.getItem('token');

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/exam/student/active', {
          headers: { Authorization: `Bearer ${token()}` }
        });
        setExamData(res.data);
        if (res.data.exam) {
          setMcqAnswers(new Array(res.data.exam.mcqs.length).fill(null));
          setShortAnswers(new Array(res.data.exam.shortAnswers.length).fill(''));
        }
        if (res.data.alreadySubmitted) setCurrentSection('result');
      } catch (err) {
        toast.error('Failed to load exam data.');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, []);

  const handleSubmit = async () => {
    const unansweredMcq = mcqAnswers.filter(a => a === null).length;
    if (unansweredMcq > 0) {
      toast.error(`Please answer all MCQ questions (${unansweredMcq} remaining)`);
      return;
    }
    const unansweredShort = shortAnswers.filter(a => !a.trim()).length;
    if (unansweredShort > 0) {
      toast.error(`Please answer all short questions (${unansweredShort} remaining)`);
      return;
    }

    setSubmitting(true);
    toast.loading('AI is evaluating your answers...', { id: 'submit' });
    try {
      const res = await axios.post(`http://localhost:5000/api/exam/${examData.exam._id}/submit`, {
        mcqAnswers, shortAnswers
      }, { headers: { Authorization: `Bearer ${token()}` } });

      toast.success('Submitted! AI grading complete.', { id: 'submit' });
      setExamData(prev => ({ ...prev, alreadySubmitted: true, submission: res.data.submission }));
      setCurrentSection('result');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.', { id: 'submit' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060913] text-slate-100 flex">
        <Sidebar role="student" />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <p className="text-slate-500 animate-pulse">Loading exam portal...</p>
        </div>
      </div>
    );
  }

  // ── No Active Exam ────────────────────────────────────────
  if (!examData?.exam) {
    return (
      <div className="min-h-screen bg-[#060913] text-slate-100 flex">
        <Sidebar role="student" />
        <div className="flex-1 ml-64 flex flex-col items-center justify-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <Brain className="w-12 h-12 text-slate-600" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">No Active Exam</h2>
            <p className="text-slate-400 mt-2">Your teacher hasn't published an exam yet. Check back soon!</p>
          </div>
        </div>
      </div>
    );
  }

  const { exam, submission } = examData;

  // ── Results View ──────────────────────────────────────────
  if (currentSection === 'result' && submission) {
    const pct = Math.round((submission.totalScore / submission.maxScore) * 100);
    const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F';
    const gradeColor = { A: 'emerald', B: 'cyan', C: 'amber', D: 'orange', F: 'rose' }[grade];

    return (
      <div className="min-h-screen bg-[#060913] text-slate-100 flex">
        <Sidebar role="student" />
        <div className="flex-1 ml-64 p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Exam Results</h1>

          {/* Score Card */}
          <div className="bg-gradient-to-br from-[#0A0F1C] to-[#0d1428] rounded-3xl border border-indigo-500/20 shadow-2xl shadow-indigo-500/5 p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-40 h-40 shrink-0">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle cx="80" cy="80" r="65" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-800" />
                <circle cx="80" cy="80" r="65" stroke="currentColor" strokeWidth="10" fill="transparent"
                  strokeDasharray={2 * Math.PI * 65}
                  strokeDashoffset={2 * Math.PI * 65 * (1 - pct / 100)}
                  className={`text-${gradeColor}-500 transition-all duration-1000`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-white">{pct}%</span>
                <span className={`text-lg font-bold text-${gradeColor}-400`}>{grade}</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">{exam.title}</h2>
              <div className="flex gap-6 justify-center md:justify-start mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{submission.mcqScore}<span className="text-slate-500 text-base">/10</span></p>
                  <p className="text-xs text-slate-400 font-semibold mt-1">MCQ Score</p>
                </div>
                <div className="w-px bg-slate-800"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{submission.shortAnswerScore}<span className="text-slate-500 text-base">/10</span></p>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Short Answer</p>
                </div>
                <div className="w-px bg-slate-800"></div>
                <div className="text-center">
                  <p className={`text-2xl font-bold text-${gradeColor}-400`}>{submission.totalScore}<span className="text-slate-500 text-base">/20</span></p>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Total</p>
                </div>
              </div>
              {submission.aiSummary && (
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 text-slate-300 text-sm font-medium flex gap-3">
                  <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                  <p>{submission.aiSummary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Short Answer AI Feedback */}
          <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-violet-400"/>AI Short Answer Feedback</h3>
            <div className="space-y-4">
              {exam.shortAnswers.map((q, i) => (
                <div key={i} className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <p className="text-slate-300 font-semibold text-sm mb-2">Q{i + 1}. {q.question}</p>
                  <p className="text-slate-400 text-sm mb-2 italic">Your answer: {submission.shortAnswers?.[i] || '(empty)'}</p>
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t border-slate-800">
                    <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <p className="text-violet-300 text-sm font-medium">{submission.aiFeedback?.[i] || 'No feedback.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam Taking UI ────────────────────────────────────────
  const progress = currentSection === 'mcq'
    ? Math.round((mcqAnswers.filter(a => a !== null).length / exam.mcqs.length) * 50)
    : 50 + Math.round((shortAnswers.filter(a => a.trim()).length / exam.shortAnswers.length) * 50);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="student" />

      <div className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{exam.title}</h1>
          <p className="text-slate-400 text-sm mt-1">Topics: {exam.weekTopics.join(', ')}</p>

          {/* Progress Bar */}
          <div className="mt-4 bg-slate-900 rounded-full h-2 w-full max-w-xl">
            <div className="bg-gradient-to-r from-violet-500 to-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">{progress}% complete</p>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-3 mb-8">
          <button onClick={() => setCurrentSection('mcq')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${currentSection === 'mcq' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
            MCQ (10 Questions)
          </button>
          <button onClick={() => setCurrentSection('short')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${currentSection === 'short' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
            Short Answer (10 Questions)
          </button>
        </div>

        {/* MCQ Section */}
        {currentSection === 'mcq' && (
          <div className="space-y-6">
            {exam.mcqs.map((q, i) => (
              <div key={i} className={`bg-[#0A0F1C] rounded-3xl border p-6 transition-all ${mcqAnswers[i] !== null ? 'border-indigo-500/30' : 'border-slate-800/80'}`}>
                <p className="font-bold text-white mb-4 text-base">Q{i + 1}. {q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, j) => (
                    <button
                      key={j}
                      onClick={() => {
                        const updated = [...mcqAnswers];
                        updated[i] = j;
                        setMcqAnswers(updated);
                      }}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl text-left font-medium text-sm transition-all border ${mcqAnswers[i] === j ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600'}`}
                    >
                      <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${mcqAnswers[i] === j ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-600 text-slate-500'}`}>
                        {String.fromCharCode(65 + j)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setCurrentSection('short')} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-bold transition-all shadow-lg shadow-indigo-500/20">
              Proceed to Short Answers <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Short Answer Section */}
        {currentSection === 'short' && (
          <div className="space-y-6">
            {exam.shortAnswers.map((q, i) => (
              <div key={i} className={`bg-[#0A0F1C] rounded-3xl border p-6 transition-all ${shortAnswers[i].trim() ? 'border-violet-500/30' : 'border-slate-800/80'}`}>
                <p className="font-bold text-white mb-4 text-base">Q{i + 1}. {q.question}</p>
                <textarea
                  value={shortAnswers[i]}
                  onChange={e => {
                    const updated = [...shortAnswers];
                    updated[i] = e.target.value;
                    setShortAnswers(updated);
                  }}
                  rows={4}
                  placeholder="Write your answer here..."
                  className="w-full bg-slate-900/70 border border-slate-700/50 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none transition-all text-sm font-medium"
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-2xl text-white font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60"
            >
              {submitting ? <><Sparkles className="w-5 h-5 animate-pulse"/>AI is grading...</> : <><Send className="w-5 h-5"/>Submit & Get AI Grade</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
