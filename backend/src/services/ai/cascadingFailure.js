const Shipment = require('../../models/Shipment');
const { hubs } = require('../../utils/routeOptimizer');
const redisClient = require('../redisMock');
const EventLog = require('../../models/EventLog');

exports.predictCascadingFailures = async (io, blockedNode, severity) => {
  try {
    const shipments = await Shipment.find({ status: { $in: ['pending', 'in-transit'] } });
    
    let affectedShipments = [];
    let totalSeverityScore = 0;

    for (let shipment of shipments) {
      // Check if blocked node is in the assigned route
      const isAffected = shipment.assignedRoute?.some(
        routeCoord => routeCoord.lat === hubs[blockedNode].lat && routeCoord.lng === hubs[blockedNode].lng
      );

      if (isAffected) {
        affectedShipments.push(shipment);
        totalSeverityScore += severity * 10;
        
        // Propagate risk
        shipment.riskScore = Math.min(100, shipment.riskScore + (severity * 10));
        if (shipment.riskScore > 70) shipment.status = 'delayed';
        await shipment.save();

        // Log to EventLog
        await EventLog.create({
          shipmentId: shipment.shipmentId,
          eventClass: 'disruption',
          data: { type: 'Cascading Failure', origin: blockedNode },
          snapshot: {
            lat: shipment.currentLocation.lat,
            lng: shipment.currentLocation.lng,
            status: shipment.status,
            riskScore: shipment.riskScore
          }
        });
      }
    }

    if (affectedShipments.length > 0) {
      const impactData = {
        originNode: blockedNode,
        affectedShipmentIds: affectedShipments.map(s => s.shipmentId),
        severityScore: totalSeverityScore,
        timeToImpact: `${Math.floor(Math.random() * 5) + 1} hours` // heuristic
      };

      // Broadcast to frontend
      io.emit('cascading-failure-alert', impactData);
      
      // Save to redis cache for fast retrieval of latest impact zone
      await redisClient.set('latestImpactZone', JSON.stringify(impactData), { EX: 3600 });
      
      return impactData;
    }
    
    return null;
  } catch (error) {
    console.error('Cascading Failure Error:', error);
  }
};
