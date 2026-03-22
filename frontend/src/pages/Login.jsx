import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Sparkles, TrendingUp, ShieldCheck, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Support MOCK LOGIN SHORTCUTS
    let finalEmail = email.trim();
    if (finalEmail.endsWith('@')) {
        finalEmail += 'tracked.com';
    } else if (['student', 'mentor', 'teacher', 'developer'].includes(finalEmail)) {
        finalEmail += '@tracked.com';
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email: finalEmail, password });
      setIsLoading(false);
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      
      toast.success(`Welcome back, ${user.name}!`);
      
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'mentor') navigate('/mentor');
      else if (user.role === 'teacher') navigate('/teacher');
      else if (user.role === 'developer') navigate('/developer');
      
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || "Login failed. Please verify credentials.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans selection:bg-cyan-500/30">
      
      {/* Left Branding Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0A0F1C] border-r border-slate-800 flex-col justify-between p-12">
        {/* Dynamic Glowing Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-1000"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-cyan-400 p-2.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Track<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">ED</span>
            </h1>
          </div>
          
          <div className="mt-24 max-w-lg">
            <h2 className="text-5xl font-extrabold leading-[1.15] tracking-tight mb-6 text-white">
              Elevate Performance. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-400 to-slate-600">Empower Mentors.</span>
            </h2>
            <p className="text-lg text-slate-400 mb-12 leading-relaxed font-medium">
              The definitive multi-level hierarchical tracking system designed for elite educational institutions and fast-growing organizations.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-slate-300 group cursor-default">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 group-hover:border-cyan-500/50 transition-colors shadow-lg shadow-black/50">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-lg">Real-time Analytics</h4>
                  <p className="text-sm text-slate-500">Monitor student and mentor progress instantly.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-300 group cursor-default">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 group-hover:border-indigo-500/50 transition-colors shadow-lg shadow-black/50">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-lg">Role-based Access Control</h4>
                  <p className="text-sm text-slate-500">Secure, hierarchical dashboards for every tier.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-600 font-medium tracking-wide flex items-center gap-2">
          <span>© {new Date().getFullYear()} TrackED Inc.</span> 
          <span className="w-1 h-1 bg-slate-700 rounded-full"></span> 
          <span>Enterprise Grade System</span>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative bg-[#060913]">
        {/* Subtle glow for mobile */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-[420px] relative z-10">
          <div className="text-center lg:text-left mb-10">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center items-center gap-2 mb-8">
              <div className="bg-gradient-to-br from-indigo-500 to-cyan-400 p-2 rounded-xl shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Track<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">ED</span>
              </h1>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400 text-base font-medium">Log in to your workspace to continue.</p>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@tracked.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0A0F1C] border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-medium shadow-inner shadow-black/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0A0F1C] border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-medium shadow-inner shadow-black/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-600 bg-[#0A0F1C] group-hover:border-cyan-400 transition-colors">
                    <input type="checkbox" className="peer w-full h-full absolute opacity-0 cursor-pointer" />
                    <svg className="w-3.5 h-3.5 text-cyan-400 scale-0 peer-checked:scale-100 transition-transform pointer-events-none drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors font-medium">Remember me</span>
                </label>
                <a href="#" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-4 px-4 rounded-2xl text-[15px] font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 hover:-translate-y-0.5 mt-8"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    Sign In to Portal <LogIn className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-10 text-center">
            <span className="block mb-3 text-[11px] font-bold text-slate-500 tracking-wider">MOCK LOGIN SHORTCUTS</span>
            <div className="flex justify-center gap-2.5 flex-wrap">
              <span className="bg-[#0A0F1C] border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs font-mono text-cyan-400 cursor-help hover:border-cyan-400/50 transition-colors shadow-sm" title="Enter 'student@' in email">student@</span>
              <span className="bg-[#0A0F1C] border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs font-mono text-indigo-400 cursor-help hover:border-indigo-400/50 transition-colors shadow-sm" title="Enter 'mentor@' in email">mentor@</span>
              <span className="bg-[#0A0F1C] border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs font-mono text-purple-400 cursor-help hover:border-purple-400/50 transition-colors shadow-sm" title="Enter 'teacher@' in email">teacher@</span>
              <span className="bg-[#0A0F1C] border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs font-mono text-rose-400 cursor-help hover:border-rose-400/50 transition-colors shadow-sm" title="Enter 'developer@' in email">developer@</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
