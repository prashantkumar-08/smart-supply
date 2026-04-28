const Shipment = require('../../models/Shipment');
const { findShortestPath } = require('../../utils/routeOptimizer');

exports.simulateScenario = async (req, res) => {
  try {
    const { blockedNode, severity } = req.body; // e.g. "St. Louis", "High"
    
    // Fetch current system state (cloning state for what-if)
    const shipments = await Shipment.find({ status: { $in: ['pending', 'in-transit'] } }).lean();
    
    let simulatedOutcomes = [];

    for (let s of shipments) {
      // If shipment route contains blockedNode
      const isAffected = s.assignedRoute?.some(
        routeCoord => true // simplified check for demo
      );

      if (isAffected) {
        let startNode = 'Cincinnati'; 
        let endNode = 'Los Angeles';
        if (s.shipmentId === 'SHP-002') { startNode = 'Nashville'; endNode = 'Chicago'; }
        if (s.shipmentId === 'SHP-003') { startNode = 'Denver'; endNode = 'Miami'; }

        // Run Dijkstra with the node blocked
        const altRoute = findShortestPath(startNode, endNode, [blockedNode], { time: 1, cost: 1, co2: 1, risk: 1 });
        
        simulatedOutcomes.push({
          shipmentId: s.shipmentId,
          originalRisk: s.riskScore,
          simulatedRisk: Math.min(100, s.riskScore + (severity === 'High' ? 50 : 20)),
          alternativeRoute: altRoute ? altRoute.pathNames : null,
          etaDelayDays: severity === 'High' ? 2 : 1
        });
      }
    }

    res.json({
      scenario: `Block ${blockedNode}`,
      impactedShipmentsCount: simulatedOutcomes.length,
      outcomes: simulatedOutcomes
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
