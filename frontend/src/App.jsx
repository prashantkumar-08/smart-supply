import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import axios from 'axios';
import { updateShipmentLocation, updateShipmentStatus, addShipment } from './features/shipmentSlice';
import { Bell, MessageSquare, X } from 'lucide-react';

import MapDashboard from './components/MapDashboard';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import RiskCenter from './components/RiskCenter';

// Using Vite environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

function App() {
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  
  // Chatbot State
  const [showChat, setShowChat] = useState(false);
  const chatRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([{ sender: 'ai', text: 'Hello! I am your AI Control Tower Assistant. Ask me anything about the supply chain.' }]);
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    try {
      const res = await axios.post(`${API_URL}/api/ai/chat`, { message: userMsg });
      setChatMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Error connecting to AI service.' }]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setShowChat(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    socket.on('location-update', (data) => {
      dispatch(updateShipmentLocation(data));
    });

    socket.on('disruption-alert', (data) => {
      dispatch(updateShipmentStatus(data));
      
      const newAlert = {
        id: Date.now(),
        message: data.type === 'optimization-applied' 
          ? `✅ Rerouted shipment ${data.shipmentId} successfully.` 
          : `🚨 DISRUPTION: ${data.type.toUpperCase()} reported for ${data.shipmentId}. Risk Score now ${data.riskScore}.`,
        time: new Date().toLocaleTimeString(),
        type: data.type === 'optimization-applied' ? 'success' : 'danger'
      };
      
      setAlerts(prev => [newAlert, ...prev].slice(0, 5)); // Keep last 5
    });
    
    socket.on('cascading-failure-alert', (data) => {
      const newAlert = {
        id: Date.now(),
        message: `⚠️ IMPACT ZONE: ${data.originNode} delay impacting ${data.affectedShipmentIds.length} shipments.`,
        time: new Date().toLocaleTimeString(),
        type: 'danger'
      };
      setAlerts(prev => [newAlert, ...prev].slice(0, 5));
    });

    socket.on('shipment-created', (data) => {
      dispatch(addShipment(data));
    });

    return () => {
      socket.off('location-update');
      socket.off('disruption-alert');
      socket.off('cascading-failure-alert');
      socket.off('shipment-created');
    };
  }, [dispatch]);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-background relative text-slate-900 dark:text-slate-100">
        {isAuthenticated && <Sidebar />}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {isAuthenticated && (
            <>
              {/* Notifications Bell */}
              <div ref={notificationsRef} className="absolute top-4 right-4 z-[999]">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) setShowChat(false);
                  }} 
                  className="p-2 bg-white dark:bg-surface border border-slate-300 dark:border-slate-600 rounded-full hover:bg-slate-200 dark:bg-slate-700 relative"
                >
                  <Bell size={20} className="text-slate-700 dark:text-slate-300" />
                  {alerts.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-danger rounded-full border-2 border-surface animate-pulse"></span>}
                </button>
                
                {showNotifications && (
                  <div className="absolute top-12 right-0 w-80 bg-white dark:bg-surface/95 backdrop-blur-xl border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xl p-4 animate-fade-in">
                    <h3 className="font-bold text-sm mb-3 text-slate-700 dark:text-slate-300">Live System Alerts</h3>
                    <div className="space-y-3">
                      {alerts.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-500">No alerts yet.</p>
                      ) : (
                        alerts.map(alert => (
                          <div key={alert.id} className={`p-3 rounded-lg border text-xs ${alert.type === 'danger' ? 'bg-danger/10 border-danger/30 text-red-200' : 'bg-success/10 border-success/30 text-green-200'}`}>
                            <div className="flex justify-between mb-1">
                              <span className="font-bold">{alert.type === 'danger' ? 'ALERT' : 'SYSTEM UPDATE'}</span>
                              <span className="opacity-70">{alert.time}</span>
                            </div>
                            <p>{alert.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chatbot Toggle */}
              <div ref={chatRef}>
                <button 
                  onClick={() => {
                    setShowChat(!showChat);
                    if (!showChat) setShowNotifications(false);
                  }} 
                  className="absolute bottom-6 right-6 z-[999] p-4 bg-primary hover:bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
                >
                  {showChat ? <X size={24} className="text-slate-900 dark:text-white" /> : <MessageSquare size={24} className="text-slate-900 dark:text-white" />}
                </button>

                {/* Chatbot Window */}
                {showChat && (
                  <div className="absolute bottom-24 right-6 w-80 bg-white dark:bg-surface/95 backdrop-blur-xl border border-slate-300 dark:border-slate-600 rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden animate-fade-in">
                    <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2"><span className="text-xl">🤖</span> AI Assistant</h3>
                    </div>
                    <div className="p-4 h-64 overflow-y-auto space-y-3 flex flex-col">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`p-2.5 rounded-xl text-sm max-w-[85%] ${msg.sender === 'user' ? 'bg-primary text-slate-900 dark:text-white self-end rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 self-start rounded-bl-none'}`}>
                          {msg.text}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2 bg-slate-100 dark:bg-slate-900">
                      <input 
                        type="text" 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)} 
                        placeholder="Ask something..." 
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                      <button type="submit" className="bg-primary hover:bg-blue-500 text-slate-900 dark:text-white px-3 py-2 rounded-lg text-sm font-bold">Send</button>
                    </form>
                  </div>
                )}
              </div>
            </>
          )}

          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/" element={isAuthenticated ? <MapDashboard /> : <Navigate to="/login" />} />
            <Route path="/analytics" element={isAuthenticated ? <AnalyticsDashboard /> : <Navigate to="/login" />} />
            <Route path="/risk-center" element={isAuthenticated ? <RiskCenter /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
