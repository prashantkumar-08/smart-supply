import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchShipments } from '../features/shipmentSlice';
import L from 'leaflet';
import axios from 'axios';

// Custom Map Marker Icons
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  'on-time': createIcon('green'),
  'delayed': createIcon('red'),
  'risk': createIcon('gold'),
  'pending': createIcon('grey')
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MapDashboard = () => {
  const dispatch = useDispatch();
  const { items: shipments, status } = useSelector(state => state.shipments);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [weights, setWeights] = useState({ time: 5, cost: 3, co2: 2, risk: 4 });
  const [whatIfOutcomes, setWhatIfOutcomes] = useState(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchShipments());
    }
  }, [status, dispatch]);

  // Clear optimization data when switching shipments
  useEffect(() => {
    setOptimizationData(null);
  }, [selectedShipment]);

  const handleSimulateDisruption = async (type) => {
    if (!selectedShipment) return alert("Select a shipment first");
    
    if (simulationMode) {
       // What-If analysis (doesn't mutate real DB)
       try {
         const res = await axios.post(`${API_URL}/api/ai/what-if`, { 
            blockedNode: type === 'storm' ? 'St. Louis' : 'Nashville', 
            severity: 'High' 
         });
         setWhatIfOutcomes(res.data);
         alert(`Simulation Complete: ${res.data.impactedShipmentsCount} shipment(s) would be affected.`);
       } catch (err) {
         console.error(err);
       }
       return;
    }

    // Real disruption
    try {
      await axios.post(`${API_URL}/api/shipments/${selectedShipment._id}/disrupt`, { type });
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} disruption injected!`);
    } catch (err) {
      console.log(err);
    }
  };

  const handleOptimizeRoute = async () => {
    try {
      // Normalize weights
      const normalized = { 
        time: weights.time / 5, cost: weights.cost / 5, co2: weights.co2 / 5, risk: weights.risk / 5 
      };
      const res = await axios.post(`${API_URL}/api/ai/recommend-route`, {
        shipmentId: selectedShipment.shipmentId,
        blockedNodes: [],
        weights: normalized
      });
      setOptimizationData(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to optimize route");
    }
  };

  const handleAcceptRoute = async () => {
    try {
      await axios.post(`${API_URL}/api/shipments/${selectedShipment._id}/apply-route`, {
        newRoute: optimizationData.newRoute,
        optimizedEta: optimizationData.optimizedEta
      });
      setOptimizationData(null);
      alert("Alternative route deployed successfully!");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between px-6 bg-white dark:bg-surface/50 backdrop-blur-md z-10">
        <h2 className="text-xl font-bold flex items-center gap-3">
          Global Operations Map
          <label className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 px-3 py-1 rounded-full cursor-pointer ml-4 border border-slate-300 dark:border-slate-600">
            <input type="checkbox" className="sr-only" checked={simulationMode} onChange={() => setSimulationMode(!simulationMode)} />
            <div className={`w-3 h-3 rounded-full ${simulationMode ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : 'bg-slate-500'}`}></div>
            <span className={simulationMode ? 'text-purple-300 font-bold' : 'text-slate-600 dark:text-slate-400'}>Simulation Mode</span>
          </label>
        </h2>
        <div className="flex gap-4 pr-12">
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> On Time
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span> At Risk
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Delayed
          </div>
        </div>
      </header>

      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer center={[39.8283, -98.5795]} zoom={4} className="h-full w-full z-0" theme="dark">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {shipments.map(shipment => {
            const riskColor = shipment.riskScore > 70 ? 'delayed' : shipment.riskScore > 30 ? 'risk' : 'on-time';
            return (
              <React.Fragment key={shipment._id}>
                <Marker 
                  position={[shipment.currentLocation.lat, shipment.currentLocation.lng]} 
                  icon={icons[riskColor]}
                  eventHandlers={{ click: () => setSelectedShipment(shipment) }}
                >
                  <Popup className="bg-white dark:bg-surface border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <div className="p-2">
                      <h3 className="font-bold text-lg mb-1">{shipment.shipmentId}</h3>
                      <p className="text-sm">Status: <span className="uppercase text-primary">{shipment.status}</span></p>
                      <p className="text-sm mt-1">Risk Score: <strong>{shipment.riskScore}</strong>/100</p>
                    </div>
                  </Popup>
                </Marker>
                {shipment.assignedRoute && shipment.assignedRoute.length > 0 && (
                  <Polyline 
                    positions={shipment.assignedRoute.map(pos => [pos.lat, pos.lng])} 
                    color={shipment._id === selectedShipment?._id ? '#3b82f6' : '#334155'}
                    weight={shipment._id === selectedShipment?._id ? 4 : 2}
                    dashArray="5, 10"
                  />
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Floating Panel for Digital Twin/What If */}
        {selectedShipment && (
          <div className="absolute top-4 right-4 w-80 bg-white dark:bg-surface/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-5 z-[400] text-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-primary">{selectedShipment.shipmentId}</h3>
              <button onClick={() => setSelectedShipment(null)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white">&times;</button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Status</span>
                <span className="font-medium uppercase">{selectedShipment.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Risk Score</span>
                <span className={`font-bold ${selectedShipment.riskScore > 70 ? 'text-danger' : 'text-success'}`}>
                  {selectedShipment.riskScore}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">ETA</span>
                <span className="font-medium">{new Date(selectedShipment.eta).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-start pt-2 border-t border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-600 dark:text-slate-400">Contact</span>
                <div className="text-right flex flex-col">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedShipment.contact?.name || 'N/A'}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{selectedShipment.contact?.phone}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{selectedShipment.contact?.email}</span>
                </div>
              </div>
            </div>

            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase text-xs tracking-wider">Digital Twin Simulator</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => handleSimulateDisruption('storm')} className={`${simulationMode ? 'border-purple-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 border rounded-lg py-2 transition-colors flex flex-col items-center gap-1`}>
                <span className="text-lg">⛈️</span> Storm
              </button>
              <button onClick={() => handleSimulateDisruption('traffic')} className={`${simulationMode ? 'border-purple-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 border rounded-lg py-2 transition-colors flex flex-col items-center gap-1`}>
                <span className="text-lg">🚗</span> Traffic
              </button>
            </div>

            {whatIfOutcomes && (
              <div className="mb-4 bg-purple-900/30 border border-purple-500/50 p-3 rounded-lg text-xs animate-fade-in">
                <h4 className="font-bold text-purple-300 mb-1">🔍 What-If Analysis Results</h4>
                <p>Scenario: {whatIfOutcomes.scenario}</p>
                <p>Impacted Shipments: <span className="font-bold text-danger">{whatIfOutcomes.impactedShipmentsCount}</span></p>
                {whatIfOutcomes.outcomes.map(o => (
                   <p key={o.shipmentId} className="mt-1 text-slate-700 dark:text-slate-300">
                     {o.shipmentId} - Risk: {o.originalRisk} → <span className="text-danger">{o.simulatedRisk}</span>
                   </p>
                ))}
              </div>
            )}

            {selectedShipment.riskScore > 30 && !optimizationData && (
              <div className="space-y-3 mt-4 border-t border-slate-200 dark:border-slate-700 pt-4 animate-fade-in">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-xs">AI Routing Preferences</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center"><label>Speed</label><input type="range" min="1" max="5" value={weights.time} onChange={(e)=>setWeights({...weights, time: e.target.value})} className="w-2/3 accent-blue-500" /></div>
                  <div className="flex justify-between items-center"><label>Cost</label><input type="range" min="1" max="5" value={weights.cost} onChange={(e)=>setWeights({...weights, cost: e.target.value})} className="w-2/3 accent-yellow-500" /></div>
                  <div className="flex justify-between items-center"><label>Green</label><input type="range" min="1" max="5" value={weights.co2} onChange={(e)=>setWeights({...weights, co2: e.target.value})} className="w-2/3 accent-green-500" /></div>
                </div>
                <button onClick={handleOptimizeRoute} className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg font-bold shadow-lg transition-all">
                  ✨ Recommend Route
                </button>
              </div>
            )}

            {optimizationData && (
              <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-success">💡 AI Recommendation</h4>
                  <span className="bg-success/20 text-success text-[10px] px-2 py-0.5 rounded-full border border-success/30">{optimizationData.confidenceScore}% Confidence</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mb-2 italic">"{optimizationData.reason}"</p>
                <div className="space-y-2 mb-4 text-xs bg-white dark:bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">ETA Savings</span>
                    <span className="text-success font-bold">~{optimizationData.etaImprovement} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">CO₂ Emissions</span>
                    <span className="text-green-400 font-bold">{optimizationData.co2Change < 0 ? optimizationData.co2Change : `+${optimizationData.co2Change}`} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cost Delta</span>
                    <span className="text-yellow-400 font-bold">${optimizationData.costChange < 0 ? optimizationData.costChange : `+${optimizationData.costChange}`}</span>
                  </div>
                </div>
                <button onClick={handleAcceptRoute} className="w-full py-2 bg-success hover:bg-green-400 text-slate-900 dark:text-white rounded-lg font-bold shadow-lg transition-all">
                  Accept New Route
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapDashboard;
