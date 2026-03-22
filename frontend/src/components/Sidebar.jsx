import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, BarChart3, CreditCard, Users,
  ShieldCheck, LogOut, Sparkles, BookOpen, ArrowRightLeft, Menu, X, Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Sidebar({ role }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(u);
    } catch { setUser(null); }
  }, []);

  const getNavLinks = () => {
    if (role === 'student') {
      return [
        { name: 'Performance', icon: LayoutDashboard, path: '/student' },
        { name: 'Daily Tasks', icon: CheckSquare, path: '/student/tasks' },
        { name: 'Leaderboard', icon: Trophy, path: '/student/leaderboard' },
        { name: 'Weekly Exam', icon: BookOpen, path: '/student/exam' },
        { name: 'Marks Record', icon: BarChart3, path: '/student/marks' },
        { name: 'Fee Payments', icon: CreditCard, path: '/student/fees' },
      ];
    } else if (role === 'mentor') {
      return [
        { name: 'My Dashboard', icon: LayoutDashboard, path: '/mentor' },
        { name: 'My Students', icon: Users, path: '/mentor/students' },
        { name: 'Mark Attendance', icon: ShieldCheck, path: '/mentor/attendance' },
        { name: 'Assign Tasks', icon: CheckSquare, path: '/mentor/tasks' },
        { name: 'Salary Status', icon: CreditCard, path: '/mentor/salary' },
      ];
    } else if (role === 'teacher') {
      return [
        { name: 'Global Overview', icon: LayoutDashboard, path: '/teacher' },
        { name: 'Manage Users', icon: Users, path: '/teacher/users' },
        { name: 'Mapping Logic', icon: ArrowRightLeft, path: '/teacher/assignments' },
        { name: 'AI Exams', icon: BookOpen, path: '/teacher/exams' },
        { name: 'Financial Control', icon: CreditCard, path: '/teacher/finance' },
      ];
    } else if (role === 'admin' || role === 'developer') {
      return [
        { name: 'System Control', icon: LayoutDashboard, path: '/admin' },
        { name: 'Impersonation API', icon: Users, path: '/student' },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully!');
    setTimeout(() => navigate('/login'), 800);
  };

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : role?.[0]?.toUpperCase() || '?';

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between">
      {/* Logo */}
      <div>
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-500 to-cyan-400 p-1.5 rounded-lg shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Track<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">ED</span>
            </h1>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-600 mb-3 px-2 uppercase tracking-widest">
            {role} Menu
          </div>
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === '/student' || link.path === '/mentor' || link.path === '/teacher'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/10 text-cyan-400 border border-cyan-500/25 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-full" />
                  )}
                  <link.icon className="w-4 h-4 flex-shrink-0" />
                  {link.name}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Bottom: Mini Profile + Logout */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* Mini Profile */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-3 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 capitalize font-medium">{user.role}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-4 py-2.5 rounded-xl font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Desktop Sidebar ─────────────────────────────── */}
      <div className="h-screen w-64 bg-[#0A0F1C] border-r border-slate-800 fixed left-0 top-0 z-30 hidden md:block">
        <SidebarContent />
      </div>

      {/* ─── Mobile Hamburger ────────────────────────────── */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 rounded-xl bg-[#0A0F1C] border border-slate-700 text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 h-full w-64 bg-[#0A0F1C] border-r border-slate-800 z-50 md:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
