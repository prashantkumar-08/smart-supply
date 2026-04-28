const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true },
  origin: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }
  },
  destination: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }
  },
  currentLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'in-transit', 'delayed', 'delivered'],
    default: 'pending'
  },
  eta: { type: Date },
  priorityLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  assignedRoute: [{
    lat: { type: Number },
    lng: { type: Number }
  }],
  riskScore: { type: Number, default: 0 },
  riskFactors: [String],
  contact: {
    name: { type: String, default: 'Unassigned' },
    phone: { type: String, default: 'N/A' },
    email: { type: String, default: 'N/A' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
