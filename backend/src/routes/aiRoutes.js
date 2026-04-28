const express = require('express');
const { recommendRoute } = require('../services/ai/decisionEngine');
const { simulateScenario } = require('../services/simulation/whatIfService');
const { getTimeline } = require('../services/simulation/replayService');
const { chatQuery } = require('../services/ai/chatBot');
const router = express.Router();

router.post('/recommend-route', recommendRoute);
router.post('/what-if', simulateScenario);
router.get('/replay', getTimeline);
router.post('/chat', chatQuery);

module.exports = router;
