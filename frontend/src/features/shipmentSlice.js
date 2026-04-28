import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchShipments = createAsyncThunk('shipments/fetchShipments', async () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const response = await axios.get(`${API_URL}/api/shipments`);
  return response.data;
});

const shipmentSlice = createSlice({
  name: 'shipments',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    updateShipmentLocation: (state, action) => {
      const { id, lat, lng } = action.payload;
      const shipment = state.items.find(s => s._id === id);
      if (shipment) {
        shipment.currentLocation = { lat, lng };
      }
    },
    updateShipmentStatus: (state, action) => {
      const { id, riskScore, status, eta, assignedRoute } = action.payload;
      const shipment = state.items.find(s => s._id === id);
      if (shipment) {
        if (riskScore !== undefined) shipment.riskScore = riskScore;
        if (status) shipment.status = status;
        if (eta) shipment.eta = eta;
        if (assignedRoute) shipment.assignedRoute = assignedRoute;
      }
    },
    addShipment: (state, action) => {
      state.items.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShipments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchShipments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchShipments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { updateShipmentLocation, updateShipmentStatus, addShipment } = shipmentSlice.actions;
export default shipmentSlice.reducer;
