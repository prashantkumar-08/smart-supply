const EventEmitter = require('events');

class RedisMock extends EventEmitter {
  constructor() {
    super();
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, options = {}) {
    this.store.set(key, value);
    if (options.EX) {
      setTimeout(() => this.store.delete(key), options.EX * 1000);
    }
    return 'OK';
  }

  async publish(channel, message) {
    this.emit(`message:${channel}`, message);
    return 1;
  }

  async subscribe(channel, callback) {
    this.on(`message:${channel}`, callback);
  }
}

// Singleton instance
const redisClient = new RedisMock();
module.exports = redisClient;
