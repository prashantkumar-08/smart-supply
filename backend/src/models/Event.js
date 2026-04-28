const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  type: { type: String, enum: ['weather', 'traffic', 'anomaly', 'system'], required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  description: { type: String, required: true },
  impactScore: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
