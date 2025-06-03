const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs').promises;
const path = require('path');

class EventValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.schemas = new Map();
  }

  async loadSchema(eventType, version) {
    // Convert version from "1.0" to "v1" format
    const versionFile = `v${version.split('.')[0]}`;
    const schemaPath = path.join(__dirname, 'schemas', eventType, `${versionFile}.json`);
    const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));
    this.schemas.set(`${eventType}:${version}`, schema);
    return schema;
  }

  async validateEvent(event) {
    // Load envelope schema if not already loaded
    if (!this.schemas.has('envelope')) {
      const envelopeSchema = JSON.parse(
        await fs.readFile(path.join(__dirname, 'schemas', 'EventEnvelope.json'), 'utf8')
      );
      this.schemas.set('envelope', envelopeSchema);
    }

    // Validate envelope
    const validateEnvelope = this.ajv.compile(this.schemas.get('envelope'));
    if (!validateEnvelope(event)) {
      throw new Error(`Invalid event envelope: ${JSON.stringify(validateEnvelope.errors)}`);
    }

    // Load and validate event-specific schema
    const schemaKey = `${event.type}:${event.version}`;
    if (!this.schemas.has(schemaKey)) {
      await this.loadSchema(event.type, event.version);
    }

    const validateData = this.ajv.compile(this.schemas.get(schemaKey));
    if (!validateData(event.data)) {
      throw new Error(`Invalid event data: ${JSON.stringify(validateData.errors)}`);
    }

    return true;
  }
}

module.exports = EventValidator; 