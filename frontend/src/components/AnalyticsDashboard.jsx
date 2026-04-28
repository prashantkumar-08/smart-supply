import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import axios from 'axios';
import { Play, Pause, FastForward } from 'lucide-react';

const AnalyticsDashboard = () => {
  const { items: shipments } = useSelector(state => state.shipments);
  const [timeline, setTimeline] = useState([]);
  const [replayState, setReplayState] = useState({ playing: false, index: 0, speed: 1000 });

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://smart-supply-backend-7mvk.onrender.com';
        const res = await axios.get(`${API_URL}/api/ai/replay`);
        setTimeline(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTimeline();
  }, []);

  useEffect(() => {
    let interval;
    if (replayState.playing && replayState.index < timeline.length - 1) {
      interval = setInterval(() => {
        setReplayState(prev => ({ ...prev, index: prev.index + 1 }));
      }, replayState.speed);
    } else if (replayState.index >= timeline.length - 1 && replayState.playing) {
      setReplayState(prev => ({ ...prev, playing: false }));
    }
    return () => clearInterval(interval);
  }, [replayState.playing, replayState.index, replayState.speed, timeline.length]);

  const togglePlay = () => setReplayState(prev => ({ ...prev, playing: !prev.playing }));
  const changeSpeed = () => setReplayState(prev => ({ ...prev, speed: prev.speed === 1000 ? 500 : prev.speed === 500 ? 200 : 1000 }));
  const resetReplay = () => setReplayState(prev => ({ ...prev, index: 0, playing: false }));

  const statusData = useMemo(() => [
    { name: 'On Time', value: shipments.filter(s => s.status === 'in-transit' && s.riskScore <= 30).length },
    { name: 'At Risk', value: shipments.filter(s => s.riskScore > 30 && s.riskScore <= 70).length },
    { name: 'Delayed', value: shipments.filter(s => s.status === 'delayed' || s.riskScore > 70).length },
    { name: 'Delivered', value: shipments.filter(s => s.status === 'delivered').length }
  ], [shipments]);

  const riskData = useMemo(() => shipments.map(s => ({
    name: s.shipmentId,
    risk: s.riskScore
  })), [shipments]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background p-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Operations Analytics & Replay</h2>
      
      {/* Event Replay Panel */}
      <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-lg mb-8 text-slate-800 dark:text-slate-200">
        <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Event Replay Timeline</h3>
        {timeline.length > 0 ? (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <button onClick={togglePlay} className="p-3 bg-primary hover:bg-blue-500 rounded-full shadow-lg">
                {replayState.playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={changeSpeed} className="p-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:bg-slate-600 rounded-full">
                <FastForward size={20} /> <span className="text-xs ml-1">{1000 / replayState.speed}x</span>
              </button>
              <button onClick={resetReplay} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:bg-slate-600 rounded-lg text-sm font-bold">
                Reset
              </button>
              <div className="flex-1 ml-4">
                <input 
                  type="range" 
                  min="0" 
                  max={timeline.length - 1} 
                  value={replayState.index}
                  onChange={(e) => setReplayState({...replayState, index: parseInt(e.target.value)})}
                  className="w-full accent-primary"
                />
              </div>
            </div>
            
            {timeline[replayState.index] && (
              <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                  <span>{new Date(timeline[replayState.index].timestamp).toLocaleString()}</span>
                  <span className="uppercase text-xs font-bold px-2 py-1 bg-white dark:bg-slate-800 rounded">{timeline[replayState.index].eventClass}</span>
                </div>
                <p className="font-bold text-lg text-slate-900 dark:text-white mb-3">{timeline[replayState.index].shipmentId}</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(timeline[replayState.index].data || timeline[replayState.index].snapshot || {}).map(([key, value]) => {
                    if (typeof value === 'object' || key === '_id' || key === '__v') return null;
                    return (
                      <div key={key} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700/50 flex flex-col">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={String(value)}>{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-500 italic">No events logged yet. Inject disruptions on the map to record history.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Shipment Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" isAnimationActive={false}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Risk Score by Shipment</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="risk" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
