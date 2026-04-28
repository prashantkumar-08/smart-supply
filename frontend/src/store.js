import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import shipmentReducer from './features/shipmentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shipments: shipmentReducer,
  },
});
