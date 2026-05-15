const { Kafka } = require('kafkajs');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: KAFKA_BROKERS,
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

const producer = kafka.producer();

let isConnected = false;

const connect = async () => {
  try {
    await producer.connect();
    isConnected = true;
    console.log('[KafkaProducer] Connected to Kafka');
  } catch (err) {
    console.error('[KafkaProducer] Failed to connect:', err.message);
    // Retry after delay
    setTimeout(connect, 5000);
  }
};

// Topics
const TOPICS = {
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_UPDATED: 'booking.updated'
};

const publishEvent = async (topic, event) => {
  if (!isConnected) {
    console.warn('[KafkaProducer] Not connected, skipping event publish');
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: event.bookingId || event.id || 'unknown',
          value: JSON.stringify({
            ...event,
            timestamp: new Date().toISOString()
          })
        }
      ]
    });
    console.log(`[KafkaProducer] Event published to ${topic}:`, event.bookingId || event.id);
  } catch (err) {
    console.error(`[KafkaProducer] Failed to publish to ${topic}:`, err.message);
  }
};

const disconnect = async () => {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
    console.log('[KafkaProducer] Disconnected');
  }
};

module.exports = {
  connect,
  disconnect,
  publishEvent,
  TOPICS
};