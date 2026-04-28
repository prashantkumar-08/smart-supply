const EventLog = require('../../models/EventLog');

exports.getTimeline = async (req, res) => {
  try {
    // Fetch logs sorted chronologically
    const logs = await EventLog.find({}).sort({ timestamp: 1 }).lean();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
