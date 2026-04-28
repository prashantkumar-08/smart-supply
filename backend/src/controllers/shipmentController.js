const Shipment = require('../models/Shipment');

exports.getShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find();
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createShipment = async (req, res) => {
  try {
    const shipment = await Shipment.create(req.body);
    // Emit real-time event when created
    req.app.get('io').emit('shipment-created', shipment);
    res.status(201).json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateShipmentLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    
    const shipment = await Shipment.findByIdAndUpdate(
      id, 
      { 'currentLocation.lat': lat, 'currentLocation.lng': lng },
      { new: true }
    );
    
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    
    // Broadcast location update
    req.app.get('io').emit('location-update', { id, lat, lng });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.simulateDisruption = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'storm' or 'traffic'
    
    const shipment = await Shipment.findById(id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    let riskIncrease = 0;
    let delayHours = 0;
    
    if (type === 'storm') {
      riskIncrease = 40;
      delayHours = 24;
      if (!shipment.riskFactors.includes('Severe Weather')) {
        shipment.riskFactors.push('Severe Weather');
      }
    } else if (type === 'traffic') {
      riskIncrease = 20;
      delayHours = 6;
      if (!shipment.riskFactors.includes('Traffic Congestion')) {
        shipment.riskFactors.push('Traffic Congestion');
      }
    }

    shipment.riskScore = Math.min(100, shipment.riskScore + riskIncrease);
    
    // Add delay to ETA
    if (shipment.eta) {
      shipment.eta = new Date(shipment.eta.getTime() + delayHours * 60 * 60 * 1000);
    }
    
    const { predictCascadingFailures } = require('../services/ai/cascadingFailure');
    
    // Status update based on risk
    if (shipment.riskScore > 70) {
      shipment.status = 'delayed';
    }

    await shipment.save();

    // Broadcast disruption event to frontend
    req.app.get('io').emit('disruption-alert', { 
      shipmentId: shipment.shipmentId, 
      id: shipment._id,
      type, 
      riskScore: shipment.riskScore,
      status: shipment.status,
      eta: shipment.eta
    });
    
    // AI EXTENSION: Trigger Cascading Failure Prediction asynchronously
    // Assume the blocked node is the next coordinate in their assigned route
    if (shipment.assignedRoute && shipment.assignedRoute.length > 0) {
       // Just mapping back to a mock hub name for the demo
       let impactedNode = type === 'storm' ? 'St. Louis' : 'Nashville'; 
       predictCascadingFailures(req.app.get('io'), impactedNode, type === 'storm' ? 5 : 3);
    }

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const { findShortestPath } = require('../utils/routeOptimizer');

// ... at the very end of the file ...

exports.optimizeRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findById(id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    // In a real scenario, we'd map coords to nearest graph nodes.
    // Here we'll hardcode based on ID for demo purposes to match our seeded logic.
    let startNode, endNode;
    if (shipment.shipmentId === 'SHP-001') { startNode = 'Cincinnati'; endNode = 'Los Angeles'; }
    else if (shipment.shipmentId === 'SHP-002') { startNode = 'Nashville'; endNode = 'Chicago'; }
    else { startNode = 'Denver'; endNode = 'Miami'; }

    // If there is a disruption (e.g. storm), simulate that the "next" node is blocked
    // For demo, let's say St. Louis is blocked if SHP-001 has high risk.
    const blockedNodes = shipment.riskScore > 30 ? ['St. Louis', 'Nashville'] : [];

    const optimizationResult = findShortestPath(startNode, endNode, blockedNodes);

    if (!optimizationResult) return res.status(400).json({ message: 'No viable route found' });

    res.json({
      originalEta: shipment.eta,
      optimizedEta: new Date(Date.now() + optimizationResult.totalDistance * 1.5 * 60 * 60 * 1000), // mocked ETA calculation
      newRoute: optimizationResult.coordinates,
      pathNames: optimizationResult.pathNames,
      co2Emissions: optimizationResult.co2Emissions,
      cost: optimizationResult.estimatedCost
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.applyOptimization = async (req, res) => {
  try {
    const { id } = req.params;
    const { newRoute, optimizedEta } = req.body;

    const shipment = await Shipment.findById(id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    shipment.assignedRoute = newRoute;
    shipment.eta = optimizedEta;
    shipment.riskScore = Math.max(0, shipment.riskScore - 30); // Risk mitigated!
    if (shipment.riskScore <= 70) shipment.status = 'in-transit';

    await shipment.save();

    req.app.get('io').emit('disruption-alert', { 
      shipmentId: shipment.shipmentId, 
      id: shipment._id,
      type: 'optimization-applied', 
      riskScore: shipment.riskScore,
      status: shipment.status,
      eta: shipment.eta,
      assignedRoute: shipment.assignedRoute
    });

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
