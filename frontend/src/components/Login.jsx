import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../features/authSlice';
import axios from 'axios';
import { Package, Lock, Mail } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Create user if not exists (demo mode)
      try {
        await axios.post(`${API_URL}/api/auth/register`, { name: 'Demo Admin', email, password, role: 'Admin' });
      } catch (err) { /* ignore if exists */ }
      
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      dispatch(loginSuccess({ user: { name: res.data.name, role: res.data.role, email: res.data.email }, token: res.data.token }));
    } catch (err) {
      alert('Login failed. For demo, just use any email and password.');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-background p-4">
      <div className="bg-white dark:bg-surface p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700/50 relative overflow-hidden">
        {/* Decorative blur */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl mix-blend-screen pointer-events-none"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
            <Package size={32} className="text-slate-900 dark:text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Smart Logistics</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">Sign in to access control center</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-slate-600 dark:text-slate-400" />
            </div>
            <input 
              type="email" 
              placeholder="operator@logistics.com" 
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-600 dark:text-slate-400" />
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full py-3 bg-primary hover:bg-blue-600 text-slate-900 dark:text-white font-medium rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]">
            Access System
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
