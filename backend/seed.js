const mongoose = require('mongoose');
const Shipment = require('./src/models/Shipment');

const seedShipments = async () => {
  const shipments = [
    {
      shipmentId: 'SHP-001',
      origin: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
      destination: { lat: 34.0522, lng: -118.2437, address: 'Los Angeles, CA' },
      currentLocation: { lat: 39.1031, lng: -84.5120 }, // Cincinnati
      status: 'in-transit',
      eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      priorityLevel: 'High',
      riskScore: 25,
      contact: { name: 'Alice Smith', phone: '+1-555-0101', email: 'alice@freight.com' },
      assignedRoute: [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 39.1031, lng: -84.5120 },
        { lat: 38.6270, lng: -90.1994 }, // St. Louis
        { lat: 34.0522, lng: -118.2437 }
      ]
    },
    {
      shipmentId: 'SHP-002',
      origin: { lat: 29.7604, lng: -95.3698, address: 'Houston, TX' },
      destination: { lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
      currentLocation: { lat: 36.1627, lng: -86.7816 }, // Nashville (delayed)
      status: 'delayed',
      eta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      priorityLevel: 'Medium',
      riskScore: 85,
      contact: { name: 'Bob Jones', phone: '+1-555-0202', email: 'bob@transit.com' },
      riskFactors: ['Severe Weather', 'Road Closure'],
      assignedRoute: [
        { lat: 29.7604, lng: -95.3698 },
        { lat: 32.7767, lng: -96.7970 }, // Dallas
        { lat: 36.1627, lng: -86.7816 }, // Nashville
        { lat: 41.8781, lng: -87.6298 }
      ]
    },
    {
      shipmentId: 'SHP-003',
      origin: { lat: 47.6062, lng: -122.3321, address: 'Seattle, WA' },
      destination: { lat: 25.7617, lng: -80.1918, address: 'Miami, FL' },
      currentLocation: { lat: 39.7392, lng: -104.9903 }, // Denver
      status: 'in-transit',
      eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priorityLevel: 'High',
      riskScore: 40,
      contact: { name: 'Charlie Davis', phone: '+1-555-0303', email: 'charlie@express.com' },
      assignedRoute: [
        { lat: 47.6062, lng: -122.3321 },
        { lat: 43.6150, lng: -116.2023 }, // Boise
        { lat: 39.7392, lng: -104.9903 }, // Denver
        { lat: 32.7767, lng: -96.7970 }, // Dallas
        { lat: 25.7617, lng: -80.1918 }
      ]
    }
  ];

  await Shipment.deleteMany({});
  await Shipment.insertMany(shipments);
  console.log('Database seeded with realistic shipments!');
};

module.exports = seedShipments;
