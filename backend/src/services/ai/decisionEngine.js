const { findShortestPath } = require('../../utils/routeOptimizer');
const Shipment = require('../../models/Shipment');

exports.recommendRoute = async (req, res) => {
  try {
    const { shipmentId, blockedNodes = [], weights = { time: 1, cost: 1, co2: 1, risk: 1 } } = req.body;
    
    // In a real app, we fetch shipment coords and map to nearest hub
    // Here we use hardcoded hubs for demo
    let startNode = 'Cincinnati';
    let endNode = 'Los Angeles';
    if (shipmentId === 'SHP-002') { startNode = 'Nashville'; endNode = 'Chicago'; }
    if (shipmentId === 'SHP-003') { startNode = 'Denver'; endNode = 'Miami'; }

    // Run baseline (no weights)
    const baseline = findShortestPath(startNode, endNode, blockedNodes, { time: 1, cost: 1, co2: 1, risk: 1 });
    
    // Run weighted user optimization
    const optimized = findShortestPath(startNode, endNode, blockedNodes, weights);

    if (!optimized) return res.status(400).json({ message: 'No viable routes' });

    // Calculate AI metrics
    const etaImprovement = baseline.score - optimized.score;
    const costChange = baseline.estimatedCost - optimized.estimatedCost;
    const co2Change = baseline.co2Emissions - optimized.co2Emissions;
    
    // Simple heuristic confidence score
    const confidenceScore = Math.min(99, Math.max(50, 95 - blockedNodes.length * 5 + etaImprovement));

    res.json({
      recommendedRoute: optimized.pathNames,
      coordinates: optimized.coordinates,
      confidenceScore: Math.floor(confidenceScore),
      etaImprovement: etaImprovement.toFixed(1), // abstract score delta
      costChange: costChange.toFixed(2),
      co2Change: co2Change.toFixed(2),
      reason: `Optimized for ${Object.keys(weights).reduce((a, b) => weights[a] > weights[b] ? a : b)} preferences avoiding high-risk zones.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
