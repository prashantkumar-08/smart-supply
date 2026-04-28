const Shipment = require('../../models/Shipment');

exports.chatQuery = async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMessage = message.toLowerCase();
    
    // Fetch system context
    const shipments = await Shipment.find().lean();
    const delayed = shipments.filter(s => s.status === 'delayed');
    
    let reply = "I am your AI Control Tower Assistant. How can I help you today?";

    if (lowerMessage.includes('delay') || lowerMessage.includes('why')) {
      if (delayed.length > 0) {
        reply = `Currently, ${delayed.length} shipment(s) are delayed. For example, ${delayed[0].shipmentId} has a high risk score of ${delayed[0].riskScore}. Would you like me to run an AI route optimization?`;
      } else {
        reply = "Currently, all shipments are operating within normal parameters. No delays detected.";
      }
    } else if (lowerMessage.includes('suggest') || lowerMessage.includes('route')) {
      reply = "To suggest a route, I recommend selecting a specific shipment on the map and using the ✨ AI Route Optimization panel. It will evaluate Time, Cost, and CO₂ metrics dynamically.";
    } else if (lowerMessage.includes('status')) {
      reply = `Global Status: ${shipments.length} total active shipments. ${delayed.length} are delayed.`;
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
