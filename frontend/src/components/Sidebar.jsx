import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BarChart3, CreditCard, Users, ShieldCheck, LogOut, Sparkles, BookOpen, ArrowRightLeft } from 'lucide-react';

export default function Sidebar({ role }) {
  const navigate = useNavigate();

  // Define navigation links dynamically based on the user role
  const getNavLinks = () => {
    if (role === 'student') {
      return [
        { name: 'Performance', icon: LayoutDashboard, path: '/student' },
        { name: 'Daily Tasks', icon: CheckSquare, path: '/student/tasks' },
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
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <div className="h-screen w-64 bg-[#0A0F1C] border-r border-slate-800 flex flex-col justify-between fixed left-0 top-0">
      
      {/* Sidebar Header / Logo */}
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

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold text-slate-500 mb-4 px-2 uppercase tracking-wider">
          {role} Menu
        </div>
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 shadow-inner border border-slate-700/50'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.name}
          </NavLink>
        ))}
      </div>

      {/* Sidebar Footer / Logout */}
      <div className="p-6 border-t border-slate-800/80">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center w-full gap-3 px-4 py-3 rounded-xl font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
