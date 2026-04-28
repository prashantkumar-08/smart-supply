const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  eventClass: { type: String, enum: ['movement', 'disruption', 'optimization'], required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  snapshot: {
    lat: Number,
    lng: Number,
    status: String,
    riskScore: Number
  }
});

module.exports = mongoose.model('EventLog', eventLogSchema);
