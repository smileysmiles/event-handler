const { v4: uuidv4 } = require('uuid');
const EventValidator = require('./validateEvent');
const outbox = require('./db');

class EventDispatcher {
  constructor() {
    this.validator = new EventValidator();
    this.handlers = new Map();
  }

  async dispatch(event) {
    // Validate the event
    await this.validator.validateEvent(event);

    // Save to outbox
    await outbox.saveEvent(event);

    // Get handlers for this event type
    const handlers = this.handlers.get(event.type) || [];
    
    // Execute all handlers
    const results = await Promise.all(
      handlers.map(handler => this.executeHandler(handler, event))
    );

    return results;
  }

  async executeHandler(handler, event) {
    try {
      // Convert version to number for easier comparison
      const version = parseFloat(event.version);
      
      // Execute the appropriate handler based on version
      if (handler.version && version >= handler.version) {
        return await handler.fn(event);
      } else if (!handler.version) {
        // Handler without version handles all versions
        return await handler.fn(event);
      }
    } catch (error) {
      console.error(`Error executing handler for event ${event.id}:`, error);
      throw error;
    }
  }

  on(eventType, handler, version) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType).push({
      fn: handler,
      version: version
    });
  }
}

module.exports = EventDispatcher; 