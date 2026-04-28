const express = require('express');
const { getShipments, createShipment, updateShipmentLocation, simulateDisruption, optimizeRoute, applyOptimization } = require('../controllers/shipmentController');
const router = express.Router();

router.get('/', getShipments);
router.post('/', createShipment);
router.patch('/:id/location', updateShipmentLocation);
router.post('/:id/disrupt', simulateDisruption);
router.post('/:id/optimize', optimizeRoute);
router.post('/:id/apply-route', applyOptimization);

module.exports = router;
