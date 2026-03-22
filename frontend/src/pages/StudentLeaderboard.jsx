import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { Trophy, Medal, Crown, TrendingUp, CheckCircle2, Flame } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RANK_COLORS = [
  { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-400', icon: Crown },
  { bg: 'bg-slate-400/15', border: 'border-slate-400/40', text: 'text-slate-300', icon: Medal },
  { bg: 'bg-amber-700/15', border: 'border-amber-700/40', text: 'text-amber-600', icon: Medal },
];

export default function StudentLeaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/leaderboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBoard(res.data);
      } catch {
        toast.error('Could not load leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const myRank = board.find(s => s.name === currentUser?.name);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="student" />

      <div className="flex-1 ml-64 p-8">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-yellow-500/30 to-amber-500/10 p-2.5 rounded-2xl border border-yellow-500/30">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Class Leaderboard</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1 ml-1">
            Ranked by Attendance (70%) + Task Completion (30%) — updated in real-time.
          </p>
        </header>

        {/* My rank banner */}
        {myRank && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-indigo-600/20 to-cyan-600/20 border border-cyan-500/30 rounded-2xl p-4 flex items-center gap-4"
          >
            <Flame className="w-6 h-6 text-cyan-400" />
            <div>
              <p className="text-white font-bold">Your Rank: <span className="text-cyan-400">#{myRank.rank}</span></p>
              <p className="text-slate-400 text-xs">Score: {myRank.score} pts · Attendance: {myRank.attendancePct}% · Task Completion: {myRank.taskPct}%</p>
            </div>
          </motion.div>
        )}

        {/* Podium: Top 3 */}
        {!loading && board.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[board[1], board[0], board[2]].map((s, i) => {
              if (!s) return <div key={i} />;
              const podiumOrder = [1, 0, 2];
              const rankIdx = podiumOrder[i];
              const rc = RANK_COLORS[rankIdx];
              const Icon = rc.icon;
              const heights = ['h-28', 'h-36', 'h-24'];
              return (
                <motion.div
                  key={s.userId}
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`${rc.bg} border ${rc.border} rounded-3xl p-5 flex flex-col items-center justify-end text-center ${heights[i]}`}
                >
                  <Icon className={`w-6 h-6 ${rc.text} mb-1`} />
                  <p className="font-extrabold text-white text-sm leading-tight">{s.name}</p>
                  <p className={`text-2xl font-black ${rc.text}`}>{s.score}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">pts</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full Rankings */}
        <div className="bg-[#0A0F1C] rounded-3xl border border-slate-800/80 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white">Full Rankings</h2>
            <span className="text-xs text-slate-500 font-medium">{board.length} students ranked</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="shimmer w-8 h-8 rounded-full" />
                  <div className="shimmer h-4 flex-1 rounded" />
                  <div className="shimmer w-16 h-4 rounded" />
                </div>
              ))}
            </div>
          ) : board.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No data yet — attendance needs to be recorded first!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {board.map((s, i) => {
                const isMe = s.name === currentUser?.name;
                const rc = i < 3 ? RANK_COLORS[i] : null;
                return (
                  <motion.div
                    key={s.userId}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-900/40 transition-colors ${isMe ? 'bg-cyan-500/5 border-l-2 border-cyan-500' : ''}`}
                  >
                    {/* Rank badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      i === 1 ? 'bg-slate-400/20 text-slate-300' :
                      i === 2 ? 'bg-amber-700/20 text-amber-600' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {s.rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {s.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${isMe ? 'text-cyan-400' : 'text-slate-200'}`}>
                        {s.name} {isMe && <span className="text-[10px] text-cyan-500 ml-1">(You)</span>}
                      </p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> {s.attendancePct}% Attendance
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {s.taskPct}% Tasks
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className={`text-lg font-black ${rc ? rc.text : 'text-slate-300'}`}>{s.score}</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">points</p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-20 hidden md:block">
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${s.score}%` }}
                          transition={{ delay: i * 0.04 + 0.3, duration: 0.6 }}
                          className={`h-full rounded-full ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-600' : 'bg-cyan-600'}`}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
