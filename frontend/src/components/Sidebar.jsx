import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/authSlice';
import { Map, LayoutDashboard, Truck, AlertTriangle, Settings, LogOut, Package, Menu, Sun, Moon } from 'lucide-react';

import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check initial state
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.add('dark'); // Default to dark
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  return (
    <aside className={`${isExpanded ? 'w-64' : 'w-20'} transition-all duration-300 bg-white dark:bg-surface border-r border-slate-200 dark:border-slate-700/50 flex flex-col h-full shrink-0 relative`}>
      <div className={`p-6 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} gap-3`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg min-w-max">
            <Package className="text-primary" size={24} />
          </div>
          {isExpanded && <h1 className="font-bold text-lg tracking-tight whitespace-nowrap">Smart Supply</h1>}
        </div>
      </div>
      
      {/* Hamburger Toggle */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="absolute top-6 -right-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full p-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-slate-700 z-50 shadow-lg"
      >
        <Menu size={16} />
      </button>
      
      {isExpanded ? (
        <div className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Main Menu</div>
      ) : (
        <div className="h-4 border-t border-slate-200 dark:border-slate-700/30 mx-4 my-2"></div>
      )}
      
      <nav className="flex-1 px-3 space-y-1 mt-2">
        <NavItem icon={<Map size={20} />} label="Live Map" to="/" alert={false} isExpanded={isExpanded} />
        <NavItem icon={<LayoutDashboard size={20} />} label="Analytics" to="/analytics" alert={false} isExpanded={isExpanded} />
        <NavItem icon={<AlertTriangle size={20} />} label="Risk Center" to="/risk-center" alert={true} isExpanded={isExpanded} />
      </nav>

      <div className={`p-4 border-t border-slate-200 dark:border-slate-700/50 ${isExpanded ? '' : 'flex flex-col items-center'}`}>
        <div className={`bg-white dark:bg-slate-800 rounded-xl flex ${isExpanded ? 'flex-col items-center p-4 mb-4' : 'justify-center p-2 mb-2'} border border-slate-200 dark:border-slate-700`}>
          <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {isExpanded && (
            <>
              <span className="text-sm font-medium mt-2 whitespace-nowrap">{user?.name}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{user?.role}</span>
            </>
          )}
        </div>
        
        <button 
          onClick={toggleTheme}
          className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-white dark:bg-slate-800 rounded-lg transition-colors mb-2 ${isExpanded ? 'w-full px-4 py-2.5' : 'p-3 justify-center'}`}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          {isExpanded && <span className="text-sm font-medium whitespace-nowrap">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button 
          onClick={() => dispatch(logout())}
          className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-white dark:bg-slate-800 rounded-lg transition-colors ${isExpanded ? 'w-full px-4 py-2.5' : 'p-3 justify-center'}`}
          title="Log out"
        >
          <LogOut size={18} />
          {isExpanded && <span className="text-sm font-medium whitespace-nowrap">Log out</span>}
        </button>
      </div>
    </aside>
  );
};

const NavItem = ({ icon, label, to, alert, isExpanded }) => (
  <NavLink 
    to={to} 
    title={!isExpanded ? label : undefined}
    className={({ isActive }) => `flex items-center ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-3 mb-1'} rounded-lg transition-colors relative ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:bg-slate-800 hover:text-slate-900 dark:text-white'}`}
  >
    <div className="shrink-0">{icon}</div>
    {isExpanded && <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{label}</span>}
    {alert && <span className={`absolute rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)] ${isExpanded ? 'right-3 w-2 h-2' : 'top-2 right-2 w-2 h-2'}`}></span>}
  </NavLink>
);

export default Sidebar;
