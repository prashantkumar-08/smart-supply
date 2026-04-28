import React from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, MapPin, Clock } from 'lucide-react';

const RiskCenter = () => {
  const { items: shipments } = useSelector(state => state.shipments);

  // Get high risk and delayed shipments
  const atRiskShipments = shipments.filter(s => s.riskScore > 30).sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-danger/20 rounded-xl">
          <AlertTriangle className="text-danger" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Risk Center</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Identify, monitor, and mitigate active supply chain threats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-700/50 p-5 rounded-2xl shadow-lg flex flex-col justify-center items-center text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold mb-2">Total High Risk Shipments</p>
          <p className="text-4xl font-bold text-danger">{atRiskShipments.filter(s => s.riskScore > 70).length}</p>
        </div>
        <div className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-700/50 p-5 rounded-2xl shadow-lg flex flex-col justify-center items-center text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold mb-2">Total At Risk Shipments</p>
          <p className="text-4xl font-bold text-yellow-500">{atRiskShipments.filter(s => s.riskScore > 30 && s.riskScore <= 70).length}</p>
        </div>
        <div className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-700/50 p-5 rounded-2xl shadow-lg flex flex-col justify-center items-center text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold mb-2">System Health Status</p>
          <p className={`text-2xl font-bold ${atRiskShipments.length > 2 ? 'text-danger' : 'text-success'}`}>
             {atRiskShipments.length > 2 ? 'Critical' : 'Stable'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/30">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Active Threats & Delays</h3>
        </div>
        
        {atRiskShipments.length === 0 ? (
           <div className="p-8 text-center text-slate-600 dark:text-slate-400">
             <div className="inline-block p-4 bg-success/10 rounded-full mb-3">
               <span className="text-2xl">🌱</span>
             </div>
             <p className="font-semibold">No active threats detected.</p>
             <p className="text-sm mt-1">All shipments are proceeding normally.</p>
           </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {atRiskShipments.map(shipment => (
              <div key={shipment._id} className="p-6 hover:bg-white dark:bg-slate-800/30 transition-colors flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${shipment.riskScore > 70 ? 'bg-danger/20 text-danger' : 'bg-yellow-500/20 text-yellow-500'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">{shipment.shipmentId}</h4>
                    <div className="flex gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1"><MapPin size={16} /> {shipment.currentLocation.lat.toFixed(2)}, {shipment.currentLocation.lng.toFixed(2)}</span>
                      <span className="flex items-center gap-1"><Clock size={16} /> ETA: {new Date(shipment.eta).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="mb-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold tracking-wider">Risk Score</span>
                    <p className={`text-2xl font-black ${shipment.riskScore > 70 ? 'text-danger' : 'text-yellow-500'}`}>{shipment.riskScore}/100</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${shipment.status === 'delayed' ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'}`}>
                    {shipment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskCenter;
