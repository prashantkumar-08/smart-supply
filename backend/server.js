require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('./src/routes/authRoutes');
const shipmentRoutes = require('./src/routes/shipmentRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

const app = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] }
});

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Set socket io on app instance so controllers can use it
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/ai', aiRoutes);

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Database and Server Startup
let mongoServer;
const seedShipments = require('./seed');
const Shipment = require('./src/models/Shipment');

const simulateMovement = async () => {
  try {
    const shipments = await Shipment.find({ status: { $in: ['in-transit', 'delayed'] } });
    for (let shipment of shipments) {
      if (!shipment.assignedRoute || shipment.assignedRoute.length < 2) continue;
      
      // Super simplified movement logic for demo: jitter current location slightly towards destination
      const dest = shipment.destination;
      const curr = shipment.currentLocation;
      
      const distLat = dest.lat - curr.lat;
      const distLng = dest.lng - curr.lng;
      
      // If very close, mark delivered
      if (Math.abs(distLat) < 0.1 && Math.abs(distLng) < 0.1) {
        shipment.status = 'delivered';
        shipment.currentLocation = dest;
      } else {
        // Move 5% towards destination
        shipment.currentLocation.lat += distLat * 0.05;
        shipment.currentLocation.lng += distLng * 0.05;
      }
      
      await shipment.save();
      io.emit('location-update', { id: shipment._id, lat: shipment.currentLocation.lat, lng: shipment.currentLocation.lng, status: shipment.status });
    }
  } catch (err) {
    console.error('Simulation error:', err);
  }
};

const startServer = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    // Fallback to memory server ONLY if explicitly running in local dev without a URI
    if (!mongoUri && process.env.NODE_ENV !== 'production') {
      console.log('No MONGO_URI found. Starting ephemeral in-memory MongoDB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    } else if (!mongoUri) {
      throw new Error('MONGO_URI is missing in production environment');
    }
    
    await mongoose.connect(mongoUri, { dbName: 'smart-supply-chain' });
    console.log(`MongoDB connected: ${mongoUri.split('@').pop()}`); // Hide password in logs
    
    // Seed initial data ONLY if using memory server or explicitly requested
    if (!process.env.MONGO_URI || process.env.SEED_DB === 'true') {
      await seedShipments();
    }
    
    // Start background simulation
    setInterval(simulateMovement, 3000);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

startServer();
